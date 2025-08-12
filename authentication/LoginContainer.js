// authentication/LoginContainer.js (Logic Layer) — Handles login process and navigation
import React, { useState } from 'react';
import LoginScreen from './LoginScreen';
import { supabase } from '../supabase';
import { scheduleDailyQuizNotification } from '../utils/notifications';

export default function LoginContainer({ navigation }) {
  const [emailOrUsername, setEmailOrUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  // Attempts login with email or username
  const handleLogin = async () => {
    setError('');
    let loginEmail = emailOrUsername;

    // If username is provided, fetch corresponding email from profiles
    if (!emailOrUsername.includes('@')) {
      const { data, error } = await supabase
        .from('profiles')
        .select('email')
        .eq('username', emailOrUsername)
        .single();
      if (error || !data) return setError('No account with that username.');
      loginEmail = data.email;
    }

    // Sign in using Supabase authentication
    const { error: loginError } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password,
    });

    // Show error or schedule daily quiz notification on success
    if (loginError) {
      setError(loginError.message);
    } else {
      await scheduleDailyQuizNotification();
    }
  };

  return (
    <LoginScreen
      emailOrUsername={emailOrUsername}
      setEmailOrUsername={setEmailOrUsername}
      password={password}
      setPassword={setPassword}
      handleLogin={handleLogin}
      error={error}
      goToForgot={() => navigation.navigate('ForgotPassword')}
      goToSignup={() => navigation.navigate('Signup')}
    />
  );
}
