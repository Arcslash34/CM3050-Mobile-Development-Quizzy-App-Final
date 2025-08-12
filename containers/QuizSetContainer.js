// containers/QuizSetContainer.js (Logic Layer)
import React, { useState, useRef, useMemo } from 'react';
import { Animated, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import QuizSetView from '../views/QuizSetView';
import { supabase } from '../supabase';
import quizSetMap from '../utils/quizSetMap';

// ----------------------------
// Constants
// ----------------------------
const DIFFICULTIES = ['easy', 'medium', 'hard'];
const SETS_PER_DIFFICULTY = 2;

export default function QuizSetContainer({ route, navigation }) {
  const { category } = route.params;

  // ----------------------------
  // State
  // ----------------------------
  const [completedSetIds, setCompletedSetIds] = useState(new Set());
  const [loadingProgress, setLoadingProgress] = useState(true);

  // ----------------------------
  // Animation
  // ----------------------------
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // ----------------------------
  // Build quiz set list
  // ----------------------------
  const quizSets = useMemo(() => {
    const items = [];

    DIFFICULTIES.forEach((difficulty) => {
      for (let i = 1; i <= SETS_PER_DIFFICULTY; i++) {
        const key = `cat${category.id}_${difficulty}_set${i}`;
        const data = quizSetMap[key];

        if (data?.results?.length >= 8) {
          items.push({
            id: key,
            difficulty: difficulty.charAt(0).toUpperCase() + difficulty.slice(1),
            time:
              difficulty === 'easy'
                ? '60 sec / Qs'
                : difficulty === 'medium'
                ? '45 sec / Qs'
                : '30 sec / Qs',
            questions: data.results.length,
            completed: completedSetIds.has(key),
            displayIndex: items.length + 1,
          });
        }
      }
    });

    return items;
  }, [completedSetIds, category.id]);

  // ----------------------------
  // Fetch user quiz progress when screen is focused
  // ----------------------------
  useFocusEffect(
    React.useCallback(() => {
      const fetchProgress = async () => {
        setLoadingProgress(true);

        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error('User fetch error:', userError);
          setLoadingProgress(false);
          return;
        }

        // Get completed quiz set IDs from history
        const { data: historyData, error } = await supabase
          .from('quiz_history')
          .select('quiz_set_id')
          .eq('user_id', user.id);

        if (error) {
          console.error('Progress fetch error:', error);
          setLoadingProgress(false);
          return;
        }

        // Mark completed sets
        const completed = new Set();
        historyData.forEach(({ quiz_set_id }) => {
          if (quiz_set_id && quizSetMap[quiz_set_id]?.results?.length >= 8) {
            completed.add(quiz_set_id);
          }
        });
        setCompletedSetIds(completed);

        // Fade in animation after short delay
        setTimeout(() => {
          setLoadingProgress(false);
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }).start();
        }, 500);
      };

      fetchProgress();
    }, [fadeAnim])
  );

  // ----------------------------
  // Handle quiz selection
  // ----------------------------
  const handleSelectQuiz = (item) => {
    const quizSet = quizSetMap[item.id];
    if (!quizSet?.results?.length) {
      Alert.alert('Invalid Quiz', 'This quiz has no questions.');
      return;
    }

    navigation.navigate('QuizContainer', {
      questions: quizSet.results,
      quizSetId: item.id,
      quizTitle: `#${item.displayIndex} ${category.title}`,
      difficulty: item.difficulty,
    });
  };

  // ----------------------------
  // Render
  // ----------------------------
  return (
    <QuizSetView
      category={category}
      quizSets={quizSets}
      loadingProgress={loadingProgress}
      fadeAnim={fadeAnim}
      navigation={navigation}
      onSelectQuiz={handleSelectQuiz}
    />
  );
}
