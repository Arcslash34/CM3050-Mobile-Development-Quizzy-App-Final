// __tests__/MainNavigation.int.test.js

/**
 * Integration test scope:
 * - Validates end-to-end wiring inside MainNavigation around notification
 *   permissions, scheduling, and navigation reactions.
 * - Mocks React Navigation containers, Safe Area, Reanimated/Gesture Handler,
 *   AsyncStorage, Supabase auth, vector icons, and Expo Notifications (with a
 *   captured response listener) so only orchestration logic runs.
 * - Stubs all screens with lightweight components to avoid UI complexity.
 * - Asserts that a daily-quiz reminder is scheduled exactly once when:
 *     • notifications are enabled in storage,
 *     • permission is granted (or requested then granted),
 *     • the user is authenticated,
 *     • no identical reminder already exists, and
 *     • today’s daily quiz is not yet completed.
 * - Exercises negative paths for each gating condition, and verifies that taps
 *   on unrelated notifications are ignored while Daily Quiz taps navigate to
 *   DailyQuizWrapper.
 */

// --- mock navigation BEFORE importing MainNavigation ---
jest.mock('@react-navigation/native', () => {
  const React = require('react');
  return {
    NavigationContainer: React.forwardRef(({ children }, _ref) => children),
    useNavigation: () => ({ navigate: jest.fn(), goBack: jest.fn() }),
  };
});

jest.mock('@react-navigation/native-stack', () => {
  const React = require('react');
  return {
    createNativeStackNavigator: () => {
      const Screen = ({ component: Comp, children }) =>
        Comp ? React.createElement(Comp, {}) : children || null;
      const Navigator = ({ children }) => children;
      return { Navigator, Screen };
    },
  };
});

jest.mock('@react-navigation/bottom-tabs', () => {
  const React = require('react');
  return {
    createBottomTabNavigator: () => {
      const Screen = ({ component: Comp, children }) =>
        Comp ? React.createElement(Comp, {}) : children || null;
      const Navigator = ({ children }) => children;
      return { Navigator, Screen };
    },
  };
});

// Safe 
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const Provider = ({ children }) => children;
  return {
    SafeAreaProvider: Provider,
    SafeAreaView: ({ children }) => children,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

// Reanimated & Gesture Handler (virtual stubs)
jest.mock('react-native-reanimated', () => ({}), { virtual: true });
jest.mock('react-native-gesture-handler', () => ({}), { virtual: true });

// AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async (k) => (k === 'notificationsEnabled' ? 'true' : null)),
  setItem: jest.fn(async () => {}),
}));

// Supabase auth
jest.mock('../supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(async () => ({ data: { user: { id: 'user-1' } } })),
    },
  },
}));

// Icons
jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
  MaterialCommunityIcons: () => null,
}));

// Notifications helper (use a mock* var so Jest allows capture)
let mockScheduleDailyQuizNotification;
jest.mock('../utils/notifications', () => {
  mockScheduleDailyQuizNotification = jest.fn(async () => {});
  return { scheduleDailyQuizNotification: mockScheduleDailyQuizNotification };
});

// Daily-quiz status helper
jest.mock('../utils/quizHelpers', () => ({
  checkIfDailyQuizDone: jest.fn(async () => false),
}));

// Expo Notifications (capture listener)
let onResponseTap;
jest.mock('expo-notifications', () => ({
  getPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  requestPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  getAllScheduledNotificationsAsync: jest.fn(async () => []),
  addNotificationResponseReceivedListener: jest.fn((cb) => {
    onResponseTap = cb;
    return { remove: jest.fn() };
  }),
}));

// Lightweight screen mocks (inline factories — no out-of-scope refs)
jest.mock('../views/SplashView', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return () => React.createElement(Text, null, 'SplashView');
});
jest.mock('../authentication/AuthWrapper', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return () => React.createElement(Text, null, 'AuthWrapper');
});
jest.mock('../containers/HomeContainer', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return () => React.createElement(Text, null, 'HomeContainer');
});
jest.mock('../containers/HistoryContainer', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return () => React.createElement(Text, null, 'HistoryContainer');
});
jest.mock('../containers/RankingContainer', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return () => React.createElement(Text, null, 'RankingContainer');
});
jest.mock('../containers/ProfileContainer', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return () => React.createElement(Text, null, 'ProfileContainer');
});
jest.mock('../containers/SettingsContainer', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return () => React.createElement(Text, null, 'SettingsContainer');
});
jest.mock('../containers/AllCategoriesContainer', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return () => React.createElement(Text, null, 'AllCategoriesContainer');
});
jest.mock('../containers/QuizSetContainer', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return () => React.createElement(Text, null, 'QuizSetContainer');
});
jest.mock('../containers/QuizContainer', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return () => React.createElement(Text, null, 'QuizContainer');
});
jest.mock('../containers/ResultContainer', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return () => React.createElement(Text, null, 'ResultContainer');
});
jest.mock('../containers/ReviewContainer', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return () => React.createElement(Text, null, 'ReviewContainer');
});
jest.mock('../containers/EditProfileContainer', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return () => React.createElement(Text, null, 'EditProfileContainer');
});
jest.mock('../containers/ChangePasswordContainer', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return () => React.createElement(Text, null, 'ChangePasswordContainer');
});
jest.mock('../containers/DailyQuizWrapper', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return () => React.createElement(Text, null, 'DailyQuizWrapper');
});
jest.mock('../containers/FriendsContainer', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return () => React.createElement(Text, null, 'FriendsContainer');
});
jest.mock('../containers/MessagesContainer', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return () => React.createElement(Text, null, 'MessagesContainer');
});
jest.mock('../containers/ChatContainer', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return () => React.createElement(Text, null, 'ChatContainer');
});

