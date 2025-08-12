// containers/__tests__/HomeContainer.test.js
import React from 'react';
import { render, act } from '@testing-library/react-native';

/**
 * Unit test scope:
 * - Exercises HomeContainer logic in isolation.
 * - View is replaced by a prop-capturing stub.
 * - Mocks categoryUtils, userProfile cache/fetch, dailyQuiz, and Supabase queries.
 * - Verifies computed props (XP, rank, categories) and navigation handlers.
 */

/**
 * Resolve the container via CJS `require` so the test remains robust
 * whether the module is emitted as CJS or ESM. If neither path works,
 * fail early with a helpful error.
 */
const mod = require('../HomeContainer');
const HomeContainer = mod.default ?? mod;
if (!HomeContainer) {
  throw new Error('HomeContainer import resolved to undefined');
}

/* -----------------------------------------------------------------------------
 * Global mocks for RN internals (noise reducers / native gaps)
 * ---------------------------------------------------------------------------*/

// Suppress RN Animated’s native-driven warnings; not needed in unit tests.
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper', () => ({}), { virtual: true });

// Reanimated depends on native; a minimal virtual stub is sufficient here.
jest.mock('react-native-reanimated', () => ({}), { virtual: true });

/* -----------------------------------------------------------------------------
 * View + domain util doubles
 * - Replace the presentational view with a capture-only component to allow
 *   assertions on the container’s derived props and handlers for each render.
 * - Mock domain utilities to return deterministic values.
 * ---------------------------------------------------------------------------*/

const mockHomeView = jest.fn(() => null);
jest.mock('../../views/HomeView', () => ({
  __esModule: true,
  default: function HomeView(props) {
    mockHomeView(props);
    return null;
  },
}));

const mockGetTriviaCategories = jest.fn();
jest.mock('../../utils/categoryUtils', () => ({
  getTriviaCategories: (...args) => mockGetTriviaCategories(...args),
}));

const mockLoadUserProfileFromCache = jest.fn();
const mockFetchAndCacheUserProfile = jest.fn();
jest.mock('../../utils/userProfile', () => ({
  loadUserProfileFromCache: (...args) => mockLoadUserProfileFromCache(...args),
  fetchAndCacheUserProfile: (...args) => mockFetchAndCacheUserProfile(...args),
}));

const mockGenerateDailyQuiz = jest.fn();
jest.mock('../../utils/dailyQuiz', () => ({
  generateDailyQuiz: (...args) => mockGenerateDailyQuiz(...args),
}));

/* -----------------------------------------------------------------------------
 * Supabase module double
 * Provides a minimal chainable `from().select().eq()` that returns
 * predictable data. Enables XP and local ranking computation without a backend.
 * ---------------------------------------------------------------------------*/

const quizHistoryData = [
  { user_id: 'u1', xp: 50 },
  { user_id: 'u2', xp: 100 },
  { user_id: 'u1', xp: 20 },
];

const profilesData = [
  { id: 'u1', created_at: '2025-07-01T00:00:00.000Z' },
  { id: 'u2', created_at: '2025-07-02T00:00:00.000Z' },
];

function makeSelectable(table, columns) {
  const resultForTable = () => {
    if (table === 'quiz_history') {
      if (columns.includes('user_id')) return { data: quizHistoryData, error: null };
      if (columns.includes('xp')) return { data: quizHistoryData.map(({ xp }) => ({ xp })), error: null };
    }
    if (table === 'profiles') return { data: profilesData, error: null };
    return { data: [], error: null };
  };

  // Minimal thenable with an `.eq()` branch that mirrors the container’s usage.
  const thenable = {
    then: (resolve) => Promise.resolve(resultForTable()).then(resolve),
    catch: () => thenable,
    eq: (field, val) => {
      if (table === 'quiz_history' && field === 'user_id') {
        const filtered = quizHistoryData.filter((r) => r.user_id === val).map(({ xp }) => ({ xp }));
        return Promise.resolve({ data: filtered, error: null });
      }
      return Promise.resolve({ data: [], error: null });
    },
  };
  return thenable;
}

