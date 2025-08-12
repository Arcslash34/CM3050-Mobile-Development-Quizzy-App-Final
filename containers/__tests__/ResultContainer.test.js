// containers/__tests__/ResultContainer.test.js
import React from 'react';
import { render, act } from '@testing-library/react-native';

/**
 * Unit test scope:
 * - Exercises ResultContainer orchestration in isolation.
 * - Presentational view is replaced with a prop-capturing stub.
 * - Navigation hooks run synchronously; hardware back is simulated via BackHandler spies.
 * - Supabase calls are mocked at the module boundary (no network).
 * - No native UI is invoked; assertions are deterministic and synchronous.
 */

// ---- RN guards (keeps RN 0.73+ happy in Jest)
// Provide benign objects for TurboModuleRegistry calls so RN internals don't crash in Node.
jest.mock('react-native/Libraries/TurboModule/TurboModuleRegistry', () => ({
  get: () => ({}),
  getEnforcing: () => ({}),
}));

// ---- Mock NativeDeviceInfo so RN internals don't crash in Jest
// A minimal Dimensions shape is enough for components/utilities that consult RN constants.
jest.mock('react-native/Libraries/Utilities/NativeDeviceInfo', () => ({
  getConstants: () => ({
    Dimensions: {
      windowPhysicalPixels: { width: 1080, height: 1920, scale: 2, fontScale: 2 },
    },
  }),
}));

// ---- Mock BackHandler behavior using spies (do not overwrite the object)
// Keep object identity intact by spying on addEventListener/removeEventListener,
// while storing listeners in a local registry for test-driven invocation.
const mockBackHandler = {
  listeners: {},
  addEventListener: jest.fn((event, handler) => {
    mockBackHandler.listeners[event] = handler;
    return { remove: jest.fn(() => { delete mockBackHandler.listeners[event]; }) };
  }),
  removeEventListener: jest.fn((event) => { delete mockBackHandler.listeners[event]; }),
  mockPressBack: () => {
    const fn = mockBackHandler.listeners['hardwareBackPress'];
    return fn ? fn() : false;
  },
};

const RN = require('react-native');
jest.spyOn(RN.BackHandler, 'addEventListener')
  .mockImplementation((event, handler) => {
    mockBackHandler.addEventListener(event, handler);
    return { remove: jest.fn(() => mockBackHandler.removeEventListener(event)) };
  });
jest.spyOn(RN.BackHandler, 'removeEventListener')
  .mockImplementation((event) => mockBackHandler.removeEventListener(event));

// Keep a handle to use in tests
const PatchedBackHandler = RN.BackHandler;

// ---- Keep useFocusEffect passive but executed
// Execute the focus effect immediately and return any cleanup; avoid real navigation subscriptions.
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (cb) => {
    const cleanup = cb();
    return typeof cleanup === 'function' ? cleanup : undefined;
  },
}));

// ---- Capture the props passed to the view
// Replace ResultView with a null-rendering stub that records props for assertions.
const mockCaptureResultView = jest.fn(() => null);
jest.mock('../../views/ResultView', () => ({
  __esModule: true,
  default: function ResultView(props) {
    mockCaptureResultView(props);
    return null;
  },
}));

// ---- Supabase mock
// Intercept insert into user_shares and auth.getUser; no backend involved.
const mockInsert = jest.fn(async () => ({}));
const mockGetUser = jest.fn(async () => ({ data: { user: { id: 'user-123' } } }));
jest.mock('../../supabase', () => ({
  supabase: {
    from: () => ({ insert: mockInsert }),
    auth: { getUser: (...a) => mockGetUser(...a) },
  },
}));

// ---- Helpers
// Let React flush microtasks between steps; container code is promise-driven.
const flush = () => Promise.resolve();

// Build a ResultContainer route with sensible defaults; individual tests override as needed.
function makeRoute(overrides = {}) {
  return {
    params: {
      totalQuestions: 10,
      correct: 7,
      incorrect: 2,
      unanswered: 1,
      timeTaken: 62_000, // 1m 2s
      xpEarned: 150,
      reviewData: [{ q: 'Q1', a: 'A1' }],
      categoryTitle: '#1 General Knowledge',
      ...overrides,
    },
  };
}

