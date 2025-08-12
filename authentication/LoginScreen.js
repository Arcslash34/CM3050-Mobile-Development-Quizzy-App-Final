// authentication/LoginScreen.js (Presentation Layer) — Displays the login form UI
import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function LoginScreen({
  emailOrUsername, setEmailOrUsername,
  password, setPassword,
  handleLogin, error,
  goToForgot, goToSignup,
}) {
  return (
    <View style={styles.container}>
      <View style={styles.formCard}>
        {/* Title */}
        <Text style={styles.title}>Login</Text>

        {/* Email or Username field */}
        <View style={styles.inputContainer}>
          <Ionicons name="person" size={20} style={styles.icon} />
          <TextInput
            placeholder="Email or Username"
            placeholderTextColor="#aaa"
            style={styles.input}
            value={emailOrUsername}
            onChangeText={setEmailOrUsername}
          />
        </View>

        {/* Password field */}
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

        {/* Forgot password link */}
        <TouchableOpacity onPress={goToForgot}>
          <Text style={styles.linkRight}>Forgot Password?</Text>
        </TouchableOpacity>

        {/* Login button */}
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>

        {/* Error message */}
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {/* Signup link */}
        <TouchableOpacity onPress={goToSignup}>
          <Text style={styles.linkCenter}>New User? Create Account</Text>
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
  icon: {
    color: '#aaa',
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#fff',
    paddingVertical: 10,
  },
  button: {
    backgroundColor: '#6C63FF',
    paddingVertical: 14,
    borderRadius: 30,
    alignItems: 'center',
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  error: {
    color: 'red',
    textAlign: 'center',
    marginTop: 10,
  },
  linkRight: {
    color: '#6C63FF',
    textAlign: 'right',
    marginBottom: 10,
  },
  linkCenter: {
    color: '#6C63FF',
    textAlign: 'center',
    marginTop: 16,
  },
});
