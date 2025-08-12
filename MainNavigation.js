import React, { useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { scheduleDailyQuizNotification } from './utils/notifications';
import { checkIfDailyQuizDone } from './utils/quizHelpers';

// Screens
import SplashView from './views/SplashView';
import HomeContainer from './containers/HomeContainer';
import HistoryContainer from './containers/HistoryContainer';
import RankingContainer from './containers/RankingContainer';
import ProfileContainer from './containers/ProfileContainer';
import SettingsContainer from './containers/SettingsContainer';
import AllCategoriesContainer from './containers/AllCategoriesContainer';
import QuizSetContainer from './containers/QuizSetContainer';
import QuizContainer from './containers/QuizContainer';
import ResultContainer from './containers/ResultContainer';
import ReviewContainer from './containers/ReviewContainer';
import AuthWrapper from './authentication/AuthWrapper';
import EditProfileContainer from './containers/EditProfileContainer';
import ChangePasswordContainer from './containers/ChangePasswordContainer';
import DailyQuizWrapper from './containers/DailyQuizWrapper';
import FriendsContainer from './containers/FriendsContainer';
import MessagesContainer from './containers/MessagesContainer';
import ChatContainer from './containers/ChatContainer';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

/** Bottom tab navigator for the main app **/
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#121212',
          borderTopWidth: 0,
          height: 60,
        },
        tabBarLabelStyle: { fontSize: 12 },
        // Icon per tab
        tabBarIcon: ({ focused, color }) => {
          switch (route.name) {
            case 'Home':
              return <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />;
            case 'History':
              return <MaterialCommunityIcons name="history" size={24} color={color} />;
            case 'Ranking':
              return <Ionicons name="stats-chart" size={24} color={color} />;
            case 'Profile':
              return <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />;
            case 'Settings':
              return <Ionicons name={focused ? 'settings' : 'settings-outline'} size={24} color={color} />;
          }
        },
        tabBarActiveTintColor: '#fff',
        tabBarInactiveTintColor: '#888',
      })}
    >
      <Tab.Screen name="Home" component={HomeContainer} />
      <Tab.Screen name="History" component={HistoryContainer} />
      <Tab.Screen name="Ranking" component={RankingContainer} />
      <Tab.Screen name="Profile" component={ProfileContainer} />
      <Tab.Screen name="Settings" component={SettingsContainer} />
    </Tab.Navigator>
  );
}

/** Root stack that includes splash/auth/main + feature screens **/
export default function MainNavigation() {
  // Used to navigate when a push notification is tapped
  const navigationRef = useRef();
  // Guard to avoid scheduling notifications more than once
  const notificationScheduledRef = useRef(false);

  // Listen once for notification taps and deep-link into DailyQuiz
  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const screen = response.notification.request.content.data?.screen;
      if (screen === 'DailyQuiz') {
        navigationRef.current?.navigate('DailyQuizWrapper');
      }
    });
    // Cleanup listener on unmount
    return () => subscription.remove();
  }, []);

  // Schedule the recurring daily quiz notification (only once)
  useEffect(() => {
    const initializeNotifications = async () => {
      // prevent duplicate scheduling across hot reloads/mounts
      if (notificationScheduledRef.current) return;
      notificationScheduledRef.current = true;

      // Ask for notification permissions if not yet granted
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        const { status: newStatus } = await Notifications.requestPermissionsAsync();
        console.log('🔔 Notification permission status:', newStatus);
      }

      // Only schedule for logged-in users
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Respect in-app toggle; default to enabled on first run
      let currentSetting = await AsyncStorage.getItem('notificationsEnabled');
      if (currentSetting === null) {
        await AsyncStorage.setItem('notificationsEnabled', 'true');
        currentSetting = 'true';
      }
      if (currentSetting === 'false') return;

      // Avoid duplicating the same scheduled notification
      const allScheduled = await Notifications.getAllScheduledNotificationsAsync();
      const alreadyScheduled = allScheduled.some(n =>
        n.content.title?.includes('Daily Quiz')
      );

      if (!alreadyScheduled) {
        // Only schedule if user hasn’t completed today’s daily quiz
        const isDone = await checkIfDailyQuizDone(user.id);
        if (!isDone) {
          await scheduleDailyQuizNotification();
          console.log('📅 Daily quiz notification scheduled after login.');
        } else {
          console.log('✅ Daily quiz already completed today.');
        }
      } else {
        console.log('⏱️ Daily quiz notification already scheduled.');
      }
    };

    initializeNotifications();
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Splash → Auth or Main */}
        <Stack.Screen name="Splash" component={SplashView} />
        {/* Handles login/register and routes onward */}
        <Stack.Screen name="AuthWrapper" component={AuthWrapper} />
        {/* Tab navigator (Home/History/Ranking/Profile/Settings) */}
        <Stack.Screen name="Main" component={MainTabs} />
        {/* Feature screens below */}
        <Stack.Screen name="AllCategories" component={AllCategoriesContainer} />
        <Stack.Screen name="QuizSet" component={QuizSetContainer} />
        <Stack.Screen name="QuizContainer" component={QuizContainer} />
        <Stack.Screen name="ResultContainer" component={ResultContainer} />
        <Stack.Screen name="ReviewContainer" component={ReviewContainer} />
        <Stack.Screen name="EditProfile" component={EditProfileContainer} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordContainer} />
        <Stack.Screen name="DailyQuizWrapper" component={DailyQuizWrapper} />
        <Stack.Screen name="FriendsContainer" component={FriendsContainer} />
        <Stack.Screen name="MessagesContainer" component={MessagesContainer} />
        <Stack.Screen name="ChatContainer" component={ChatContainer} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