// Render helper with a minimal navigation stub for reset/navigate assertions.
function renderWithNav(routeOverrides = {}) {
  const route = makeRoute(routeOverrides);
  const navigation = {
    reset: jest.fn(),
    navigate: jest.fn(),
  };
  const ResultContainer = require('../ResultContainer').default;
  render(<ResultContainer route={route} navigation={navigation} />);
  return { navigation, route };
}

describe('ResultContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBackHandler.listeners = {};
  });

  test('passes calculated props (score, time string, counts, XP) to ResultView', async () => {
    renderWithNav();
    await act(async () => { await flush(); });

    const props = mockCaptureResultView.mock.calls.at(-1)[0];

    expect(props.score).toBe(70);
    expect(props.timeStr).toBe('1 m 2 s');
    expect(props.correct).toBe(7);
    expect(props.incorrect).toBe(2);
    expect(props.unanswered).toBe(1);
    expect(props.xpEarned).toBe(150);
    expect(typeof props.onShare).toBe('function');
    expect(typeof props.onReview).toBe('function');
    expect(typeof props.onClose).toBe('function');
  });

  test('onClose resets navigation to Main', async () => {
    const { navigation } = renderWithNav();
    await act(async () => { await flush(); });

    const props = mockCaptureResultView.mock.calls.at(-1)[0];
    await act(async () => { props.onClose(); });

    expect(navigation.reset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  });

  test('onReview navigates to ReviewContainer with review payload', async () => {
    const { navigation } = renderWithNav();
    await act(async () => { await flush(); });

    const props = mockCaptureResultView.mock.calls.at(-1)[0];
    await act(async () => { props.onReview(); });

    expect(navigation.navigate).toHaveBeenCalledWith(
      'ReviewContainer',
      expect.objectContaining({
        reviewData: [{ q: 'Q1', a: 'A1' }],
        quizTitle: '#1 General Knowledge',
        score: 70,
        xp: 150,
      }),
    );
  });

  test('onShare → sharedAction inserts user_shares for signed-in user', async () => {
    const { Share } = require('react-native');
    jest.spyOn(Share, 'share').mockResolvedValue({ action: Share.sharedAction });

    renderWithNav();
    await act(async () => { await flush(); });

    const props = mockCaptureResultView.mock.calls.at(-1)[0];
    await act(async () => { await props.onShare(); });

    expect(Share.share).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('Score: 70%') })
    );
    expect(mockGetUser).toHaveBeenCalled();
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({ user_id: 'user-123', type: 'quiz' }));
  });

  test('onShare → dismissedAction does not insert', async () => {
    const { Share } = require('react-native');
    jest.spyOn(Share, 'share').mockResolvedValue({ action: Share.dismissedAction });

    renderWithNav();
    await act(async () => { await flush(); });

    const props = mockCaptureResultView.mock.calls.at(-1)[0];
    await act(async () => { await props.onShare(); });

    expect(mockInsert).not.toHaveBeenCalled();
  });

  test('onShare → error shows Alert', async () => {
    const { Share, Alert } = require('react-native');
    jest.spyOn(Share, 'share').mockRejectedValue(new Error('boom'));
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());

    renderWithNav();
    await act(async () => { await flush(); });

    const props = mockCaptureResultView.mock.calls.at(-1)[0];
    await act(async () => { await props.onShare(); });

    expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to share result.');
  });

  test('hardware back press closes (useFocusEffect + BackHandler)', async () => {
    const { navigation } = renderWithNav();
    await act(async () => { await flush(); });

    // Listener registered
    expect(PatchedBackHandler.addEventListener).toHaveBeenCalledWith(
      'hardwareBackPress',
      expect.any(Function)
    );

    // Simulate back press via local registry and verify navigation reset
    const handled = mockBackHandler.mockPressBack();
    expect(handled).toBe(true);
    expect(navigation.reset).toHaveBeenCalledWith({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  });
});
