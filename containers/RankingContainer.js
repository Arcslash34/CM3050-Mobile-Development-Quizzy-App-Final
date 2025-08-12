// containers/RankingContainer.js (Logic Layer)
import React, { useState, useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';
import RankingView from '../views/RankingView';

// Tabs for ranking scopes
const tabKeys = ['daily', 'weekly', 'allTime'];

export default function RankingContainer() {
  const pagerRef = useRef(null);

  // UI state
  const [activeTab, setActiveTab] = useState('daily');
  const [rankingData, setRankingData] = useState({}); // { daily: [...], weekly: [...], allTime: [...] }
  const [loading, setLoading] = useState(false);

  // Hint arrow animation + visibility
  const [arrowAnim] = useState(new Animated.Value(0));
  const [showHint, setShowHint] = useState(false);

  // Fetch and compute rankings for a given tab
  const fetchData = async (tab) => {
    setLoading(true);

    // Date helpers for daily/weekly filters
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 7);

    // Pull users with embedded quiz_history rows
    const { data, error } = await supabase
      .from('profiles')
      .select(`id, username, avatar_url, quiz_history (xp, date_taken)`);

    if (error) {
      console.error('Ranking error:', error);
      setRankingData((prev) => ({ ...prev, [tab]: [] }));
      setLoading(false);
      return;
    }

    // Aggregate XP per user based on the active tab's time window
    const ranked = data.map((user) => {
      let totalXP = 0;
      if (Array.isArray(user.quiz_history)) {
        user.quiz_history.forEach((entry) => {
          if (tab === 'daily' && entry.date_taken === todayStr) {
            totalXP += entry.xp;
          } else if (tab === 'weekly') {
            const entryDate = new Date(entry.date_taken);
            if (entryDate >= weekAgo) totalXP += entry.xp;
          } else if (tab === 'allTime') {
            totalXP += entry.xp;
          }
        });
      }
      return {
        id: user.id,
        name: user.username || 'Anonymous',
        avatar: user.avatar_url,
        score: totalXP,
      };
    });

    // Sort high-to-low and store by tab
    const sorted = ranked.sort((a, b) => b.score - a.score);
    setRankingData((prev) => ({ ...prev, [tab]: sorted }));
    setLoading(false);
  };

  // One-time swipe hint with pulsing arrow; persists "seen" flag
  useEffect(() => {
    const checkTutorial = async () => {
      const seen = await AsyncStorage.getItem('seenSwipeHint');
      if (!seen) {
        setShowHint(true);
        const anim = Animated.loop(
          Animated.sequence([
            Animated.timing(arrowAnim, {
              toValue: 1,
              duration: 500,
              easing: Easing.linear,
              useNativeDriver: true,
            }),
            Animated.timing(arrowAnim, {
              toValue: 0,
              duration: 500,
              easing: Easing.linear,
              useNativeDriver: true,
            }),
          ])
        );
        anim.start();
        setTimeout(() => {
          anim.stop();
          setShowHint(false);
        }, 4000);
        await AsyncStorage.setItem('seenSwipeHint', 'true');
      }
    };
    checkTutorial();
  }, [arrowAnim]);

  // Lazy-load ranking for current tab (fetch only if missing)
  useEffect(() => {
    if (!rankingData[activeTab]) fetchData(activeTab);
  }, [activeTab, rankingData]);

  // Pass state + handlers to presentation layer
  return (
    <RankingView
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      pagerRef={pagerRef}
      rankingData={rankingData}
      loading={loading}
      showHint={showHint}
      arrowAnim={arrowAnim}
      tabKeys={tabKeys}
      fetchData={fetchData}
    />
  );
}
