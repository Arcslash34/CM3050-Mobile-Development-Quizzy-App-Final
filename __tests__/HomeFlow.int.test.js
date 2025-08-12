// __tests__/HomeFlow.int.test.js

/**
 * Integration test scope:
 * - Exercises the Home flow using the real HomeContainer wired to a lightweight HomeView.
 * - Verifies cross-module behavior: category loading, cached vs. fresh profile, XP aggregation,
 *   local ranking, and navigation into downstream screens.
 * - Replaces native and visual concerns (Safe Area, images, child UI cards) with minimal mocks
 *   so only orchestration/flow logic is executed.
 * - Uses a Supabase double that returns deterministic XP and profile data for rank/points.
 */

// --- keep native-y deps out of the test env ---
jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const Provider = ({ children }) => children;
  return {
    SafeAreaProvider: Provider,
    SafeAreaView: ({ children }) => children,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
});

// Stub static assets referenced by HomeView
jest.mock('../assets/images/wreath.png', () => 'wreath.png', { virtual: true });
jest.mock('../assets/images/award.png', () => 'award.png', { virtual: true });
jest.mock('../assets/images/profile.png', () => 'profile.png', { virtual: true });

// Mock child presentation components to make interaction easy
jest.mock('../components/CategoryCard', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return ({ item, onPress }) =>
    React.createElement(Text, { onPress: () => onPress(item) }, item.title);
});

jest.mock('../components/DailyQuizCard', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return ({ onPress }) =>
    React.createElement(Text, { onPress }, 'Start Daily Quiz');
});

// Category source
jest.mock('../utils/categoryUtils', () => ({
  getTriviaCategories: jest.fn(async () => [
    { id: 'cat-1', title: 'Geography', img: 'geo.png' },
    { id: 'cat-2', title: 'Science', img: 'sci.png' },
  ]),
}));

// Profile cache + fetch
jest.mock('../utils/userProfile', () => ({
  loadUserProfileFromCache: jest.fn(async () => ({
    username: 'cachedUser',
    avatarUrl: 'cached.png',
  })),
  fetchAndCacheUserProfile: jest.fn(async () => ({
    id: 'u1',
    username: 'freshUser',
    avatarUrl: 'fresh.png',
  })),
}));

// Daily quiz generator
jest.mock('../utils/dailyQuiz', () => ({
  generateDailyQuiz: jest.fn(() => ({
    isDaily: true,
    questions: [{ id: 1, q: 'Q1' }],
  })),
}));

// Supabase stub for XP + ranking
jest.mock('../supabase', () => {
  const selectForQuizHistory = (table, fields) => {
    if (table === 'quiz_history' && fields === 'xp') {
      // later chained with .eq('user_id', 'u1')
      return {
        eq: jest.fn(async () => ({
          data: [{ xp: 10 }, { xp: 15 }],
          error: null,
        })),
      };
    }
    if (table === 'quiz_history' && fields === 'user_id, xp') {
      // ranking source across users
      return Promise.resolve({
        data: [
          { user_id: 'u1', xp: 25 }, // 10 + 15
          { user_id: 'u2', xp: 40 },
          { user_id: 'u3', xp: 5 },
        ],
      });
    }
    return { eq: jest.fn(async () => ({ data: [], error: null })) };
  };

  const selectForProfiles = (fields) =>
    Promise.resolve({
      data: [
        { id: 'u1', created_at: '2022-01-02T00:00:00Z' },
        { id: 'u2', created_at: '2022-01-01T00:00:00Z' },
        { id: 'u3', created_at: '2022-01-03T00:00:00Z' },
      ],
    });

  return {
    supabase: {
      from: (table) => ({
        select: (fields) =>
          table === 'profiles'
            ? selectForProfiles(fields)
            : selectForQuizHistory(table, fields),
      }),
    },
  };
});

// ---- import after mocks ----
import React from 'react';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import HomeContainer from '../containers/HomeContainer';

/**
 * Navigation test double:
 * - Captures navigate calls.
 * - Records focus listeners and exposes a manual trigger for focus.
 */
const makeNav = () => {
  const handlers = {};
  return {
    navigate: jest.fn(),
    addListener: jest.fn((evt, cb) => {
      handlers[evt] = cb;
      return () => {};
    }),
    __trigger: (evt) => handlers[evt]?.(),
  };
};

describe('Home flow (HomeContainer + HomeView)', () => {
  it('shows cached username, then fresh username after focus; computes XP and rank', async () => {
    jest.useFakeTimers();

    // Delay fresh fetch so cached state is visible first
    const userProfile = require('../utils/userProfile');
    userProfile.fetchAndCacheUserProfile.mockImplementationOnce(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () => resolve({ id: 'u1', username: 'freshUser', avatarUrl: 'fresh.png' }),
            50
          )
        )
    );

    const navigation = makeNav();
    const { getByText, queryByText } = render(<HomeContainer navigation={navigation} />);

    // Simulate screen focus to kick off data loading
    await act(async () => {
      navigation.__trigger('focus');
    });

    // Cached shows first
    await waitFor(() => expect(getByText(/Hi, cachedUser/i)).toBeTruthy());

    // Let the delayed fresh fetch resolve
    act(() => {
      jest.advanceTimersByTime(60);
    });

    // Fresh replaces cached; also check derived XP/rank text
    await waitFor(() => expect(getByText(/Hi, freshUser/i)).toBeTruthy());
    expect(queryByText(/Hi, cachedUser/i)).toBeNull();

    // Derived values
    expect(getByText('25')).toBeTruthy(); // Reward points
    expect(getByText('#2')).toBeTruthy(); // Local rank

    jest.useRealTimers();
  });

  it('navigates to QuizSet with category when a category is pressed', async () => {
    const navigation = makeNav();
    const { getByText } = render(<HomeContainer navigation={navigation} />);

    await act(async () => {
      navigation.__trigger('focus');
    });

    // Wait until category list renders
    await waitFor(() => expect(getByText('Geography')).toBeTruthy());

    // Press category and verify navigation payload
    fireEvent.press(getByText('Geography'));
    expect(navigation.navigate).toHaveBeenCalledWith(
      'QuizSet',
      expect.objectContaining({ category: expect.objectContaining({ title: 'Geography' }) })
    );
  });

  it('navigates to QuizContainer with generated daily quiz payload', async () => {
    const navigation = makeNav();
    const { getByText } = render(<HomeContainer navigation={navigation} />);

    await act(async () => {
      navigation.__trigger('focus');
    });

    // Press the Daily Quiz card trigger
    fireEvent.press(getByText('Start Daily Quiz'));
    expect(navigation.navigate).toHaveBeenCalledWith(
      'QuizContainer',
      expect.objectContaining({ isDaily: true, questions: expect.any(Array) })
    );
  });

  it('navigates to AllCategories when "Load All" is pressed', async () => {
    const navigation = makeNav();
    const { getByText } = render(<HomeContainer navigation={navigation} />);

    await act(async () => {
      navigation.__trigger('focus');
    });

    fireEvent.press(getByText('Load All'));
    expect(navigation.navigate).toHaveBeenCalledWith('AllCategories');
  });
});
