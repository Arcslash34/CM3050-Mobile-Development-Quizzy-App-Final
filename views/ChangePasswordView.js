// views/ChangePasswordView.js (Presentation Layer)
import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function ChangePasswordView({
  navigation,         // Navigation prop for moving between screens
  newPassword,        // Current value of the "New Password" field
  confirmPassword,    // Current value of the "Confirm New Password" field
  setNewPassword,     // Function to update the "New Password" field
  setConfirmPassword, // Function to update the "Confirm New Password" field
  onSubmit,           // Function to handle password update submission
}) {
  return (
    <SafeAreaView style={styles.container}>
      
      {/* ====== HEADER ====== */}
      {/* Contains back button, title, and placeholder for alignment */}
      <View style={styles.headerContainer}>
        {/* Back button */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>

        {/* Screen title */}
        <Text style={styles.headerText}>Change Password</Text>

        {/* Placeholder to keep title centered */}
        <View style={styles.placeholder} />
      </View>

      {/* ====== PASSWORD INPUTS ====== */}
      {/* New password field */}
      <TextInput
        secureTextEntry
        placeholder="New Password"
        style={styles.input}
        placeholderTextColor="#ccc"
        value={newPassword}
        onChangeText={setNewPassword}
      />

      {/* Confirm new password field */}
      <TextInput
        secureTextEntry
        placeholder="Confirm New Password"
        style={styles.input}
        placeholderTextColor="#ccc"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      {/* ====== SUBMIT BUTTON ====== */}
      <TouchableOpacity onPress={onSubmit} style={styles.button}>
        <Text style={styles.buttonText}>Update Password</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    padding: 20, 
    backgroundColor: '#1B182B' 
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: { padding: 5 },
  headerText: {
    flex: 1,
    textAlign: 'center',
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: { width: 28 },
  input: {
    backgroundColor: '#2A273E',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    color: '#fff',
  },
  button: {
    backgroundColor: '#6C63FF',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: { 
    color: '#fff', 
    fontWeight: 'bold' 
  },
});
