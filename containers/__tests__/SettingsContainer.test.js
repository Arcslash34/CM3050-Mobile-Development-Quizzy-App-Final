// containers/__tests__/SettingsContainer.test.js
import React from 'react';
import { render, act } from '@testing-library/react-native';
import { Alert } from 'react-native';

/**
 * Unit test scope:
 * - Exercises SettingsContainer logic in isolation.
 * - Presentational view is replaced by a prop-capturing stub.
 * - External integrations (AsyncStorage, Expo Location, notifications helper,
 *   user profile utilities, Supabase, React Navigation) are mocked at the module boundary.
 * - Timers are faked for deterministic testing of delayed flows.
 * - No native UI is invoked; assertions target derived props, side-effects, and callbacks.
 */

// Timer setup (controls setTimeout/interval-driven flows deterministically)
beforeEach(() => {
  jest.useFakeTimers();
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
  jest.clearAllMocks();
});

// TurboModule guard (prevents RN internals from failing under Jest/Node)
jest.mock('react-native/Libraries/TurboModule/TurboModuleRegistry', () => ({
  get: () => ({}),
  getEnforcing: () => ({}),
}));

// Mock NativePlatformConstantsIOS (supplies safe platform constants to RN internals)
jest.mock('react-native/Libraries/Utilities/NativePlatformConstantsIOS', () => ({
  getConstants: () => ({
    forceTouchAvailable: false,
    interfaceIdiom: 'phone',
    isTesting: true,
    osVersion: '17.0',
    systemName: 'iOS',
    reactNativeVersion: { major: 0, minor: 73, patch: 0 },
    isDisableAnimations: true,
  }),
}));

// Silence RN animated warnings in test environment
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper', () => ({}), {
  virtual: true,
});

// Alert interception (prevents real dialogs; enables call assertions)
jest.spyOn(Alert, 'alert').mockImplementation(jest.fn());
global.alert = jest.fn();

// Navigation mock (injects a minimal useNavigation contract with focus lifecycle)
let mockNavigation;
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
}));

// AsyncStorage mock (in-memory Map simulates persistent key/value store)
const mockMem = new Map();
const mockGetItem = jest.fn(async (k) => (mockMem.has(k) ? mockMem.get(k) : null));
const mockSetItem = jest.fn(async (k, v) => { mockMem.set(k, v); });
const mockClear = jest.fn(async () => { mockMem.clear(); });

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: (...a) => mockGetItem(...a),
  setItem: (...a) => mockSetItem(...a),
  clear: (...a) => mockClear(...a),
}));

// Expo Location mock (permissions + geolocation + reverse geocoding)
const mockRequestPerms = jest.fn(async () => ({ status: 'granted' }));
const mockGetPos = jest.fn(async () => ({ coords: { latitude: 1, longitude: 103 } }));
const mockReverse = jest.fn(async () => [{ country: 'Malaysia', isoCountryCode: 'MY' }]);

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: (...a) => mockRequestPerms(...a),
  getCurrentPositionAsync: (...a) => mockGetPos(...a),
  reverseGeocodeAsync: (...a) => mockReverse(...a),
  Accuracy: { High: 'high' },
}));

// Notifications helper mock (schedules/cancels the daily quiz reminder)
const mockSchedule = jest.fn(async () => {});
const mockCancel = jest.fn(async () => {});

jest.mock('../../utils/notifications', () => ({
  scheduleDailyQuizNotification: (...a) => mockSchedule(...a),
  cancelDailyQuizNotification: (...a) => mockCancel(...a),
}));

// User profile utilities mock (cached + latest profile data)
const mockLoadUserProfileFromCache = jest.fn(async () => ({
  username: 'cachedU',
  avatarUrl: 'cached.png',
}));

const mockFetchAndCacheUserProfile = jest.fn(async () => ({
  username: 'latestU',
  avatarUrl: 'latest.png',
}));

jest.mock('../../utils/userProfile', () => ({
  loadUserProfileFromCache: (...a) => mockLoadUserProfileFromCache(...a),
  fetchAndCacheUserProfile: (...a) => mockFetchAndCacheUserProfile(...a),
}));

// Supabase mock with fluent method shape (from → select/update → eq → single/then)
jest.mock('../../supabase', () => {
  const mockUpdateResponse = { data: null, error: null };
  const mockSelectResponse = { 
    data: { region: 'Singapore 🇸🇬' }, 
    error: null 
  };

  return {
    supabase: {
      from: jest.fn().mockReturnThis(),
      select: jest.fn().mockReturnThis(),
      update: jest.fn().mockReturnThis(),
      eq: jest.fn().mockImplementation(() => ({
        single: jest.fn().mockResolvedValue(mockSelectResponse),
        then: (cb) => cb(mockUpdateResponse) // For update operations
      })),
      auth: {
        getUser: jest.fn().mockResolvedValue({ 
          data: { user: { id: 'u1', email: 'u1@mail.com' } } 
        }),
        signOut: jest.fn().mockResolvedValue({})
      }
    }
  };
});

// SettingsView stub (records latest props for assertions)
const mockCaptureSettingsView = jest.fn(() => null);
jest.mock('../../views/SettingsView', () => ({
  __esModule: true,
  default: function SettingsView(props) {
    mockCaptureSettingsView(props);
    return null;
  },
}));

