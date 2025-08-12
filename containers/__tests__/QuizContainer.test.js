// containers/__tests__/QuizContainer.test.js
import React from 'react';
import { render, act } from '@testing-library/react-native';

/**
 * Unit test scope:
 * - Exercises QuizContainer orchestration in isolation.
 * - Presentational view is replaced with a prop-capturing stub.
 * - Device bridges (AV, Haptics, Notifications, AsyncStorage) and navigation hooks are mocked.
 * - Supabase calls are intercepted at the module boundary.
 * - Timers are faked to deterministically advance the 1.5s post-submit delay.
 */

// ---------------- Timer setup ----------------
// Use fake timers for deterministic control over the quiz completion delay.
beforeEach(() => {
  jest.useFakeTimers();
});
afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
  jest.clearAllMocks();
});

// ---------------- TurboModule guard ----------------
// RN 0.73+ may call both get() and getEnforcing(); return benign objects to avoid crashes.
jest.mock('react-native/Libraries/TurboModule/TurboModuleRegistry', () => ({
  get: () => ({}),
  getEnforcing: () => ({}),
}));

// ---------------- Keep useFocusEffect passive ----------------
// Ensure focus effects run synchronously without attaching real navigation listeners.
jest.mock('@react-navigation/native', () => ({
  useFocusEffect: (cb) => {
    const cleanup = cb?.();
    return typeof cleanup === 'function' ? cleanup : undefined;
  },
}), { virtual: true });

// ---------------- Audio/Haptics/Notifications/Storage ----------------
// Stub out AV sound methods, haptic notifications, scheduled notification cancellation,
// and AsyncStorage setItem to avoid hitting native modules.
const mockUnloadAsync = jest.fn(async () => {});
const mockLoadAsync   = jest.fn(async () => {});
const mockPlayAsync   = jest.fn(async () => {});

jest.mock('expo-av', () => ({
  Audio: {
    Sound: jest.fn().mockImplementation(() => ({
      unloadAsync: mockUnloadAsync,
      loadAsync:   mockLoadAsync,
      playAsync:   mockPlayAsync,
    })),
  },
}));

jest.mock('expo-haptics', () => ({
  NotificationFeedbackType: { Success: 'success', Error: 'error' },
  notificationAsync: jest.fn(async () => {}),
}));

const mockCancelAllScheduledNotificationsAsync = jest.fn(async () => {});
jest.mock('expo-notifications', () => ({
  cancelAllScheduledNotificationsAsync: () =>
    mockCancelAllScheduledNotificationsAsync(),
}));

const mockSetItem = jest.fn(async () => {});
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: (...args) => mockSetItem(...args),
}));

// ---------------- Views & utils ----------------
// Replace QuizView with a null renderer that captures the latest props to drive the container.
const mockCaptureQuizView = jest.fn(() => null);
jest.mock('../../views/QuizView', () => ({
  __esModule: true,
  default: function QuizView(props) {
    mockCaptureQuizView(props);
    return null;
  },
}));

// Daily result saver mocked to assert calls on the daily path.
const mockSaveDailyQuizResult = jest.fn(async () => {});
jest.mock('../../utils/saveDailyQuizResult', () => ({
  saveDailyQuizResult: (...args) => mockSaveDailyQuizResult(...args),
}));

// Game settings flags; toggle per test to simulate sound/vibration user prefs.
let mockIsSoundEnabled = false;
let mockIsVibrationEnabled = false;
jest.mock('../../utils/gameSettings', () => ({
  isSoundEnabled: async () => mockIsSoundEnabled,
  isVibrationEnabled: async () => mockIsVibrationEnabled,
}));

// ---------------- Supabase auth/insert ----------------
// Intercept quiz_history insert and auth.getUser. No real network calls occur.
const mockInsert = jest.fn(async () => ({ data: null, error: null }));
const mockGetUser = jest.fn(async () => ({ data: { user: { id: 'user-123' } } }));
jest.mock('../../supabase', () => ({
  supabase: {
    from: () => ({ insert: mockInsert }),
    auth: { getUser: mockGetUser },
  },
}));

// ---------------- Helpers ----------------
// Build a route with sensible defaults; individual tests override as needed.
function makeRoute({
  quizSetId = 'cat9_q1',
  quizTitle = '#1 General Knowledge',
  difficulty = 'hard',
  questions = [
    {
      question: '2 + 2 = ?',
      correct_answer: '4',
      incorrect_answers: ['1', '2', '3'],
    },
  ],
} = {}) {
  return { params: { quizSetId, quizTitle, difficulty, questions } };
}

// Render with a minimal navigation stub; returns navigation for assertions.
function renderWithNav(routeOpts = {}) {
  const route = makeRoute(routeOpts);
  const unsub = jest.fn();
  const navigation = {
    addListener: jest.fn(() => unsub),
    dispatch: jest.fn(),
    navigate: jest.fn(),
  };
  const QuizContainer = require('../QuizContainer').default;
  render(<QuizContainer route={route} navigation={navigation} />);
  return { navigation, route };
}

// Let React flush microtasks/state to observe subsequent renders.
const flush = () => Promise.resolve();

