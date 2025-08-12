// views/EditProfileView.js (Presentation Layer)
import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function EditProfileView({
  name,             // User's full name
  username,         // Username
  avatarUrl,        // URL of user's avatar
  uploading,        // Boolean indicating if avatar is being uploaded
  setName,          // Function to update name state
  setUsername,      // Function to update username state
  pickImage,        // Function to select and upload a new avatar
  updateProfile,    // Function to save profile changes
  navigation,       // Navigation prop for screen transitions
}) {
  return (
    <SafeAreaView style={styles.container}>

      {/* ====== HEADER ====== */}
      <View style={styles.headerContainer}>
        {/* Back Button */}
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>

        {/* Screen Title */}
        <Text style={styles.headerText}>Edit Profile</Text>

        {/* Placeholder for centering title */}
        <View style={styles.placeholder} />
      </View>

      {/* ====== AVATAR UPLOAD ====== */}
      <TouchableOpacity onPress={pickImage} disabled={uploading}>
        {avatarUrl ? (
          // Show current avatar
          <Image source={{ uri: avatarUrl }} style={styles.avatar} />
        ) : (
          // Show placeholder if no avatar
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarText}>
              {uploading ? 'Uploading...' : 'Upload Avatar'}
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {/* ====== NAME INPUT ====== */}
      <TextInput
        style={styles.input}
        placeholder="Name"
        placeholderTextColor="#aaa"
        onChangeText={setName}
        value={name}
      />

      {/* ====== USERNAME INPUT ====== */}
      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor="#aaa"
        onChangeText={setUsername}
        value={username}
        autoCapitalize="none"
      />

      {/* ====== UPDATE BUTTON ====== */}
      <TouchableOpacity style={styles.button} onPress={updateProfile} disabled={uploading}>
        <Text style={styles.buttonText}>
          {uploading ? 'Please wait...' : 'Update'}
        </Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#1B182B' },
  input: {
    backgroundColor: '#2A273E',
    color: '#fff',
    padding: 10,
    marginBottom: 12,
    borderRadius: 8,
  },
  button: {
    backgroundColor: '#6C63FF',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignSelf: 'center',
    marginBottom: 16,
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#444',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  avatarText: {
    color: '#ccc',
    fontSize: 12,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    padding: 5,
  },
  headerText: {
    flex: 1,
    textAlign: 'center',
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 28,
  },
});
