// authentication/SignupScreen.js (Presentation Layer) — Displays signup form UI
import React from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function SignupScreen({
  email,
  setEmail,
  password,
  setPassword,
  confirm,
  setConfirm,
  handleSignup,
  error,
  goToLogin,
}) {
  return (
    <View style={styles.container}>
      <View style={styles.formCard}>
        {/* Title */}
        <Text style={styles.title}>Create Account</Text>

        {/* Email input */}
        <View style={styles.inputContainer}>
          <Ionicons name="mail" size={20} style={styles.icon} />
          <TextInput
            placeholder="Email"
            placeholderTextColor="#aaa"
            style={styles.input}
            value={email}
            onChangeText={setEmail}
          />
        </View>

        {/* Password input */}
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed" size={20} style={styles.icon} />
          <TextInput
            placeholder="Password"
            placeholderTextColor="#aaa"
            style={styles.input}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        {/* Confirm password input */}
        <View style={styles.inputContainer}>
          <Ionicons name="lock-closed" size={20} style={styles.icon} />
          <TextInput
            placeholder="Confirm Password"
            placeholderTextColor="#aaa"
            style={styles.input}
            secureTextEntry
            value={confirm}
            onChangeText={setConfirm}
          />
        </View>

        {/* Signup button */}
        <TouchableOpacity style={styles.button} onPress={handleSignup}>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>

        {/* Error message */}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {/* Link to login */}
        <TouchableOpacity onPress={goToLogin}>
          <Text style={styles.linkCenter}>Already a member? Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1B182B',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  formCard: {
    width: '100%',
    backgroundColor: '#2F2B45',
    padding: 24,
    borderRadius: 20,
    elevation: 5,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomColor: '#aaa',
    borderBottomWidth: 1,
    marginBottom: 20,
  },
  icon: { color: '#aaa', marginRight: 10 },
  input: { flex: 1, color: '#fff', paddingVertical: 10 },
  button: {
    backgroundColor: '#6C63FF',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 20,
  },
  error: { color: 'red', textAlign: 'center', marginTop: 10 },
  linkCenter: { color: '#6C63FF', textAlign: 'center', marginTop: 16 },
});
