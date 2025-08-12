// containers/__tests__/ProfileContainer.test.js
import React from 'react';
import { render, act, waitFor } from '@testing-library/react-native';

/**
 * Unit test scope:
 * - Exercises ProfileContainer orchestration only.
 * - Presentational view is replaced with a prop-capturing stub.
 * - External integrations (Supabase, user profile utils, badge services, RN Share)
 *   are mocked at the module boundary.
 * - No native UI is invoked; all effects/assertions are synchronous and deterministic.
 */

/* -----------------------------------------------------------------------------
 * React Native / environment guards
 * ---------------------------------------------------------------------------*/

// TurboModule guard to prevent RN preset mocks from throwing in Node.
jest.mock('react-native/Libraries/TurboModule/TurboModuleRegistry', () => ({
  get: () => ({}),
  getEnforcing: () => ({}),
}));

/* -----------------------------------------------------------------------------
 * View stub (capture-only)
 * Replaces ProfileView with a minimal component that records the latest props.
 * Assertions read from `mockCaptureProfileViewProps`.
 * ---------------------------------------------------------------------------*/
const mockCaptureProfileViewProps = jest.fn(() => null);
jest.mock('../../views/ProfileView', () => ({
  __esModule: true,
  default: function ProfileView(props) {
    mockCaptureProfileViewProps(props);
    return null;
  },
}));

/* -----------------------------------------------------------------------------
 * Domain fixtures and doubles
 * - Achievements catalog (static config)
 * - Badge logic (award/check side effects)
 * - Badge service (cached + remote progress)
 * - User profile cache/fetch utilities
 * ---------------------------------------------------------------------------*/
jest.mock('../../utils/badgeConfig', () => ({
  achievements: [
    { id: 'a1', title: 'Starter', description: 'First steps' },
    { id: 'a2', title: 'Pro', description: 'Quiz master' },
  ],
}));

const mockCheckAndAwardBadges = jest.fn(async () => {});
jest.mock('../../utils/badgeLogic', () => ({
  checkAndAwardBadges: (...a) => mockCheckAndAwardBadges(...a),
}));

const mockGetCachedBadgeProgress = jest.fn(async () => ({}));
const mockSetCachedBadgeProgress = jest.fn(async () => {});
const mockFetchBadgeProgressFromSupabase = jest.fn(async () => ({}));
jest.mock('../../utils/badgeService', () => ({
  getCachedBadgeProgress: (...a) => mockGetCachedBadgeProgress(...a),
  setCachedBadgeProgress: (...a) => mockSetCachedBadgeProgress(...a),
  fetchBadgeProgressFromSupabase: (...a) => mockFetchBadgeProgressFromSupabase(...a),
}));

const mockFetchAndCacheUserProfile = jest.fn(async () => ({ username: '', avatarUrl: null }));
const mockLoadUserProfileFromCache = jest.fn(async () => ({ username: '', avatarUrl: null }));
jest.mock('../../utils/userProfile', () => ({
  fetchAndCacheUserProfile: (...a) => mockFetchAndCacheUserProfile(...a),
  loadUserProfileFromCache: (...a) => mockLoadUserProfileFromCache(...a),
}));

/* -----------------------------------------------------------------------------
 * Supabase double
 * - Only the APIs used by the container are implemented:
 *   auth.getUser(), from('user_shares').insert(...).
 * - No real network calls; everything resolves in-memory.
 * ---------------------------------------------------------------------------*/
const mockGetUser = jest.fn(async () => ({ data: { user: { id: 'u1', email: 'u1@mail.com' } } }));
const mockInsert = jest.fn(async () => ({}));
jest.mock('../../supabase', () => ({
  supabase: {
    auth: { getUser: (...a) => mockGetUser(...a) },
    from: (table) => {
      if (table === 'user_shares') {
        return { insert: (...args) => mockInsert(...args) };
      }
      return {};
    },
  },
}));

/* -----------------------------------------------------------------------------
 * RN Share
 * Container references global.Share; assign from the RN module to avoid import.
 * ---------------------------------------------------------------------------*/
const RN = require('react-native');

/* -----------------------------------------------------------------------------
 * Helpers
 * ---------------------------------------------------------------------------*/

// Microtask drain helper; container code is promise-driven.
const flush = () => Promise.resolve();

// Minimal renderer with a navigation stub for route checks (if any).
function renderWithNav() {
  const navigation = { navigate: jest.fn() };
  const ProfileContainer = require('../ProfileContainer').default;
  render(<ProfileContainer navigation={navigation} />);
  return { navigation };
}

/* -----------------------------------------------------------------------------
 * Tests
 * ---------------------------------------------------------------------------*/

