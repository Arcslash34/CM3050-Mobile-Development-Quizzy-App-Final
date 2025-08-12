// authentication/ForgotPasswordContainer.js (Logic Layer) — Handles password reset flow
import React, { useState } from 'react';
import ForgotPasswordScreen from './ForgotPasswordScreen';
import { supabase } from '../supabase';

export default function ForgotPasswordContainer({ navigation }) {
  const [email, setEmail] = useState('');
  const [msg, setMsg] = useState('');

  // Sends a reset password email via Supabase
  const handleReset = async () => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://supabase-reset-password-9j5m.vercel.app/reset.html',
    });
    setMsg(error ? error.message : 'Check your inbox for a reset link.');
  };

  return (
    <ForgotPasswordScreen
      email={email}
      setEmail={setEmail}
      handleReset={handleReset}
      msg={msg}
      goBack={() => navigation.navigate('Login')}
    />
  );
}
