// containers/QuizContainer.js (Logic Layer)
import React, { useState, useEffect, useRef } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Audio } from 'expo-av';
import * as Haptics from 'expo-haptics';
import { decode } from 'html-entities';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';
import { saveDailyQuizResult } from '../utils/saveDailyQuizResult';
import * as Notifications from 'expo-notifications';
import { isSoundEnabled, isVibrationEnabled } from '../utils/gameSettings';
import QuizView from '../views/QuizView';

export default function QuizContainer({ route, navigation }) {
  // ----------------------------
  // Quiz parameters from route
  // ----------------------------
  const { quizSetId, quizTitle, questions, difficulty = 'hard' } = route.params;
  const quizQuestions = questions;
  const durationByDifficulty = { easy: 60, medium: 45, hard: 30 };
  const totalTime = durationByDifficulty[difficulty.toLowerCase()] || 60;

  // ----------------------------
  // State: gameplay tracking
  // ----------------------------
  const [remainingTime, setRemainingTime] = useState(totalTime);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [questionData, setQuestionData] = useState(null);
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [usedHint, setUsedHint] = useState(false);
  const [eliminatedOption, setEliminatedOption] = useState(null);
  const [earnedXP, setEarnedXP] = useState(0);
  const [totalEarnedXP, setTotalEarnedXP] = useState(0);
  const [showXPMessage, setShowXPMessage] = useState(false);
  const [reviewItems, setReviewItems] = useState([]);

  // ----------------------------
  // Refs: sound, start time
  // ----------------------------
  const soundRef = useRef(new Audio.Sound());
  const startTime = useRef(Date.now());

  // ----------------------------
  // Load current question data when index changes
  // ----------------------------
  useEffect(() => {
    const raw = quizQuestions[currentIndex];
    const options = [...raw.incorrect_answers, raw.correct_answer]
      .map(decode)
      .sort(() => 0.5 - Math.random());

    setQuestionData({
      question: decode(raw.question),
      options,
      correctAnswer: decode(raw.correct_answer),
    });
  }, [currentIndex, quizQuestions]);

  // ----------------------------
  // Handle hint usage
  // ----------------------------
  const handleHint = () => {
    const incorrect = questionData.options.filter(o => o !== questionData.correctAnswer);
    setEliminatedOption(incorrect[Math.floor(Math.random() * incorrect.length)]);
    setUsedHint(true);
  };

  // ----------------------------
  // Countdown timer
  // ----------------------------
  useEffect(() => {
    if (remainingTime <= 0 || submitted) return;

    const timer = setInterval(() => {
      setRemainingTime(prev => {
        if (prev > 0) return prev - 1;
        clearInterval(timer);
        return 0;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [submitted, remainingTime]);

  // ----------------------------
  // Auto-submit when time runs out
  // ----------------------------
  useEffect(() => {
    if (remainingTime === 0 && !submitted) {
      setSubmitted(true);
      setTimeout(() => {
        handleSubmit();
      }, 1500);
    }
  }, [remainingTime, submitted, handleSubmit]);

  // ----------------------------
  // Prevent accidental quiz exit
  // ----------------------------
  useFocusEffect(
    React.useCallback(() => {
      const onBeforeRemove = (e) => {
        e.preventDefault();
        Alert.alert('Exit Quiz?', 'Progress will be lost. Exit?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Exit', style: 'destructive', onPress: () => navigation.dispatch(e.data.action) },
        ]);
      };
      const unsubscribe = navigation.addListener('beforeRemove', onBeforeRemove);
      return () => unsubscribe();
    }, [navigation])
  );

  // ----------------------------
  // Handle answer submission
  // ----------------------------
  const handleSubmit = React.useCallback(async () => {
    const isUnanswered = selected === null;
    const isCorrect = selected === questionData?.correctAnswer;
    let gainedXP = 0;

    setSubmitted(true);
    setShowXPMessage(false);

    // Sound & haptics feedback
    if (!isUnanswered) {
      if (await isSoundEnabled()) {
        try {
          const soundFile = isCorrect
            ? require('../assets/correct.mp3')
            : require('../assets/incorrect.mp3');
          await soundRef.current.unloadAsync();
          await soundRef.current.loadAsync(soundFile);
          await soundRef.current.playAsync();
        } catch (e) {
          console.warn('Sound error:', e);
        }
      }
      if (await isVibrationEnabled()) {
        await Haptics.notificationAsync(
          isCorrect ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error
        );
      }

      // XP calculation
      if (isCorrect) {
        gainedXP = Math.floor((remainingTime / totalTime) * 100);
        if (usedHint) gainedXP = Math.floor(gainedXP / 2);
        setCorrectCount(prev => prev + 1);
      } else {
        setIncorrectCount(prev => prev + 1);
      }
    }

    setEarnedXP(gainedXP);
    setTotalEarnedXP(prev => prev + gainedXP);
    setShowXPMessage(!isUnanswered);

    // Add review item for current question
    const finalReviewItem = {
      number: currentIndex + 1,
      question: questionData.question,
      correctAnswer: questionData.correctAnswer,
      selectedAnswer: selected,
      status: isUnanswered ? 'unanswered' : isCorrect ? 'correct' : 'incorrect',
    };
    const fullReview = [...reviewItems, finalReviewItem];

    // ----------------------------
    // Move to next question or finish quiz
    // ----------------------------
    setTimeout(async () => {
      if (currentIndex < quizQuestions.length - 1) {
        setReviewItems(fullReview);
        setSelected(null);
        setSubmitted(false);
        setRemainingTime(totalTime);
        setEliminatedOption(null);
        setUsedHint(false);
        setShowXPMessage(false);
        setCurrentIndex(currentIndex + 1);
      } else {
        // End of quiz
        const user = await supabase.auth.getUser();
        const userId = user?.data?.user?.id;
        const score = Math.round((correctCount / quizQuestions.length) * 100);
        const xp = totalEarnedXP + gainedXP;
        const timeTaken = Math.floor((Date.now() - startTime.current) / 1000);

        // Final counts
        const finalCorrect = isUnanswered ? correctCount : isCorrect ? correctCount + 1 : correctCount;
        const finalIncorrect = isUnanswered ? incorrectCount : !isCorrect ? incorrectCount + 1 : incorrectCount;
        const finalUnanswered = quizQuestions.length - finalCorrect - finalIncorrect;

        // Save result (daily or normal quiz)
        if (quizTitle.startsWith('Daily Quiz -')) {
          await saveDailyQuizResult(userId, score, xp, fullReview, timeTaken);
          await Notifications.cancelAllScheduledNotificationsAsync();
          await AsyncStorage.setItem('lastDailyQuizDate', new Date().toDateString());
        } else {
          await supabase.from('quiz_history').insert([{
            user_id: userId,
            category_id: parseInt(quizSetId.match(/cat(\d+)_/)[1]),
            category_title: quizTitle.replace(/^#\d+\s*/, ''),
            quiz_title: quizTitle,
            difficulty,
            score,
            xp,
            time_taken_seconds: timeTaken,
            review_data: JSON.stringify(fullReview),
            quiz_set_id: quizSetId,
          }]);
        }

        // Navigate to result screen
        navigation.navigate('ResultContainer', {
          totalQuestions: quizQuestions.length,
          correct: finalCorrect,
          incorrect: finalIncorrect,
          unanswered: finalUnanswered,
          timeTaken: timeTaken * 1000,
          xpEarned: xp,
          reviewData: fullReview,
          categoryTitle: quizTitle,
        });
      }
    }, 1500);
  }, [
    selected,
    questionData,
    usedHint,
    remainingTime,
    totalTime,
    currentIndex,
    reviewItems,
    correctCount,
    incorrectCount,
    quizQuestions.length,
    navigation,
    quizTitle,
    quizSetId,
    difficulty,
    totalEarnedXP
  ]);

  // ----------------------------
  // Render quiz view
  // ----------------------------
  return (
    <QuizView
      questionData={questionData}
      selected={selected}
      submitted={submitted}
      showXPMessage={showXPMessage}
      earnedXP={earnedXP}
      usedHint={usedHint}
      remainingTime={remainingTime}
      totalTime={totalTime}
      currentIndex={currentIndex}
      quizLength={quizQuestions.length}
      eliminatedOption={eliminatedOption}
      setSelected={setSelected}
      handleSubmit={handleSubmit}
      handleHint={handleHint}
      navigation={navigation}
    />
  );
}
