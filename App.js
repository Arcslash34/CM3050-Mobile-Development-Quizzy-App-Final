// App.js — Main entry point
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import MainNavigation from './MainNavigation';

// Notification settings for foreground mode
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      <MainNavigation />
    </SafeAreaProvider>
  );
}