// --- import React, testing lib, and the real navigator ---
import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import MainNavigation from '../MainNavigation';

// Reset and re-prime defaults before each test
beforeEach(() => {
  jest.clearAllMocks();

  const AsyncStorage = require('@react-native-async-storage/async-storage');
  AsyncStorage.getItem.mockResolvedValue('true');

  const { supabase } = require('../supabase');
  supabase.auth.getUser.mockResolvedValue({ data: { user: { id: 'user-1' } } });

  const Notifications = require('expo-notifications');
  Notifications.getPermissionsAsync.mockResolvedValue({ status: 'granted' });
  Notifications.getAllScheduledNotificationsAsync.mockResolvedValue([]);

  const quizHelpers = require('../utils/quizHelpers');
  quizHelpers.checkIfDailyQuizDone.mockResolvedValue(false);
});

// Silence console logs in tests (optional)
beforeAll(() => {
  jest.spyOn(console, 'log').mockImplementation(() => {});
});
afterAll(() => {
  console.log.mockRestore && console.log.mockRestore();
});

// ---- Base tests ----
test('schedules daily quiz notification once for enabled user who has not completed today', async () => {
  render(<MainNavigation />);
  await waitFor(() => {
    expect(mockScheduleDailyQuizNotification).toHaveBeenCalledTimes(1);
  });
});

test('navigates to DailyQuizWrapper when a notification tap is received', async () => {
  const { getByText } = render(<MainNavigation />);
  onResponseTap?.({
    notification: { request: { content: { data: { screen: 'DailyQuiz' } } } },
  });
  await waitFor(() => {
    expect(getByText('DailyQuizWrapper')).toBeTruthy();
  });
});

// ---- Additional integration cases ----
test('does NOT schedule when notifications are disabled in AsyncStorage', async () => {
  const AsyncStorage = require('@react-native-async-storage/async-storage');
  AsyncStorage.getItem.mockResolvedValueOnce('false');

  render(<MainNavigation />);
  await waitFor(() => {
    expect(mockScheduleDailyQuizNotification).not.toHaveBeenCalled();
  });
});

test('does NOT schedule when user is not logged in', async () => {
  const { supabase } = require('../supabase');
  supabase.auth.getUser.mockResolvedValueOnce({ data: { user: null } });

  render(<MainNavigation />);
  await waitFor(() => {
    expect(mockScheduleDailyQuizNotification).not.toHaveBeenCalled();
  });
});

test('does NOT schedule if a Daily Quiz notification is already scheduled', async () => {
  const Notifications = require('expo-notifications');
  Notifications.getAllScheduledNotificationsAsync.mockResolvedValueOnce([
    { content: { title: 'Daily Quiz Reminder' } },
  ]);

  render(<MainNavigation />);
  await waitFor(() => {
    expect(mockScheduleDailyQuizNotification).not.toHaveBeenCalled();
  });
});

test('does NOT schedule if today’s daily quiz is already completed', async () => {
  const quizHelpers = require('../utils/quizHelpers');
  quizHelpers.checkIfDailyQuizDone.mockResolvedValueOnce(true);

  render(<MainNavigation />);
  await waitFor(() => {
    expect(mockScheduleDailyQuizNotification).not.toHaveBeenCalled();
  });
});

test('requests permissions when not yet granted', async () => {
  const Notifications = require('expo-notifications');
  Notifications.getPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });
  Notifications.requestPermissionsAsync.mockResolvedValueOnce({ status: 'granted' });

  render(<MainNavigation />);
  await waitFor(() => {
    expect(Notifications.requestPermissionsAsync).toHaveBeenCalledTimes(1);
  });
});

test('ignores notification taps that target another screen', async () => {
  const { getByText } = render(<MainNavigation />);
  onResponseTap?.({
    notification: { request: { content: { data: { screen: 'SomethingElse' } } } },
  });
  await waitFor(() => {
    expect(getByText('SplashView')).toBeTruthy();
  });
});