const mockSupabaseFrom = jest.fn((table) => ({
  select: (columns) => makeSelectable(table, columns),
}));

jest.mock('../../supabase', () => ({
  supabase: { from: (...args) => mockSupabaseFrom(...args) },
}));

/* -----------------------------------------------------------------------------
 * Test helpers
 * ---------------------------------------------------------------------------*/

/**
 * Renders the container with a navigation stub that records the `focus`
 * listener, allowing manual triggering of the focus lifecycle within tests.
 */
function renderWithNav() {
  let focusCb;
  const unsubscribe = jest.fn();
  const navigation = {
    addListener: jest.fn((event, cb) => {
      if (event === 'focus') focusCb = cb;
      return unsubscribe;
    }),
    navigate: jest.fn(),
  };

  render(<HomeContainer navigation={navigation} />);
  return { navigation, focusCb, unsubscribe };
}

/** Drains microtasks between awaits; useful when code awaits promises. */
const flushPromises = () => new Promise((r) => setTimeout(r, 0));

/* -----------------------------------------------------------------------------
 * Tests
 * ---------------------------------------------------------------------------*/

describe('HomeContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default happy-path utility results.
    mockGetTriviaCategories.mockResolvedValue([
      { id: 9, name: 'General Knowledge' },
      { id: 18, name: 'Computers' },
    ]);

    mockLoadUserProfileFromCache.mockResolvedValue({
      username: 'cachedUser',
      avatarUrl: 'cached.png',
    });

    mockFetchAndCacheUserProfile.mockResolvedValue({
      id: 'u1',
      username: 'latestUser',
      avatarUrl: 'latest.png',
    });

    mockGenerateDailyQuiz.mockReturnValue({ daily: true, seed: 123 });

    // Reset the supabase entry to the default chain before each test.
    const { supabase } = require('../../supabase');
    supabase.from = (...args) => mockSupabaseFrom(...args);
  });

  /**
   * Baseline render (before focus): verifies initial, empty props are wired
   * to the view while no data has been loaded yet.
   */
  test('initial render shows defaults before focus', () => {
    const unsubscribe = jest.fn();
    const navigation = {
      addListener: jest.fn(() => unsubscribe),
      navigate: jest.fn(),
    };

    render(<HomeContainer navigation={navigation} />);

    const firstProps = mockHomeView.mock.calls[0][0];
    expect(firstProps.username).toBe('');
    expect(firstProps.avatarUrl).toBeNull();
    expect(firstProps.categoryData).toEqual([]);
    expect(firstProps.rewardPoints).toBe(0);
    expect(firstProps.localRank).toBe('-');
  });

  /**
   * On focus: loads categories, cached profile (shown first), latest profile,
   * XP totals, and local ranking. Asserts derived props and handler wiring.
   */
  test('loads data on focus and passes computed props to HomeView', async () => {
    const { focusCb } = renderWithNav();

    await act(async () => {
      await focusCb();
    });

    const props = mockHomeView.mock.calls.at(-1)[0];

    expect(props.username).toBe('latestUser');
    expect(props.avatarUrl).toBe('latest.png');
    expect(props.categoryData).toEqual([
      { id: 9, name: 'General Knowledge' },
      { id: 18, name: 'Computers' },
    ]);
    expect(props.rewardPoints).toBe(70);   // 50 + 20 for u1
    expect(props.localRank).toBe('#2');    // u2=100, u1=70

    // Handlers exposed by the view should all be callable functions.
    expect(typeof props.onCategoryPress).toBe('function');
    expect(typeof props.onDailyQuizPress).toBe('function');
    expect(typeof props.onProfilePress).toBe('function');
    expect(typeof props.onRankingPress).toBe('function');
    expect(typeof props.onAllCategoriesPress).toBe('function');
  });

  /**
   * Verifies that each handler triggers the expected navigation call with
   * the appropriate payload.
   */
  test('handlers navigate with correct params', async () => {
    const { navigation, focusCb } = renderWithNav();

    await act(async () => {
      await focusCb();
    });

    const props = mockHomeView.mock.calls.at(-1)[0];

    await act(async () => {
      props.onCategoryPress({ id: 18, name: 'Computers' });
    });
    expect(navigation.navigate).toHaveBeenCalledWith('QuizSet', {
      category: { id: 18, name: 'Computers' },
    });

    await act(async () => {
      props.onDailyQuizPress();
    });
    expect(navigation.navigate).toHaveBeenCalledWith('QuizContainer', {
      daily: true,
      seed: 123,
    });

    await act(async () => props.onProfilePress());
    expect(navigation.navigate).toHaveBeenCalledWith('Profile');

    await act(async () => props.onRankingPress());
    expect(navigation.navigate).toHaveBeenCalledWith('Ranking');

    await act(async () => props.onAllCategoriesPress());
    expect(navigation.navigate).toHaveBeenCalledWith('AllCategories');
  });

  /**
   * Lifecycle ordering: cached profile should render first while the latest
   * network profile is pending, followed by a re-render with the latest values.
   */
  test('shows cached profile first, then overrides with latest', async () => {
    let resolveLatest;
    mockLoadUserProfileFromCache.mockResolvedValueOnce({
      username: 'cachedU',
      avatarUrl: 'cached.png',
    });
    // Keep latest pending until it is resolved within the test.
    mockFetchAndCacheUserProfile.mockImplementationOnce(
      () => new Promise((resolve) => { resolveLatest = resolve; })
    );

    let focusCb;
    const navigation = {
      addListener: jest.fn((evt, cb) => { if (evt === 'focus') focusCb = cb; return jest.fn(); }),
      navigate: jest.fn(),
    };
    render(<HomeContainer navigation={navigation} />);

    act(() => { focusCb(); });

    // First paint includes cached data.
    await act(async () => { await flushPromises(); });

    const sawCached = mockHomeView.mock.calls.some(
      ([p]) => p.username === 'cachedU' && p.avatarUrl === 'cached.png'
    );
    expect(sawCached).toBe(true);

    // Resolve latest and verify a re-render with updated values.
    await act(async () => {
      resolveLatest({ id: 'u1', username: 'latestU', avatarUrl: 'latest.png' });
      await flushPromises();
    });

    const finalProps = mockHomeView.mock.calls.at(-1)[0];
    expect(finalProps.username).toBe('latestU');
    expect(finalProps.avatarUrl).toBe('latest.png');
  });

  /**
   * If `getTriviaCategories` returns `undefined`, the container should pass
   * that through (no coercion), and the component must still render safely.
   */
  test('keeps categoryData undefined when getTriviaCategories fails (component does not coerce)', async () => {
    mockGetTriviaCategories.mockResolvedValueOnce(undefined);

    let focusCb;
    const navigation = {
      addListener: jest.fn((evt, cb) => { if (evt==='focus') focusCb = cb; return jest.fn(); }),
      navigate: jest.fn(),
    };
    render(<HomeContainer navigation={navigation} />);

    await act(async () => { await focusCb(); });

    const props = mockHomeView.mock.calls.at(-1)[0];
    expect(props.categoryData).toBeUndefined();
    expect(props.username).toBeDefined(); // sanity check on other props
  });

  /**
   * If the fetched profile does not exist in `profiles`, rank cannot be computed
   * and should remain "-".
   */
  test('rank stays "-" when current user is not in profiles', async () => {
    mockFetchAndCacheUserProfile.mockResolvedValueOnce({
      id: 'u3',
      username: 'u3',
      avatarUrl: 'u3.png',
    });

    const { supabase } = require('../../supabase');
    supabase.from = jest.fn((table) => ({
      select: (cols) => ({
        then: (resolve) => {
          const payload =
            table === 'quiz_history'
              ? { data: [{ user_id: 'u1', xp: 50 }], error: null }
              : table === 'profiles'
              ? { data: [
                    { id: 'u1', created_at: new Date().toISOString() },
                    { id: 'u2', created_at: new Date().toISOString() },
                ], error: null }
              : { data: [], error: null };
          return Promise.resolve(payload).then(resolve);
        },
        catch: () => {},
        eq: () => Promise.resolve({ data: [], error: null }),
      }),
    }));

    let focusCb;
    const navigation = {
      addListener: jest.fn((evt, cb) => { if (evt==='focus') focusCb = cb; return jest.fn(); }),
      navigate: jest.fn(),
    };
    render(<HomeContainer navigation={navigation} />);

    await act(async () => { await focusCb(); });

    const props = mockHomeView.mock.calls.at(-1)[0];
    expect(props.localRank).toBe('-');
  });

  /**
   * With no history and no profiles, both XP and rank should remain defaults.
   */
  test('no history/profiles keeps XP 0 and rank "-"', async () => {
    const { supabase } = require('../../supabase');
    supabase.from = jest.fn(() => ({
      select: () => ({
        then: (resolve) => Promise.resolve({ data: [], error: null }).then(resolve),
        catch: () => {},
        eq: () => Promise.resolve({ data: [], error: null }),
      }),
    }));

    const { focusCb } = renderWithNav();
    await act(async () => { await focusCb(); });

    const props = mockHomeView.mock.calls.at(-1)[0];
    expect(props.rewardPoints).toBe(0);
    expect(props.localRank).toBe('-');
  });

  /**
   * Tie-breaker: when XP is equal, earlier `created_at` yields a higher rank.
   */
  test('ranking tie-breaker uses created_at ascending when XP equal', async () => {
    const { supabase } = require('../../supabase');

    const quizHistoryDataTie = [
      { user_id: 'u1', xp: 100 },
      { user_id: 'u2', xp: 100 },
    ];
    const profilesTie = [
      { id: 'u1', created_at: '2025-07-01T00:00:00.000Z' }, // earlier -> higher
      { id: 'u2', created_at: '2025-07-02T00:00:00.000Z' },
    ];

    supabase.from = jest.fn((table) => ({
      select: (cols) => ({
        then: (resolve) => {
          const payload =
            table === 'quiz_history'
              ? {
                  data: cols.includes('user_id')
                    ? quizHistoryDataTie
                    : quizHistoryDataTie.map(({ xp }) => ({ xp })),
                  error: null,
                }
              : table === 'profiles'
              ? { data: profilesTie, error: null }
              : { data: [], error: null };
          return Promise.resolve(payload).then(resolve);
        },
        catch: () => {},
        eq: (field, val) => {
          const filtered = quizHistoryDataTie
            .filter((r) => r.user_id === val)
            .map(({ xp }) => ({ xp }));
          return Promise.resolve({ data: filtered, error: null });
        },
      }),
    }));

    const { focusCb } = renderWithNav();
    await act(async () => { await focusCb(); });

    const props = mockHomeView.mock.calls.at(-1)[0];
    expect(props.localRank).toBe('#1');
  });

  /**
   * If the latest profile lacks an id, XP/rank derivation is skipped while
   * other profile fields remain presented.
   */
  test('skips XP/rank when latest profile has no id', async () => {
    mockFetchAndCacheUserProfile.mockResolvedValueOnce({
      username: 'noIdUser',
      avatarUrl: 'x.png',
    });

    const { focusCb } = renderWithNav();
    await act(async () => { await focusCb(); });

    const props = mockHomeView.mock.calls.at(-1)[0];
    expect(props.username).toBe('noIdUser');
    expect(props.rewardPoints).toBe(0);
    expect(props.localRank).toBe('-');
  });

  /**
   * XP aggregation should ignore undefined values returned by the backend.
   */
  test('sums XP ignoring undefined values', async () => {
    const { supabase } = require('../../supabase');
    supabase.from = jest.fn((table) => ({
      select: (cols) => ({
        then: (resolve) => {
          const payload =
            table === 'quiz_history'
              ? { data: cols.includes('user_id') ? [] : [], error: null }
              : table === 'profiles'
              ? { data: [], error: null }
              : { data: [], error: null };
          return Promise.resolve(payload).then(resolve);
        },
        catch: () => {},
        eq: (field, val) => {
          if (table === 'quiz_history' && field === 'user_id' && val === 'u1') {
            return Promise.resolve({
              data: [{ xp: 10 }, { xp: undefined }],
              error: null,
            });
          }
          return Promise.resolve({ data: [], error: null });
        },
      }),
    }));

    const { focusCb } = renderWithNav();
    await act(async () => { await focusCb(); });

    const props = mockHomeView.mock.calls.at(-1)[0];
    expect(props.rewardPoints).toBe(10);
    expect(props.localRank).toBe('-');
  });

  /**
   * If the XP query path yields an error, behavior should fail soft:
   * show 0 XP and '-' rank rather than throwing.
   */
  test('gracefully ignores XP when supabase returns an error for XP query', async () => {
    const { supabase } = require('../../supabase');
    supabase.from = jest.fn((table) => ({
      select: (cols) => ({
        then: (resolve) => {
          // Provide empty datasets so ranking code paths execute,
          // while the .eq() branch (used for XP total) returns an error.
          if (table === 'quiz_history' && cols.includes('user_id')) {
            return Promise.resolve({ data: [], error: null }).then(resolve);
          }
          if (table === 'profiles') {
            return Promise.resolve({ data: [], error: null }).then(resolve);
          }
          return Promise.resolve({ data: [], error: null }).then(resolve);
        },
        catch: () => {},
        eq: () => Promise.resolve({ data: null, error: { message: 'boom' } }),
      }),
    }));

    const { focusCb } = renderWithNav();
    await act(async () => { await focusCb(); });

    const props = mockHomeView.mock.calls.at(-1)[0];
    expect(props.rewardPoints).toBe(0);
    expect(props.localRank).toBe('-');
  });

  /**
   * Invoking the focus callback multiple times must not accumulate XP across
   * renders (idempotent behavior expected).
   */
  test('double focus does not double-count XP', async () => {
    const { supabase } = require('../../supabase');
    supabase.from = jest.fn((table) => ({
      select: (cols) => ({
        then: (resolve) => {
          const payload =
            table === 'quiz_history'
              ? { data: [{ user_id: 'u1', xp: 30 }], error: null }
              : table === 'profiles'
              ? { data: [{ id: 'u1', created_at: '2025-07-01T00:00:00.000Z' }], error: null }
              : { data: [], error: null };
          return Promise.resolve(payload).then(resolve);
        },
        catch: () => {},
        eq: () => Promise.resolve({ data: [{ xp: 30 }], error: null }),
      }),
    }));

    let focusCb;
    const navigation = {
      addListener: jest.fn((evt, cb) => { if (evt==='focus') focusCb = cb; return jest.fn(); }),
      navigate: jest.fn(),
    };
    render(<HomeContainer navigation={navigation} />);

    await act(async () => { await focusCb(); });
    const props1 = mockHomeView.mock.calls.at(-1)[0];
    expect(props1.rewardPoints).toBe(30);

    await act(async () => { await focusCb(); });
    const props2 = mockHomeView.mock.calls.at(-1)[0];
    expect(props2.rewardPoints).toBe(30); // no double accumulation
  });

  /**
   * The container must subscribe to the navigation `focus` event and
   * clean up on unmount to avoid leaks.
   */
  test('registers and unsubscribes focus listener', () => {
    let focusCb;
    const unsubscribe = jest.fn();
    const navigation = {
      addListener: jest.fn((evt, cb) => { if (evt === 'focus') focusCb = cb; return unsubscribe; }),
      navigate: jest.fn(),
    };

    const { unmount } = render(<HomeContainer navigation={navigation} />);
    expect(navigation.addListener).toHaveBeenCalledWith('focus', expect.any(Function));
    unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
});
