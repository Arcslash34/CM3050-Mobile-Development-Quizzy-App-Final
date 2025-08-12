// utils/notifications.js
import * as Notifications from 'expo-notifications';
import { supabase } from '../supabase';

/**
 * Schedule a daily notification at 8 AM to remind the user about the Daily Quiz.
 * - Skips scheduling if:
 *   a) No logged-in user, or
 *   b) User already completed today's Daily Quiz, or
 *   c) Notification permission is not granted.
 * - Cancels existing scheduled notifications before scheduling a new repeating one.
 */
export const scheduleDailyQuizNotification = async () => {
  try {
    // 1) Ensure we have an authenticated user
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return;

    // 2) If today's Daily Quiz already done, don't schedule
    const today = new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'
    const { data: existing, error } = await supabase
      .from('quiz_history')
      .select('id')
      .eq('user_id', userId)
      .eq('date_taken', today)
      .ilike('quiz_title', 'Daily Quiz%');

    if (error) {
      console.error('Failed to check daily quiz history:', error.message);
      return;
    }
    if (existing.length > 0) {
      console.log('✅ Daily quiz already completed today. No notification scheduled.');
      return;
    }

    // 3) Ask for notification permission if needed
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      const { status: newStatus } = await Notifications.requestPermissionsAsync();
      if (newStatus !== 'granted') return;
    }

    // 4) Clear any existing scheduled notifications to avoid duplicates
    await Notifications.cancelAllScheduledNotificationsAsync();

    // 5) Schedule a repeating 8:00 AM reminder
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '🧠 Ready for Today\'s Daily Quiz?',
        body: 'Test your knowledge now!',
        data: { screen: 'DailyQuiz' },
      },
      trigger: { hour: 8, minute: 0, repeats: true },
    });

    console.log('📅 Daily quiz reminder scheduled for 8 AM.');
  } catch (err) {
    console.error('Notification scheduling error:', err.message);
  }
};

/**
 * Cancel all scheduled notifications created by the app.
 * Useful when the user disables reminders in settings.
 */
export const cancelDailyQuizNotification = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    console.log('🔕 Daily quiz notifications cancelled.');
  } catch (err) {
    console.error('Failed to cancel notifications:', err.message);
  }
};
