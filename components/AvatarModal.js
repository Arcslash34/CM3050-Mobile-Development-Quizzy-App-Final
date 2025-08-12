// components/AvatarModal.js (Presentation Layer) — Displays a full-size avatar in a modal
import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Image,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';

export default function AvatarModal({ visible, onClose, avatarUrl }) {
  const [loaded, setLoaded] = useState(false);

  // Reset loading state when modal is opened
  useEffect(() => {
    if (visible) {
      setLoaded(false);
    }
  }, [visible]);

  return (
    <Modal
      transparent
      visible={visible}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        {/* Close modal when background is pressed */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={styles.modalContent}>
          {/* Loader shown until image is loaded */}
          {!loaded && (
            <ActivityIndicator size="large" color="#fff" style={styles.loader} />
          )}
          {/* Avatar image */}
          <Image
            source={avatarUrl ? { uri: avatarUrl } : require('../assets/images/profile.png')}
            style={[styles.fullAvatar, !loaded && styles.hidden]}
            onLoad={() => setLoaded(true)}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  fullAvatar: {
    width: 250,
    height: 250,
    borderRadius: 125,
    resizeMode: 'cover',
  },
  hidden: {
    width: 0,
    height: 0,
  },
  loader: {
    position: 'absolute',
  },
});
