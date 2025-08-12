// containers/HomeContainer.js (Logic Layer)
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { getTriviaCategories } from '../utils/categoryUtils';
import { fetchAndCacheUserProfile, loadUserProfileFromCache } from '../utils/userProfile';
import { generateDailyQuiz } from '../utils/dailyQuiz';
import HomeView from '../views/HomeView';

export default function HomeContainer({ navigation }) {
  // ----------------------------
  // State: User info, categories, XP, rank
  // ----------------------------
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [categoryData, setCategoryData] = useState([]);
  const [rewardPoints, setRewardPoints] = useState(0);
  const [localRank, setLocalRank] = useState('-');

  // ----------------------------
  // Get total XP from quiz history
  // ----------------------------
  const fetchTotalXP = async (userId) => {
    const { data, error } = await supabase
      .from('quiz_history')
      .select('xp')
      .eq('user_id', userId);

    if (!error && data) {
      const totalXP = data.reduce((sum, entry) => sum + (entry.xp || 0), 0);
      setRewardPoints(totalXP);
    }
  };

  // ----------------------------
  // Get user's local ranking (XP-based, tie-breaker: earliest signup)
  // ----------------------------
  const fetchLocalRanking = async (userId) => {
    // Get all users' XP from history
    const { data: historyData } = await supabase
      .from('quiz_history')
      .select('user_id, xp');

    const xpMap = {};
    historyData?.forEach(({ user_id, xp }) => {
      xpMap[user_id] = (xpMap[user_id] || 0) + (xp || 0);
    });

    // Get profile creation dates for tie-breaking
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, created_at');

    // Merge XP + created_at
    const combined = profiles.map((p) => ({
      id: p.id,
      created_at: new Date(p.created_at),
      totalXP: xpMap[p.id] || 0,
    }));

    // Sort: XP desc, then oldest account first
    combined.sort((a, b) => {
      if (b.totalXP !== a.totalXP) return b.totalXP - a.totalXP;
      return a.created_at - b.created_at;
    });

    // Find rank for current user
    const rank = combined.findIndex((entry) => entry.id === userId) + 1;
    setLocalRank(rank > 0 ? `#${rank}` : '-');
  };

  // ----------------------------
  // Refresh data every time screen is focused
  // ----------------------------
  useEffect(() => {
    const onFocus = async () => {
      // Load category list
      const categories = await getTriviaCategories();
      setCategoryData(categories);

      // Load cached user profile for instant display
      const cached = await loadUserProfileFromCache();
      setUsername(cached.username);
      setAvatarUrl(cached.avatarUrl);

      // Fetch latest profile from server
      const latest = await fetchAndCacheUserProfile();
      setUsername(latest.username);
      setAvatarUrl(latest.avatarUrl);

      // Fetch XP + rank if logged in
      if (latest?.id) {
        fetchTotalXP(latest.id);
        fetchLocalRanking(latest.id);
      }
    };

    // Run when screen gains focus
    const unsubscribe = navigation.addListener('focus', onFocus);
    return unsubscribe;
  }, [navigation]);

  // ----------------------------
  // Navigation handlers
  // ----------------------------
  const handleCategoryPress = (category) => {
    navigation.navigate('QuizSet', { category });
  };

  const handleDailyQuiz = () => {
    const daily = generateDailyQuiz();
    navigation.navigate('QuizContainer', { ...daily });
  };

  const handleProfile = () => navigation.navigate('Profile');
  const handleRanking = () => navigation.navigate('Ranking');
  const handleAllCategories = () => navigation.navigate('AllCategories');

  // ----------------------------
  // Render Home screen
  // ----------------------------
  return (
    <HomeView
      username={username}
      avatarUrl={avatarUrl}
      categoryData={categoryData}
      rewardPoints={rewardPoints}
      localRank={localRank}
      onCategoryPress={handleCategoryPress}
      onDailyQuizPress={handleDailyQuiz}
      onProfilePress={handleProfile}
      onRankingPress={handleRanking}
      onAllCategoriesPress={handleAllCategories}
    />
  );
}
