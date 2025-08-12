// containers/__tests__/EditProfileContainer.test.js
import React from 'react';
import { render, act } from '@testing-library/react-native';

/**
 * Unit test scope:
 * - Exercises EditProfileContainer logic in isolation.
 * - View is replaced by a prop-capturing stub.
 * - Expo ImagePicker, Supabase (auth/profiles/storage), and fetch uploads are mocked.
 * - No native UI; assertions target derived props, alerts, and callbacks.
 */

/**
 * React Native TurboModule guard
 * Prevents RN preset mocks from throwing by ensuring
 * TurboModuleRegistry.get/getEnforcing always return an object.
 */
jest.mock('react-native/Libraries/TurboModule/TurboModuleRegistry', () => ({
  get: () => ({}),
  getEnforcing: () => ({}),
}));

/**
 * Network isolation
 * Forces any accidental fetch calls to resolve locally.
 * (The container uses fetch for image uploads.)
 */
global.fetch = jest.fn(async () => ({
  ok: true,
  text: async () => 'ok',
}));

/**
 * Alert spy
 * Intercepts Alert.alert so native UI is not shown and calls can be asserted.
 * Note: require inside spyOn avoids import hoisting issues.
 */
const alertSpy = jest
  .spyOn(require('react-native').Alert, 'alert')
  .mockImplementation(() => {});

/**
 * Expo ImagePicker stub
 * Provides default "granted" permissions and "canceled" results.
 * Individual tests override specific calls as needed.
 */
jest.mock('expo-image-picker', () => ({
  requestCameraPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  requestMediaLibraryPermissionsAsync: jest.fn(async () => ({ status: 'granted' })),
  launchCameraAsync: jest.fn(async () => ({ canceled: true })),
  launchImageLibraryAsync: jest.fn(async () => ({ canceled: true })),
  MediaTypeOptions: { Images: 'Images' },
}));

/**
 * View-prop capture
 * Replaces EditProfileView with a null-rendering component that records
 * received props so tests can drive the container via callbacks/state.
 * (The mock function name must start with "mock*" for Jest timing helpers.)
 */
const mockCaptureViewProps = jest.fn(() => null);
jest.mock('../../views/EditProfileView', () => ({
  __esModule: true,
  default: function EditProfileView(props) {
    mockCaptureViewProps(props);
    return null;
  },
}));

/**
 * Supabase module double
 * In-memory, chain-compatible mock for:
 *   - auth.getSession()
 *   - from('profiles').select().eq().single()
 *   - from('profiles').update().eq()
 * The "current" fields allow tests to swap the active chain at runtime.
 */
const mockGetSession = jest.fn();
const mockProfilesSelect = jest.fn();
const mockProfilesUpdate = jest.fn();

jest.mock('../../supabase', () => ({
  supabase: {
    auth: { getSession: (...a) => mockGetSession(...a) },

    from: (table) => {
      if (table === 'profiles') {
        return {
          // If a test provides a select-chain, use it; otherwise return a benign default.
          select: (...args) =>
            mockProfilesSelect.current
              ? mockProfilesSelect.current.select(...args)
              : { eq: () => ({ single: async () => ({ data: null, error: null }) }) },

          // If a test provides an update-chain, use it; otherwise return a benign default.
          update: (...args) =>
            mockProfilesUpdate.current
              ? mockProfilesUpdate.current.update(...args)
              : { eq: async () => ({ error: null }) },
        };
      }
      // Fallback for any other table (unused here).
      return {
        select: () => ({ eq: () => ({ single: async () => ({ data: null, error: null }) }) }),
        update: () => ({ eq: async () => ({ error: null }) }),
      };
    },

    storage: {
      // Deterministic public URL for avatars.
      from: () => ({
        getPublicUrl: () => ({ data: { publicUrl: 'https://example/placeholder.png' } }),
      }),
    },
  },
}));

/**
 * Chain builders
 * Helpers that mimic Supabase's fluent APIs so expectations remain realistic.
 */
function makeProfilesSelectChain(res) {
  return {
    select: () => ({
      eq: () => ({
        single: async () => res,
      }),
    }),
  };
}
function makeProfilesUpdateChain(error = null) {
  return {
    update: (values) => ({
      eq: async () => ({ error, values }),
    }),
  };
}

