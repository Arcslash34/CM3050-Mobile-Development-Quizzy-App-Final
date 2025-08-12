// containers/ResultContainer.js (Logic Layer)
import React, { useCallback } from 'react';
import { Alert, Share, BackHandler } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { supabase } from '../supabase';
import ResultView from '../views/ResultView';

export default function ResultContainer({ route, navigation }) {
  // Extract quiz results from navigation params
  const {
    totalQuestions,
    correct,
    incorrect,
    unanswered,
    timeTaken,
    xpEarned,
    reviewData,
    categoryTitle,
  } = route.params;

  // Derived values: percentage score + formatted time string
  const score = Math.round((correct / totalQuestions) * 100);
  const timeStr = `${Math.floor(timeTaken / 60000)} m ${Math.floor(
    (timeTaken % 60000) / 1000
  )} s`;

  // Reset navigation to main screen
  const handleClose = useCallback(() => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Main' }],
    });
  }, [navigation]);

  // Share quiz results (and log share event in DB)
  const handleShare = async () => {
    try {
      const message = `🎉 I just completed a quiz on Quizzy!

✅ Score: ${score}%
🕒 Time Taken: ${timeStr}
🏆 XP Earned: ${xpEarned}

Can you beat my score? Try it now! 🚀`;

      const result = await Share.share({ message });

      // If shared successfully, record the share in Supabase
      if (result.action === Share.sharedAction) {
        const { data: userRes } = await supabase.auth.getUser();
        if (userRes?.user?.id) {
          await supabase.from('user_shares').insert({
            user_id: userRes.user.id,
            type: 'quiz',
          });
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to share result.');
    }
  };

  // Navigate to quiz review screen
  const handleReview = () => {
    navigation.navigate('ReviewContainer', {
      reviewData,
      quizTitle: categoryTitle,
      score,
      xp: xpEarned,
    });
  };

  // Handle Android hardware back button → go to Main screen
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        handleClose();
        return true; // Prevent default back action
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => {
        BackHandler.removeEventListener('hardwareBackPress', onBackPress);
      };
    }, [handleClose])
  );

  // Pass props to the presentation layer (ResultView)
  return (
    <ResultView
      score={score}
      timeStr={timeStr}
      correct={correct}
      incorrect={incorrect}
      unanswered={unanswered}
      xpEarned={xpEarned}
      onShare={handleShare}
      onReview={handleReview}
      onClose={handleClose}
    />
  );
}