describe('ProfileContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Ensure global.Share exists for share flows exercised by the container.
    global.Share = RN.Share;
  });

  test('loads cached profile and cached badge progress on first effect', async () => {
    mockLoadUserProfileFromCache.mockResolvedValueOnce({
      username: 'CachedUser',
      avatarUrl: 'https://cdn/cached.png',
    });
    mockGetCachedBadgeProgress.mockResolvedValueOnce({ streak: 3 });

    // Hold the “refresh” effect so cached state remains visible for assertions.
    mockFetchAndCacheUserProfile.mockImplementationOnce(() => new Promise(() => {}));
    mockFetchBadgeProgressFromSupabase.mockImplementationOnce(() => new Promise(() => {}));

    renderWithNav();
    await act(async () => {}); // allow first effect to complete

    const props = mockCaptureProfileViewProps.mock.calls.at(-1)[0];
    expect(props.name).toBe('CachedUser');
    expect(props.avatarUrl).toBe('https://cdn/cached.png');
    expect(props.badgeProgress).toEqual({ streak: 3 });
    expect(props.loading).toBe(true);
  });

  test('refreshes from latest: updates name/avatar and sets email', async () => {
    mockLoadUserProfileFromCache.mockResolvedValueOnce({ username: '', avatarUrl: null });
    mockGetCachedBadgeProgress.mockResolvedValueOnce({});
    mockFetchAndCacheUserProfile.mockResolvedValueOnce({
      username: 'LiveUser',
      avatarUrl: 'https://cdn/live.png',
    });
    mockGetUser.mockResolvedValueOnce({ data: { user: { id: 'u1', email: 'fresh@mail.com' } } });
    mockFetchBadgeProgressFromSupabase.mockResolvedValueOnce({ totalBadges: 5 });

    renderWithNav();
    await act(flush); // first effect (cached)
    await act(flush); // second effect (live)

    // Wait for the re-render to reflect refreshed values
    await waitFor(() => {
      const p = mockCaptureProfileViewProps.mock.calls.at(-1)[0];
      expect(p.name).toBe('LiveUser');
      expect(p.avatarUrl).toBe('https://cdn/live.png');
      expect(p.email).toBe('fresh@mail.com');
    });

    // Badge evaluation expected as a side-effect of refresh
    expect(mockCheckAndAwardBadges).toHaveBeenCalled();
  });

  test('handleShare is a no-op when no selectedAchievement is present', async () => {
    mockLoadUserProfileFromCache.mockResolvedValueOnce({ username: '', avatarUrl: null });
    mockGetCachedBadgeProgress.mockResolvedValueOnce({});
    const spyShare = jest.spyOn(RN.Share, 'share').mockResolvedValue({});

    renderWithNav();
    await act(flush);
    const props = mockCaptureProfileViewProps.mock.calls.at(-1)[0];

    await act(async () => { await props.handleShare(); });

    expect(spyShare).not.toHaveBeenCalled();
    expect(mockInsert).not.toHaveBeenCalled();
  });

  test('handleShare with selected achievement → sharedAction inserts and re-checks badges', async () => {
    mockLoadUserProfileFromCache.mockResolvedValueOnce({ username: '', avatarUrl: null });
    mockGetCachedBadgeProgress.mockResolvedValueOnce({});
    jest.spyOn(RN.Share, 'share').mockResolvedValue({ action: RN.Share.sharedAction });

    renderWithNav();
    await act(flush);

    const props = mockCaptureProfileViewProps.mock.calls.at(-1)[0];
    await act(async () => {
      props.setSelectedAchievement({ id: 'a1', title: 'Starter', description: 'First steps' });
    });
    const latest = mockCaptureProfileViewProps.mock.calls.at(-1)[0];

    await act(async () => { await latest.handleShare(); });

    expect(RN.Share.share).toHaveBeenCalledWith(
      expect.objectContaining({ message: expect.stringContaining('Starter') })
    );
    expect(mockInsert).toHaveBeenCalledWith(expect.objectContaining({ user_id: 'u1', type: 'badge' }));
    expect(mockCheckAndAwardBadges).toHaveBeenCalled();
  });

  test('handleShare with selected achievement → dismissedAction performs no insert and no extra badge check', async () => {
    mockLoadUserProfileFromCache.mockResolvedValueOnce({ username: '', avatarUrl: null });
    mockGetCachedBadgeProgress.mockResolvedValueOnce({});
    jest.spyOn(RN.Share, 'share').mockResolvedValue({ action: RN.Share.dismissedAction });

    renderWithNav();
    await act(flush);

    const props = mockCaptureProfileViewProps.mock.calls.at(-1)[0];
    await act(async () => {
      props.setSelectedAchievement({ id: 'a2', title: 'Pro', description: 'Quiz master' });
    });
    const latest = mockCaptureProfileViewProps.mock.calls.at(-1)[0];

    const before = mockCheckAndAwardBadges.mock.calls.length;
    await act(async () => { await latest.handleShare(); });

    expect(mockInsert).not.toHaveBeenCalled();
    expect(mockCheckAndAwardBadges.mock.calls.length).toBe(before);
  });

  test('handleShare error is caught and logged without throwing', async () => {
    mockLoadUserProfileFromCache.mockResolvedValueOnce({ username: '', avatarUrl: null });
    mockGetCachedBadgeProgress.mockResolvedValueOnce({});
    jest.spyOn(RN.Share, 'share').mockRejectedValue(new Error('boom'));
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    renderWithNav();
    await act(flush);

    const props = mockCaptureProfileViewProps.mock.calls.at(-1)[0];
    await act(async () => {
      props.setSelectedAchievement({ id: 'a1', title: 'Starter', description: 'First steps' });
    });
    const latest = mockCaptureProfileViewProps.mock.calls.at(-1)[0];
    await act(async () => { await latest.handleShare(); });

    expect(errSpy).toHaveBeenCalled();
    errSpy.mockRestore();
  });
});