// ---------------- Tests ----------------
describe('QuizContainer', () => {
  test('submits a single non-daily question (correct, no hint) and inserts history', async () => {
    mockIsSoundEnabled = false;
    mockIsVibrationEnabled = false;

    const { navigation } = renderWithNav({
      quizTitle: '#1 General Knowledge',
      difficulty: 'hard', // totalTime = 30
      questions: [
        {
          question: 'Capital of France?',
          correct_answer: 'Paris',
          incorrect_answers: ['Lyon', 'Marseille', 'Nice'],
        },
      ],
    });

    // Allow initial effects to run (questionData set)
    await act(async () => { await flush(); });
    let props = mockCaptureQuizView.mock.calls.at(-1)[0];

    // Select correct answer
    await act(async () => {
      props.setSelected('Paris');
      await flush();
    });
    props = mockCaptureQuizView.mock.calls.at(-1)[0];

    // Submit and advance the 1500ms post-submit delay
    await act(async () => { await props.handleSubmit(); });
    await act(async () => { jest.advanceTimersByTime(1500); });
    await act(async () => { await flush(); });

    expect(mockInsert).toHaveBeenCalledTimes(1);
    expect(navigation.navigate).toHaveBeenCalledWith(
      'ResultContainer',
      expect.objectContaining({
        totalQuestions: 1,
        correct: 1,
        incorrect: 0,
        unanswered: 0,
        xpEarned: expect.any(Number),
        reviewData: expect.any(Array),
        categoryTitle: '#1 General Knowledge',
      })
    );
  });

  test('daily quiz path saves result, cancels notifications, stores lastDailyQuizDate', async () => {
    const { navigation } = renderWithNav({
      quizTitle: 'Daily Quiz - 2025-07-01',
      questions: [
        {
          question: '3 * 3 = ?',
          correct_answer: '9',
          incorrect_answers: ['6', '12', '3'],
        },
      ],
    });

    await act(async () => { await flush(); });
    let props = mockCaptureQuizView.mock.calls.at(-1)[0];

    await act(async () => {
      props.setSelected('9');
      await flush();
    });
    props = mockCaptureQuizView.mock.calls.at(-1)[0];

    await act(async () => { await props.handleSubmit(); });
    await act(async () => { jest.advanceTimersByTime(1500); });
    await act(async () => { await flush(); });

    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockSaveDailyQuizResult).toHaveBeenCalledTimes(1);
    expect(mockCancelAllScheduledNotificationsAsync).toHaveBeenCalledTimes(1);
    expect(mockSetItem).toHaveBeenCalledWith('lastDailyQuizDate', expect.any(String));
    expect(navigation.navigate).toHaveBeenCalledWith(
      'ResultContainer',
      expect.objectContaining({
        totalQuestions: 1,
        correct: 1,
        incorrect: 0,
        unanswered: 0,
        xpEarned: expect.any(Number),
      })
    );
  });

  test('hint halves XP for a correct answer', async () => {
    const { navigation } = renderWithNav({
      quizTitle: '#9 Math',
      difficulty: 'hard',
      questions: [
        {
          question: '10 / 2 = ?',
          correct_answer: '5',
          incorrect_answers: ['2', '4', '10'],
        },
      ],
    });

    await act(async () => { await flush(); });
    let props = mockCaptureQuizView.mock.calls.at(-1)[0];

    await act(async () => { props.handleHint(); await flush(); });
    props = mockCaptureQuizView.mock.calls.at(-1)[0];

    await act(async () => { props.setSelected('5'); await flush(); });
    props = mockCaptureQuizView.mock.calls.at(-1)[0];

    await act(async () => { await props.handleSubmit(); });
    await act(async () => { jest.advanceTimersByTime(1500); });
    await act(async () => { await flush(); });

    expect(navigation.navigate).toHaveBeenCalled();
    const navArgs = navigation.navigate.mock.calls.find(
      ([screen]) => screen === 'ResultContainer'
    )[1];

    expect(navArgs.xpEarned).toBeGreaterThan(0);
    expect(navArgs.xpEarned).toBeLessThanOrEqual(50);
  });

  test('unanswered submission counts as unanswered and yields 0 XP', async () => {
    const { navigation } = renderWithNav({
      quizTitle: '#2 GK',
      questions: [
        {
          question: 'Sky color?',
          correct_answer: 'Blue',
          incorrect_answers: ['Green', 'Red', 'Yellow'],
        },
      ],
    });

    await act(async () => { await flush(); });
    let props = mockCaptureQuizView.mock.calls.at(-1)[0];

    await act(async () => { await props.handleSubmit(); });
    await act(async () => { jest.advanceTimersByTime(1500); });
    await act(async () => { await flush(); });

    expect(navigation.navigate).toHaveBeenCalled();
    const [, resultParams] = navigation.navigate.mock.calls.find(
      ([screen]) => screen === 'ResultContainer'
    );

    expect(resultParams.correct).toBe(0);
    expect(resultParams.incorrect).toBe(0);
    expect(resultParams.unanswered).toBe(1);
    expect(resultParams.xpEarned).toBe(0);
  });
});
