// containers/SettingsContainer.js (Logic Layer)
import React, { useState, useEffect, useRef } from 'react';
import { Alert, Animated, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';
import SettingsView from '../views/SettingsView';
import {
  scheduleDailyQuizNotification,
  cancelDailyQuizNotification,
} from '../utils/notifications';
import {
  fetchAndCacheUserProfile,
  loadUserProfileFromCache,
} from '../utils/userProfile';

// Helper: Convert ISO country code to flag emoji
const countryCodeToFlagEmoji = (code) =>
  code.toUpperCase().replace(/./g, (char) =>
    String.fromCodePoint(127397 + char.charCodeAt())
  );

export default function SettingsContainer() {
  // State for toggles and profile info
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [vibrationEnabled, setVibrationEnabled] = useState(true);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [avatarReady, setAvatarReady] = useState(false);
  const [region, setRegion] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [loadingRegion, setLoadingRegion] = useState(false);

  // Animated value for spinning loading icon
  const spinAnim = useRef(new Animated.Value(0)).current;

  const navigation = useNavigation();

  // --- Load notification preference from storage ---
  useEffect(() => {
    const loadNotificationToggle = async () => {
      const storedValue = await AsyncStorage.getItem('notificationsEnabled');
      if (storedValue === null) {
        // Default to ON if not set
        setNotificationsEnabled(true);
        await AsyncStorage.setItem('notificationsEnabled', 'true');
      } else {
        setNotificationsEnabled(storedValue === 'true');
      }
    };
    loadNotificationToggle();
  }, []);

  // --- Load cached profile info (fast startup) ---
  useEffect(() => {
    const loadCached = async () => {
      const cached = await loadUserProfileFromCache();
      setAvatarUrl(cached.avatarUrl);
      setUsername(cached.username);
    };
    loadCached();
  }, []);

  // --- Load sound/vibration settings ---
  useEffect(() => {
    const loadGameSettings = async () => {
      const sound = await AsyncStorage.getItem('soundEnabled');
      const vibration = await AsyncStorage.getItem('vibrationEnabled');
      if (sound !== null) setSoundEnabled(sound === 'true');
      if (vibration !== null) setVibrationEnabled(vibration === 'true');
    };
    loadGameSettings();
  }, []);

  // --- Fetch latest profile from Supabase on focus ---
  useEffect(() => {
    const fetchProfile = async () => {
      // Get latest profile and cache it
      const latest = await fetchAndCacheUserProfile();
      setUsername(latest.username);
      setAvatarUrl(latest.avatarUrl);

      // Get email from auth session
      const { data: userData } = await supabase.auth.getUser();
      setEmail(userData?.user?.email || '');

      // Get region from DB
      const { data, error } = await supabase
        .from('profiles')
        .select('region')
        .eq('id', userData?.user?.id)
        .single();

      if (data) setRegion(data.region || '');
      if (error) console.error('Error fetching region:', error.message);
    };

    // Refresh every time screen is focused
    const unsubscribe = navigation.addListener('focus', fetchProfile);
    return unsubscribe;
  }, [navigation]);

  // --- Update region using device location ---
  const updateRegion = async () => {
    if (loadingRegion) return; // Prevent double triggers
    setLoadingRegion(true);
    startSpinning();

    try {
      // Request location permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access location was denied');
        return;
      }

      // Get precise coordinates
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
        maximumAge: 0,
      });

      // Reverse geocode to get country name & ISO code
      const geocode = await Location.reverseGeocodeAsync(location.coords);
      if (geocode.length > 0) {
        const country = geocode[0].country || 'Unknown';
        const countryCode = geocode[0].isoCountryCode || '';
        const flag = countryCodeToFlagEmoji(countryCode);
        const regionName = `${country} ${flag}`;
        setRegion(regionName);

        // Save to Supabase
        const { data: userData } = await supabase.auth.getUser();
        const userId = userData?.user?.id;
        if (!userId) return;

        await supabase
          .from('profiles')
          .update({ region: regionName })
          .eq('id', userId);
      }
    } catch (error) {
      console.error('Failed to detect region:', error);
    } finally {
      stopSpinning();
      setLoadingRegion(false);
    }
  };

  // --- Notification toggle handler ---
  const onToggleNotifications = async (value) => {
    setNotificationsEnabled(value);
    await AsyncStorage.setItem('notificationsEnabled', value.toString());

    if (value) {
      await scheduleDailyQuizNotification();
    } else {
      await cancelDailyQuizNotification();
    }
  };

  // --- Sound toggle handler ---
  const onToggleSound = async (value) => {
    setSoundEnabled(value);
    await AsyncStorage.setItem('soundEnabled', value.toString());
  };

  // --- Vibration toggle handler ---
  const onToggleVibration = async (value) => {
    setVibrationEnabled(value);
    await AsyncStorage.setItem('vibrationEnabled', value.toString());
  };

  // --- Start loading animation ---
  const startSpinning = () => {
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      })
    ).start();
  };

  // --- Stop loading animation ---
  const stopSpinning = () => {
    spinAnim.stopAnimation(() => spinAnim.setValue(0));
  };

  // --- Logout handler ---
  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        style: 'destructive',
        onPress: async () => {
          await supabase.auth.signOut();
          await AsyncStorage.clear();
          navigation.replace('AuthWrapper'); // Go back to login
        },
      },
    ]);
  };

  // Render presentation layer
  return (
    <SettingsView
      notificationsEnabled={notificationsEnabled}
      onToggleNotifications={onToggleNotifications}
      soundEnabled={soundEnabled}
      vibrationEnabled={vibrationEnabled}
      onToggleSound={onToggleSound}
      onToggleVibration={onToggleVibration}
      avatarUrl={avatarUrl}
      modalVisible={modalVisible}
      avatarReady={avatarReady}
      region={region}
      username={username}
      email={email}
      loadingRegion={loadingRegion}
      spinAnim={spinAnim}
      navigation={navigation}
      setModalVisible={setModalVisible}
      setAvatarReady={setAvatarReady}
      onDetectRegion={updateRegion}
      handleLogout={handleLogout}
    />
  );
}
