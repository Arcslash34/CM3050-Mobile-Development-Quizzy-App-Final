// containers/DailyQuizWrapper.js (Logic Layer)
import React, { useEffect } from 'react';
import { supabase } from '../supabase';
import { generateDailyQuiz } from '../utils/dailyQuiz';

export default function DailyQuizWrapper({ navigation }) {
  useEffect(() => {
    // Runs on component mount to check if the user is logged in,
    // then navigates to the appropriate screen
    const checkAuthAndNavigate = async () => {
      // Get the current Supabase authentication session
      const { data } = await supabase.auth.getSession();

      // If the user is NOT logged in, send them to AuthWrapper
      // Pass "DailyQuizWrapper" as "next" so they can be redirected back here after login
      if (!data.session) {
        navigation.replace('AuthWrapper', { next: 'DailyQuizWrapper' });
      } else {
        // If the user is logged in, generate the daily quiz data
        const quizData = generateDailyQuiz();

        // Navigate directly to QuizContainer, passing the quiz data as route params
        navigation.replace('QuizContainer', { ...quizData });
      }
    };

    checkAuthAndNavigate();
  }, [navigation]); // Re-run if navigation object changes

  // This wrapper doesn’t render any UI — it’s purely a logic router
  return null;
}
