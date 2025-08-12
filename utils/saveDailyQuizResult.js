// utils/saveDailyQuizResult.js
import { supabase } from '../supabase';

/**
 * Save or update today's Daily Quiz result for a user.
 * - If a record for "Daily Quiz - YYYY-MM-DD" exists, only update when the new score is higher.
 * - Otherwise, insert a new record.
 */
export const saveDailyQuizResult = async (userId, score, xp, reviewData, timeTakenSeconds = 0) => {
  const now = new Date();
  const dateTaken = now.toISOString().split('T')[0]; // YYYY-MM-DD (date-only for filtering/ranking)
  const timeTaken = now.toISOString();               // Full ISO timestamp (completion time)

  // Look up an existing record for today's daily quiz
  const { data: existing, error: fetchError } = await supabase
    .from('quiz_history')
    .select('*')
    .eq('user_id', userId)
    .eq('quiz_title', `Daily Quiz - ${dateTaken}`)
    .single();

  // Insert new or update if the new score is better
  if (!existing || score > existing.score) {
    const payload = {
      user_id: userId,
      category_id: 0,                    // Mixed category sentinel
      category_title: 'Mixed',
      quiz_title: `Daily Quiz - ${dateTaken}`,
      difficulty: 'random',
      score,
      xp,
      time_taken_seconds: timeTakenSeconds, // Use provided duration (in seconds)
      date_taken: dateTaken,                // Date-only field for grouping
      time_taken: timeTaken,                // Full timestamp for audit/ordering
      review_data: reviewData,              // Raw or JSON string as stored by caller
    };

    // Upsert behavior: update existing by id, otherwise insert new row
    const { error } = existing 
      ? await supabase
          .from('quiz_history')
          .update(payload)
          .eq('id', existing.id)
      : await supabase
          .from('quiz_history')
          .insert(payload);

    if (error) {
      console.error('Error saving quiz result:', error);
      throw error;
    }
  }
};
