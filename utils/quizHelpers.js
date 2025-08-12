// utils/quizHelpers.js
import { supabase } from '../supabase';

/**
 * Check if the user has already completed today's Daily Quiz.
 *
 * @param {string} userId - The authenticated user's ID.
 * @returns {Promise<boolean>} - true if completed today, false otherwise.
 */
export const checkIfDailyQuizDone = async (userId) => {
  // Format today's date as 'YYYY-MM-DD'
  const today = new Date().toISOString().split('T')[0];

  // Query Supabase for a quiz_history entry that:
  // - Belongs to this user
  // - Has quiz_title exactly 'daily_quiz'
  // - Has date_taken on or after today
  // - maybeSingle() ensures either one row or null without throwing on empty result
  const { data } = await supabase
    .from('quiz_history')
    .select('id')
    .eq('user_id', userId)
    .eq('quiz_title', 'daily_quiz')
    .gte('date_taken', today)
    .maybeSingle();

  // If `data` exists, the daily quiz was already done
  return !!data;
};
