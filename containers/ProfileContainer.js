// containers/ProfileContainer.js (Logic Layer)
import React, { useEffect, useState } from 'react';
import ProfileView from '../views/ProfileView';
import { supabase } from '../supabase';
import { achievements } from '../utils/badgeConfig';
import { checkAndAwardBadges } from '../utils/badgeLogic';
import {
  getCachedBadgeProgress,
  setCachedBadgeProgress,
  fetchBadgeProgressFromSupabase,
} from '../utils/badgeService';
import {
  fetchAndCacheUserProfile,
  loadUserProfileFromCache,
} from '../utils/userProfile';

export default function ProfileContainer({ navigation }) {
  // ----------------------------
  // State: Profile info, badges, UI controls
  // ----------------------------
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [badgeProgress, setBadgeProgress] = useState({});
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  // ----------------------------
  // Load cached profile & badge data on mount (instant load)
  // ----------------------------
  useEffect(() => {
    (async () => {
      const cachedProfile = await loadUserProfileFromCache();
      setAvatarUrl(cachedProfile.avatarUrl);
      setName(cachedProfile.username);

      const cachedProgress = await getCachedBadgeProgress();
      setBadgeProgress(cachedProgress);
    })();
  }, []);

  // ----------------------------
  // Fetch latest profile & badge progress from Supabase
  // ----------------------------
  useEffect(() => {
    (async () => {
      // Fetch latest profile data & update local cache
      const latest = await fetchAndCacheUserProfile();
      setName(latest.username);
      setAvatarUrl(latest.avatarUrl);

      // Get user email
      const { data: userRes } = await supabase.auth.getUser();
      setEmail(userRes?.user?.email || '');

      // Check and award any newly earned badges
      await checkAndAwardBadges();

      // Fetch badge progress from Supabase and cache locally
      const remoteProgress = await fetchBadgeProgressFromSupabase();
      if (Object.keys(remoteProgress).length) {
        setBadgeProgress(remoteProgress);
        await setCachedBadgeProgress(remoteProgress);
      }

      setLoading(false);
    })();
  }, []);

  // ----------------------------
  // Share unlocked achievement & log share event
  // ----------------------------
  const handleShare = async () => {
    if (!selectedAchievement) return;

    try {
      const result = await Share.share({
        message: `🏆 I just unlocked the "${selectedAchievement.title}" badge on Quizzy! 🎉\n${selectedAchievement.description}`,
      });

      if (result.action === Share.sharedAction) {
        const { data: userRes } = await supabase.auth.getUser();
        if (userRes?.user?.id) {
          // Log share event for badge tracking
          await supabase.from('user_shares').insert({
            user_id: userRes.user.id,
            type: 'badge',
          });
          await checkAndAwardBadges();
        }
      }
    } catch (e) {
      console.error('Share error', e);
    }
  };

  // ----------------------------
  // Render Profile screen
  // ----------------------------
  return (
    <ProfileView
      navigation={navigation}
      avatarModalVisible={avatarModalVisible}
      setAvatarModalVisible={setAvatarModalVisible}
      avatarUrl={avatarUrl}
      name={name}
      email={email}
      achievements={achievements}
      badgeProgress={badgeProgress}
      selectedAchievement={selectedAchievement}
      setSelectedAchievement={setSelectedAchievement}
      modalVisible={modalVisible}
      setModalVisible={setModalVisible}
      handleShare={handleShare}
      loading={loading}
    />
  );
}