// Render helper (injects focus listener behavior and returns nav spies)
function renderSettings() {
  const unsubscribe = jest.fn();
  mockNavigation = {
    addListener: jest.fn((evt, cb) => {
      if (evt === 'focus') cb();
      return unsubscribe;
    }),
    replace: jest.fn(),
  };
  const SettingsContainer = require('../SettingsContainer').default;
  render(<SettingsContainer />);
  return { navigation: mockNavigation, unsubscribe };
}

// Microtask drain (container code is promise-driven)
const flush = () => Promise.resolve();

// Tests
describe('SettingsContainer', () => {
  test('loads cached + latest profile on focus and initializes toggles from storage', async () => {
    mockMem.clear();
    mockMem.set('soundEnabled', 'false');
    mockMem.set('vibrationEnabled', 'true');

    renderSettings();
    await act(async () => { await flush(); });

    const props = mockCaptureSettingsView.mock.calls.at(-1)[0];

    expect(props.notificationsEnabled).toBe(true);
    expect(mockSetItem).toHaveBeenCalledWith('notificationsEnabled', 'true');
    expect(props.soundEnabled).toBe(false);
    expect(props.vibrationEnabled).toBe(true);
    expect(props.username).toBe('latestU');
    expect(props.avatarUrl).toBe('latest.png');
    expect(props.email).toBe('u1@mail.com');
    expect(props.region).toBe('Singapore 🇸🇬');
  });

  test('toggling notifications schedules/cancels + persists', async () => {
    renderSettings();
    await act(async () => { await flush(); });

    let props = mockCaptureSettingsView.mock.calls.at(-1)[0];
    await act(async () => { await props.onToggleNotifications(false); });
    
    expect(mockCancel).toHaveBeenCalled();
    expect(mockSetItem).toHaveBeenCalledWith('notificationsEnabled', 'false');

    props = mockCaptureSettingsView.mock.calls.at(-1)[0];
    await act(async () => { await props.onToggleNotifications(true); });
    
    expect(mockSchedule).toHaveBeenCalled();
    expect(mockSetItem).toHaveBeenCalledWith('notificationsEnabled', 'true');
  });

  test('sound/vibration toggles persist to storage', async () => {
    renderSettings();
    await act(async () => { await flush(); });

    const props = mockCaptureSettingsView.mock.calls.at(-1)[0];
    await act(async () => { await props.onToggleSound(true); });
    await act(async () => { await props.onToggleVibration(false); });

    expect(mockSetItem).toHaveBeenCalledWith('soundEnabled', 'true');
    expect(mockSetItem).toHaveBeenCalledWith('vibrationEnabled', 'false');
  });

  test('updateRegion: permission granted → detects, sets flag name, updates supabase', async () => {
    mockRequestPerms.mockResolvedValueOnce({ status: 'granted' });
    mockGetPos.mockResolvedValueOnce({ coords: { latitude: 3.1, longitude: 101.7 } });
    mockReverse.mockResolvedValueOnce([{ country: 'Malaysia', isoCountryCode: 'MY' }]);

    renderSettings();
    await act(async () => { await flush(); });

    let props = mockCaptureSettingsView.mock.calls.at(-1)[0];
    await act(async () => { await props.onDetectRegion(); });
    await act(async () => { await flush(); });

    const { supabase } = require('../../supabase');
    expect(supabase.from).toHaveBeenCalledWith('profiles');
    expect(supabase.update).toHaveBeenCalledWith({ region: 'Malaysia 🇲🇾' });

    props = mockCaptureSettingsView.mock.calls.at(-1)[0];
    expect(props.region).toBe('Malaysia 🇲🇾');
  });

  test('updateRegion: permission denied → shows alert and does not update', async () => {
    mockRequestPerms.mockResolvedValueOnce({ status: 'denied' });

    renderSettings();
    await act(async () => { await flush(); });

    const props = mockCaptureSettingsView.mock.calls.at(-1)[0];
    await act(async () => { await props.onDetectRegion(); });
    await act(async () => { await flush(); });

    expect(global.alert).toHaveBeenCalled();
    const { supabase } = require('../../supabase');
    expect(supabase.update).not.toHaveBeenCalled();
  });

  test('logout flow: Alert -> confirm -> signOut, clear storage, navigate to AuthWrapper', async () => {
    renderSettings();
    await act(async () => { await flush(); });

    const props = mockCaptureSettingsView.mock.calls.at(-1)[0];
    await act(async () => { props.handleLogout(); });

    const [title, message, buttons] = Alert.alert.mock.calls.at(-1);
    expect(title).toBe('Logout');
    expect(message).toBe('Are you sure you want to logout?');

    const logoutBtn = buttons.find((b) => b.text === 'Logout');
    await act(async () => { await logoutBtn.onPress(); });
    await act(async () => { await flush(); });

    const { supabase } = require('../../supabase');
    expect(supabase.auth.signOut).toHaveBeenCalled();
    expect(mockClear).toHaveBeenCalled();
    expect(mockNavigation.replace).toHaveBeenCalledWith('AuthWrapper');
  });
});
