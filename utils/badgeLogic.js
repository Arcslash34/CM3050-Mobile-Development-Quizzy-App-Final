// utils/badgeLogic.js
// This file checks the user's quiz/friend/share activity and awards badge progress accordingly.

import { supabase } from '../supabase';
import { upsertBadgeProgress } from './badgeService';

export const checkAndAwardBadges = async () => {
  // 1. Get the authenticated user from Supabase Auth
  const { data: userRes } = await supabase.auth.getUser();
  const user = userRes?.user;
  if (!user) return; // If no user is logged in, stop execution

  const authUserId = user.id; // This is the user's UUID in Supabase Auth
  let profileId = null;

  // 2. Fetch the matching `profiles` table row using the same ID
  //    This is necessary because other tables (quiz_history, user_shares, friends) use profile.id
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', authUserId)
    .single();

  profileId = profile?.id;

  if (!profileId) {
    console.warn('[BADGE] No matching profile found');
    return;
  }

  // 3. Get quiz history for this user
  const { data: history, error } = await supabase
    .from('quiz_history')
    .select('*')
    .eq('user_id', profileId);

  if (error || !history) {
    console.warn('[BADGE] No quiz history:', error);
    return;
  }

  // 4. Get share count (badge sharing + quiz result sharing)
  const { data: shares } = await supabase
    .from('user_shares')
    .select('id')
    .eq('user_id', profileId);

  const shareCount = shares?.length || 0;

  // 5. Get friend count (only accepted friends)
  const { data: friends } = await supabase
    .from('friends')
    .select('*')
    .or(`user_id.eq.${profileId},friend_id.eq.${profileId}`)
    .eq('status', 'accepted');

  // Count unique friends regardless of whether the user sent or received the request
  const uniqueFriendCount = new Set(
    friends.map(f => (f.user_id === profileId ? f.friend_id : f.user_id))
  ).size;

  // 6. Compute statistics from quiz history
  const total = history.length; // total quizzes completed
  const perfect = history.filter(q => q.score === 100).length; // perfect scores
  const fast = history.filter(q => q.time_taken_seconds <= 60).length; // quizzes done under 1 min
  const hardPerfect = history.filter(q => q.difficulty === 'hard' && q.score === 100).length;
  const easyPerfect = history.filter(q => q.difficulty === 'easy' && q.score === 100).length;
  
  const today = new Date().toISOString().slice(0, 10); // e.g., "2025-08-12"
  const dates = new Set(history.map(q => q.date_taken)); // unique days user played
  const todayTaken = history.some(q => q.date_taken === today); // played today?

  // 7. Update badge progress
  //    The `upsertBadgeProgress` function will insert or update progress in the `user_badges` table.
  //    Progress is normalized between 0 and 1 (where 1 means "completed").
  
  // First quiz
  await upsertBadgeProgress(1, Math.min(total / 1, 1));
  // Perfectionist (100% score)
  await upsertBadgeProgress(2, Math.min(perfect / 1, 1));
  // Fast Learner (< 1 minute)
  await upsertBadgeProgress(3, Math.min(fast / 1, 1));
  // Knowledge Seeker (10 quizzes)
  await upsertBadgeProgress(4, Math.min(total / 10, 1));
  // Quiz Master (50 quizzes)
  await upsertBadgeProgress(5, Math.min(total / 50, 1));
  // Fast Finisher (10 fast quizzes)
  await upsertBadgeProgress(6, Math.min(fast / 10, 1));
  // Sharp Shooter (hard-level perfect score)
  await upsertBadgeProgress(8, Math.min(hardPerfect / 1, 1));
  // Gamer Level 2 (20 quizzes)
  await upsertBadgeProgress(9, Math.min(total / 20, 1));
  // Piece of Cake (easy-level perfect score)
  await upsertBadgeProgress(13, Math.min(easyPerfect / 1, 1));
  // Daily Drop (played today)
  await upsertBadgeProgress(14, todayTaken ? 1 : 0);
  // Royal Streak (3 perfect quizzes without retries — tracked here by count)
  await upsertBadgeProgress(16, Math.min(perfect / 3, 1));
  // Happy Camper (7 days active)
  await upsertBadgeProgress(12, Math.min(dates.size / 7, 1));
  // First Share
  await upsertBadgeProgress(17, Math.min(shareCount / 1, 1));
  // Social Sharer (5 shares)
  await upsertBadgeProgress(18, Math.min(shareCount / 5, 1));
  // First Friend
  await upsertBadgeProgress(19, Math.min(uniqueFriendCount / 1, 1));
  // Friendly Circle (5 friends)
  await upsertBadgeProgress(20, Math.min(uniqueFriendCount / 5, 1));
};
