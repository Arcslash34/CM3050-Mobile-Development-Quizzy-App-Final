// containers/EditProfileContainer.js (Logic Layer)
import React, { useState, useEffect } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../supabase';
import EditProfileView from '../views/EditProfileView';

export default function EditProfileContainer({ navigation }) {
  // ----------------------------
  // State for user profile fields
  // ----------------------------
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [userId, setUserId] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [userEmail, setUserEmail] = useState(null);
  const [accessToken, setAccessToken] = useState(null);

  // ----------------------------
  // Fetch profile data on mount
  // ----------------------------
  useEffect(() => {
    const fetchProfile = async () => {
      // Get active session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        Alert.alert('Error', sessionError.message);
        return;
      }

      // Extract ID, email, and token
      const id = session?.user?.id;
      const email = session?.user?.email;
      const token = session?.access_token;
      setAccessToken(token);

      // Stop if no ID or email
      if (!id || !email) return;

      setUserId(id);
      setUserEmail(email);

      // Fetch profile from Supabase
      const { data, error } = await supabase
        .from('profiles')
        .select()
        .eq('id', id)
        .single();

      // Handle database error except "no row found"
      if (error && error.code !== 'PGRST116') {
        Alert.alert('Error', error.message);
      }

      // Set profile fields
      if (data) {
        setName(data.name || '');
        setUsername(data.username || '');
        setAvatarUrl(data.avatar_url || null);
      }
    };

    fetchProfile();
  }, []);

  // ----------------------------
  // Show options for picking image
  // ----------------------------
  const pickImage = async () => {
    Alert.alert(
      'Select Image Source',
      'Choose an option',
      [
        { text: 'Camera', onPress: () => openCamera() },
        { text: 'Gallery', onPress: () => openGallery() },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  // ----------------------------
  // Open device camera
  // ----------------------------
  const openCamera = async () => {
    try {
      // Request camera permission
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        return Alert.alert('Permission Denied', 'Camera access is required to take a photo.');
      }

      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1], // Square crop
        quality: 0.7,
      });

      // If user took a photo, upload it
      if (!result.canceled && result.assets?.length) {
        await handleImageUpload(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Camera error:', error);
      Alert.alert('Error', 'Failed to open camera');
    }
  };

  // ----------------------------
  // Open gallery picker
  // ----------------------------
  const openGallery = async () => {
    try {
      // Request media library permission
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        return Alert.alert('Permission Denied', 'Media access is required to choose an image.');
      }

      // Launch gallery
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      // If user selected an image, upload it
      if (!result.canceled && result.assets?.length) {
        await handleImageUpload(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Gallery error:', error);
      Alert.alert('Error', 'Failed to open gallery');
    }
  };

  // ----------------------------
  // Upload image to Supabase Storage
  // ----------------------------
  const handleImageUpload = async (uri) => {
    if (!userId) return;

    setUploading(true);

    try {
      if (!accessToken || !userEmail) throw new Error("Missing session or email");

      // Prepare file name and path
      const fileExt = uri.split('.').pop().toLowerCase();
      const fileName = `${uuidv4()}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;
      const bucket = 'avatars';

      // Build form data for upload
      const formData = new FormData();
      formData.append('file', {
        uri,
        name: fileName,
        type: `image/${fileExt}`,
      });

      // Upload file to Supabase Storage REST API
      const uploadRes = await fetch(
        `https://litprnfjvytjttlqyhlj.supabase.co/storage/v1/object/${bucket}/${filePath}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          body: formData,
        }
      );

      // Handle upload failure
      if (!uploadRes.ok) {
        const errorText = await uploadRes.text();
        throw new Error(`Upload failed: ${errorText}`);
      }

      // Get public URL for uploaded image
      const { data: { publicUrl } } = supabase
        .storage
        .from(bucket)
        .getPublicUrl(filePath);

      // Update profile in database with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: publicUrl,
          email: userEmail,
        })
        .eq('id', userId);

      if (updateError) throw updateError;

      // Save avatar URL to state
      setAvatarUrl(publicUrl);
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Upload Failed', error.message);
    } finally {
      setUploading(false);
    }
  };

  // ----------------------------
  // Save updated profile details
  // ----------------------------
  const updateProfile = async () => {
    try {
      if (!userId || !userEmail) throw new Error("Missing user info");

      // Update profile in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({
          name,
          username,
          avatar_url: avatarUrl,
          email: userEmail,
        })
        .eq('id', userId);

      if (error) throw error;

      Alert.alert('Success', 'Profile updated');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', error.message);
    }
  };

  // ----------------------------
  // Render profile edit UI
  // ----------------------------
  return (
    <EditProfileView
      name={name}
      username={username}
      avatarUrl={avatarUrl}
      uploading={uploading}
      setName={setName}
      setUsername={setUsername}
      pickImage={pickImage}
      updateProfile={updateProfile}
      navigation={navigation}
    />
  );
}
