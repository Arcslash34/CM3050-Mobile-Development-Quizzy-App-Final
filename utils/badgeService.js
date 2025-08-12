// utils/badgeService.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';

/** Key used for persisting badge progress locally */
const CACHE_KEY = 'badgeProgress';

/** Read cached progress map { [badgeId]: progressFloat } from AsyncStorage */
export const getCachedBadgeProgress = async () => {
  const cached = await AsyncStorage.getItem(CACHE_KEY);
  return cached ? JSON.parse(cached) : {};
};

/** Overwrite the entire local cache with a new progress map */
export const setCachedBadgeProgress = async (progressMap) => {
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(progressMap));
};

/**
 * Fetch the latest badge progress from Supabase.
 * Returns an object shaped like { [badgeId]: progressFloat }.
 */
export const fetchBadgeProgressFromSupabase = async () => {
  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes?.user?.id;
  if (!userId) return {};

  const { data, error } = await supabase
    .from('user_badges')
    .select('badge_id, progress')
    .eq('user_id', userId);

  if (error) {
    console.warn('Supabase badge fetch error', error);
    return {};
  }

  const map = {};
  data.forEach((row) => { map[row.badge_id] = row.progress; });
  return map;
};

/**
 * Insert or update (upsert) a user's badge progress in Supabase.
 * - Sets earned_at when progress reaches 1 (completed).
 * - Conflict target is (user_id, badge_id).
 */
export const upsertBadgeProgress = async (badgeId, progressFloat) => {
  const { data: userRes } = await supabase.auth.getUser();
  const userId = userRes?.user?.id;
  if (!userId) return;

  await supabase.from('user_badges').upsert(
    {
      user_id: userId,
      badge_id: badgeId,
      progress: progressFloat,
      earned_at: progressFloat === 1 ? new Date().toISOString() : null,
    },
    { onConflict: 'user_id,badge_id' }
  );
};