/** Drains microtasks; the container is predominantly async/await driven. */
const flush = () => Promise.resolve();

/**
 * Render helper
 * Wires a minimal navigation stub and returns it for goBack assertions.
 */
function renderWithNav() {
  const navigation = { goBack: jest.fn() };
  const EditProfileContainer = require('../EditProfileContainer').default;
  render(<EditProfileContainer navigation={navigation} />);
  return { navigation };
}

describe('EditProfileContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Default: authenticated session present.
    mockGetSession.mockResolvedValue({
      data: {
        session: {
          user: { id: 'u1', email: 'u1@mail.com' },
          access_token: 'tok-123',
        },
      },
      error: null,
    });

    // Default: an "Old" profile exists (overridden per test as needed).
    mockProfilesSelect.current = makeProfilesSelectChain({
      data: { name: 'Old', username: 'old', avatar_url: null },
      error: null,
    });

    // Default: no update chain provided (tests set when needed).
    mockProfilesUpdate.current = null;
  });

  /** Loads the session and profile; exposes initial view props. */
  test('loads session and profile on mount, populates view props', async () => {
    mockProfilesSelect.current = makeProfilesSelectChain({
      data: { name: 'Alice', username: 'alice123', avatar_url: 'https://img/a.png' },
      error: null,
    });

    renderWithNav();
    await act(flush);

    const props = mockCaptureViewProps.mock.calls.at(-1)[0];
    expect(props.name).toBe('Alice');
    expect(props.username).toBe('alice123');
    expect(props.avatarUrl).toBe('https://img/a.png');
    expect(props.uploading).toBe(false);
    expect(typeof props.setName).toBe('function');
    expect(typeof props.setUsername).toBe('function');
    expect(typeof props.pickImage).toBe('function');
    expect(typeof props.updateProfile).toBe('function');
  });

  /** Handles "no rows" (PGRST116) without alarming the user. */
  test('no profile row (PGRST116) does not alert and leaves defaults', async () => {
    mockProfilesSelect.current = makeProfilesSelectChain({
      data: null,
      error: { code: 'PGRST116', message: 'No rows' },
    });

    renderWithNav();
    await act(flush);

    const props = mockCaptureViewProps.mock.calls.at(-1)[0];
    expect(alertSpy).not.toHaveBeenCalled();
    expect(props.name).toBe('');
    expect(props.username).toBe('');
    expect(props.avatarUrl).toBe(null);
  });

  /** Surfaces session retrieval failure via Alert. */
  test('session error shows alert and aborts', async () => {
    mockGetSession.mockResolvedValueOnce({
      data: { session: null },
      error: { message: 'failed session' },
    });

    renderWithNav();
    await act(flush);

    expect(alertSpy).toHaveBeenCalledWith('Error', 'failed session');
  });

  /** Image picker entrypoint opens a 3-button choice alert. */
  test('pickImage opens Alert with Camera/Gallery/Cancel options', async () => {
    renderWithNav();
    await act(flush);

    const props = mockCaptureViewProps.mock.calls.at(-1)[0];
    await act(async () => props.pickImage());

    expect(alertSpy).toHaveBeenCalledTimes(1);
    const [title, message, buttons] = alertSpy.mock.calls[0];
    expect(title).toBe('Select Image Source');
    expect(message).toBe('Choose an option');
    expect(Array.isArray(buttons)).toBe(true);
    expect(buttons.some(b => b.text === 'Camera')).toBe(true);
    expect(buttons.some(b => b.text === 'Gallery')).toBe(true);
    expect(buttons.some(b => b.text === 'Cancel')).toBe(true);
  });

  /** Successful update alerts success and navigates back. */
  test('updateProfile success -> alerts success and navigates back', async () => {
    mockProfilesUpdate.current = makeProfilesUpdateChain(null); // success

    const { navigation } = renderWithNav();
    await act(flush);

    const propsBefore = mockCaptureViewProps.mock.calls.at(-1)[0];
    await act(async () => {
      propsBefore.setName('New Name');
      propsBefore.setUsername('newuser');
    });

    const props = mockCaptureViewProps.mock.calls.at(-1)[0];
    await act(async () => { await props.updateProfile(); });

    expect(alertSpy).toHaveBeenCalledWith('Success', 'Profile updated');
    expect(navigation.goBack).toHaveBeenCalled();
  });

  /** Update error is surfaced through an error alert. */
  test('updateProfile error -> shows error alert', async () => {
    mockProfilesUpdate.current = makeProfilesUpdateChain({ message: 'update failed' });

    renderWithNav();
    await act(flush);

    const props = mockCaptureViewProps.mock.calls.at(-1)[0];
    await act(async () => { await props.updateProfile(); });

    expect(alertSpy).toHaveBeenCalledWith('Error', 'update failed');
  });

  // ===== Extra negative-path tests =====

  /** Camera permission denied path shows a permission rationale alert. */
  test('Camera permission denied -> shows permission alert', async () => {
    const ImagePicker = require('expo-image-picker');
    ImagePicker.requestCameraPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });

    renderWithNav();
    await act(flush);

    const props = mockCaptureViewProps.mock.calls.at(-1)[0];
    await act(async () => props.pickImage());

    // Simulate tapping the Camera button.
    const buttons = alertSpy.mock.calls.at(-1)[2];
    const camBtn = buttons.find(b => b.text === 'Camera');
    await act(async () => camBtn.onPress());

    expect(alertSpy).toHaveBeenCalledWith(
      'Permission Denied',
      'Camera access is required to take a photo.'
    );
  });

  /** Gallery permission denied path shows a permission rationale alert. */
  test('Gallery permission denied -> shows permission alert', async () => {
    const ImagePicker = require('expo-image-picker');
    ImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValueOnce({ status: 'denied' });

    renderWithNav();
    await act(flush);

    const props = mockCaptureViewProps.mock.calls.at(-1)[0];
    await act(async () => props.pickImage());

    // Simulate tapping the Gallery button.
    const buttons = alertSpy.mock.calls.at(-1)[2];
    const galBtn = buttons.find(b => b.text === 'Gallery');
    await act(async () => galBtn.onPress());

    expect(alertSpy).toHaveBeenCalledWith(
      'Permission Denied',
      'Media access is required to choose an image.'
    );
  });

  /** Canceling the picker should not report an upload failure. */
  test('User cancels picker (Gallery) -> no upload attempt and no Upload Failed alert', async () => {
    const ImagePicker = require('expo-image-picker');
    ImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValueOnce({ status: 'granted' });
    ImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({ canceled: true });

    renderWithNav();
    await act(flush);

    const props = mockCaptureViewProps.mock.calls.at(-1)[0];
    await act(async () => props.pickImage());

    const callsBefore = alertSpy.mock.calls.length; // includes the chooser alert
    const buttons = alertSpy.mock.calls.at(-1)[2];
    const galBtn = buttons.find(b => b.text === 'Gallery');

    await act(async () => galBtn.onPress());

    // Ensure no upload failure (or any new alert besides the chooser).
    const newCalls = alertSpy.mock.calls.slice(callsBefore);
    expect(newCalls.find(c => c[0] === 'Upload Failed')).toBeUndefined();
  });

  /**
   * Upload request fails (HTTP not ok) → logs an error and shows an "Upload Failed" alert.
   * Console error is muted for this test only to keep output clean.
   */
  test('Upload HTTP failure -> shows "Upload Failed" alert (silence console.error)', async () => {
    const ImagePicker = require('expo-image-picker');
    ImagePicker.requestMediaLibraryPermissionsAsync.mockResolvedValueOnce({ status: 'granted' });
    ImagePicker.launchImageLibraryAsync.mockResolvedValueOnce({
      canceled: false,
      assets: [{ uri: 'file:///tmp/photo.jpg' }],
    });

    // Silence the console.error from the container's catch block for this test only.
    const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // First fetch call (upload) fails.
    global.fetch.mockResolvedValueOnce({
      ok: false,
      text: async () => 'bad',
    });

    renderWithNav();
    await act(flush);

    const props = mockCaptureViewProps.mock.calls.at(-1)[0];
    await act(async () => props.pickImage());

    const buttons = alertSpy.mock.calls.at(-1)[2];
    const galBtn = buttons.find(b => b.text === 'Gallery');
    await act(async () => galBtn.onPress());

    // Expect upload failure alert.
    expect(alertSpy).toHaveBeenCalledWith('Upload Failed', 'Upload failed: bad');

    // Restore console after assertions.
    errSpy.mockRestore();
  });
});
