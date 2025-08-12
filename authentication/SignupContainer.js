// authentication/SignupContainer.js (Logic Layer) — Handles user signup logic
import React, { useState } from 'react';
import SignupScreen from './SignupScreen';
import { supabase } from '../supabase';

export default function SignupContainer({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');

  // Creates a new account
  const handleSignup = async () => {
    setError('');
    // Check if passwords match
    if (password !== confirm) return setError("Passwords don't match.");

    // Call Supabase signup API
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: 'https://supabase-reset-password-9j5m.vercel.app/confirm.html',
      },
    });

    // Show error or confirmation message
    if (error) setError(error.message);
    else setError('Check your inbox to confirm your email.');
  };

  return (
    <SignupScreen
      email={email}
      setEmail={setEmail}
      password={password}
      setPassword={setPassword}
      confirm={confirm}
      setConfirm={setConfirm}
      handleSignup={handleSignup}
      error={error}
      goToLogin={() => navigation.navigate('Login')}
    />
  );
}
