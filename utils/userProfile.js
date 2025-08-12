import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';

/**
 * Fetch the current user's profile from Supabase and cache it in AsyncStorage.
 * Returns an object with `id`, `username`, and `avatarUrl`.
 */
export const fetchAndCacheUserProfile = async () => {
  // Get the currently authenticated user
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;

  if (!userId) {
    console.warn('No user ID from auth');
    return { id: '', username: '', avatarUrl: '' };
  }

  // Fetch profile data from Supabase
  const { data, error } = await supabase
    .from('profiles')
    .select('id, username, avatar_url')
    .eq('id', userId)
    .single();

  if (data) {
    const { id, username, avatar_url } = data;

    // Store profile in AsyncStorage for offline use
    await AsyncStorage.setItem('userId', id || '');
    await AsyncStorage.setItem('userAvatar', avatar_url || '');
    await AsyncStorage.setItem('userName', username || '');

    return {
      id: id || userId,
      username: username || '',
      avatarUrl: avatar_url || '',
    };
  } else {
    console.error('Error fetching profile:', error?.message);
    return { id: userId, username: '', avatarUrl: '' };
  }
};

/**
 * Load the cached user profile from AsyncStorage.
 * Returns an object with `id`, `username`, and `avatarUrl`.
 */
export const loadUserProfileFromCache = async () => {
  const id = await AsyncStorage.getItem('userId');
  const username = await AsyncStorage.getItem('userName');
  const avatarUrl = await AsyncStorage.getItem('userAvatar');

  return {
    id: id || '',
    username: username || '',
    avatarUrl: avatarUrl || '',
  };
};
