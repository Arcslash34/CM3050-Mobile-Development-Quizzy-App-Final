// authentication/AuthWrapper.js (Logic Layer) — Controls auth flow and session handling
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import SignupContainer from './SignupContainer.js';
import ForgotPasswordContainer from './ForgotPasswordContainer';
import LoginContainer from './LoginContainer.js';

const Stack = createNativeStackNavigator();

export default function AuthWrapper({ navigation, route }) {
  const [session, setSession] = useState(null);

  useEffect(() => {
    // Check for existing session on mount
    const initSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        await AsyncStorage.setItem('user_session', JSON.stringify(data.session));
        setSession(data.session);
        navigation.replace(route?.params?.next || 'Main');
      } else {
        setSession(null);
      }
    };

    initSession();

    // Listen for login/logout changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        AsyncStorage.setItem('user_session', JSON.stringify(session));
        navigation.replace(route?.params?.next || 'Main');
      } else {
        AsyncStorage.removeItem('user_session');
        setSession(null);
      }
    });

    return () => listener.subscription.unsubscribe();
  }, [navigation, route]);

  // If no session, show auth screens
  if (!session) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginContainer} />
        <Stack.Screen name="Signup" component={SignupContainer} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordContainer} />
      </Stack.Navigator>
    );
  }

  // If session exists, redirect happens via navigation.replace
  return null;
}
