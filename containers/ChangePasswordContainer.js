// containers/ChangePasswordContainer.js (Logic Layer)
import React, { useState } from 'react';
import { Alert } from 'react-native';
import { supabase } from '../supabase';
import ChangePasswordView from '../views/ChangePasswordView';

export default function ChangePasswordContainer({ navigation }) {
  // State for new password input
  const [newPassword, setNewPassword] = useState('');
  // State for confirm password input
  const [confirmPassword, setConfirmPassword] = useState('');

  // Handles password change logic
  const handleChangePassword = async () => {
    // Validate minimum password length
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long.');
      return;
    }

    // Ensure passwords match
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match.');
      return;
    }

    // Update password in Supabase
    const { error } = await supabase.auth.updateUser({ password: newPassword });

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Success', 'Password updated successfully!');
      navigation.goBack(); // Return to previous screen
    }
  };

  // Pass state and handler to the presentation layer
  return (
    <ChangePasswordView
      navigation={navigation}
      newPassword={newPassword}
      confirmPassword={confirmPassword}
      setNewPassword={setNewPassword}
      setConfirmPassword={setConfirmPassword}
      onSubmit={handleChangePassword}
    />
  );
}
