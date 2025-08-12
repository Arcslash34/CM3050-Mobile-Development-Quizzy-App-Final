// authentication/ForgotPasswordScreen.js (Presentation Layer) — UI for password reset form
import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function ForgotPasswordScreen({ email, setEmail, handleReset, msg, goBack }) {
  return (
    <View style={styles.container}>
      <View style={styles.formCard}>
        <Text style={styles.title}>Reset Password</Text>

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

        {/* Submit reset request */}
        <TouchableOpacity style={styles.button} onPress={handleReset}>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>

        {/* Feedback message */}
        {msg ? <Text style={styles.error}>{msg}</Text> : null}

        {/* Back navigation */}
        <TouchableOpacity onPress={goBack}>
          <Text style={styles.linkCenter}>Back to Login</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1B182B', justifyContent: 'center', alignItems: 'center', padding: 20 },
  formCard: { width: '100%', backgroundColor: '#2F2B45', padding: 24, borderRadius: 20, elevation: 5 },
  title: { color: '#fff', fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 24 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', borderBottomColor: '#aaa', borderBottomWidth: 1, marginBottom: 20 },
  icon: { color: '#aaa', marginRight: 10 },
  input: { flex: 1, color: '#fff', paddingVertical: 10 },
  button: { backgroundColor: '#6C63FF', paddingVertical: 14, borderRadius: 30, alignItems: 'center', marginTop: 20 },
  error: { color: 'red', textAlign: 'center', marginTop: 10 },
  linkCenter: { color: '#6C63FF', textAlign: 'center', marginTop: 16 },
});
