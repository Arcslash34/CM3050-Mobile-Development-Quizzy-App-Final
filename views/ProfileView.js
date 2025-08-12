// views/ProfileView.js (Presentation Layer)
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  FlatList,
  Modal,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AvatarModal from '../components/AvatarModal';
import BadgeItem from '../components/BadgeItem';

export default function ProfileView({
  navigation, // Navigation object
  avatarUrl, // User avatar URL
  name, // Display name
  email, // User email
  avatarModalVisible, // State for avatar modal visibility
  setAvatarModalVisible, // Setter for avatar modal visibility
  badgeProgress, // Object tracking badge progress { badgeId: progressValue }
  achievements, // Array of achievement data
  selectedAchievement, // Currently selected achievement
  setSelectedAchievement, // Setter for selected achievement
  modalVisible, // State for badge modal visibility
  setModalVisible, // Setter for badge modal visibility
  handleShare, // Handler for sharing achievement
}) {
  return (
    <SafeAreaView style={styles.container}>
      {/* ====== HEADER ====== */}
      <LinearGradient colors={['#2A273E', '#1B182B']} style={styles.header}>
        <Text style={styles.profileTitle}>Profile</Text>
        <TouchableOpacity onPress={() => setAvatarModalVisible(true)}>
          <Image
            source={
              avatarUrl
                ? { uri: avatarUrl }
                : require('../assets/images/profile.png')
            }
            style={styles.avatar}
          />
        </TouchableOpacity>
        <Text style={styles.name}>{name || 'your_username'}</Text>
        <Text style={styles.email}>{email || 'you@email.com'}</Text>
      </LinearGradient>

      {/* ====== SOCIAL SECTION ====== */}
      <View style={styles.sectionTitleWrapper}>
        <Text style={styles.sectionTitle}>Social</Text>
      </View>
      <View style={styles.socialButtons}>
        <TouchableOpacity
          style={styles.socialBtn}
          onPress={() => navigation.navigate('FriendsContainer')}>
          <Ionicons name="people-outline" size={24} color="#fff" />
          <Text style={styles.socialBtnText}>Friends</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.socialBtn}
          onPress={() => navigation.navigate('MessagesContainer')}>
          <Ionicons name="chatbubble-ellipses-outline" size={24} color="#fff" />
          <Text style={styles.socialBtnText}>Messages</Text>
        </TouchableOpacity>
      </View>

      {/* ====== ACHIEVEMENTS SECTION ====== */}
      <View style={styles.sectionTitleWrapper}>
        <Text style={styles.sectionTitle}>Achievements</Text>
      </View>
      <FlatList
        data={achievements.slice().sort((a, b) => {
          const progressA = badgeProgress[a.id] ?? 0;
          const progressB = badgeProgress[b.id] ?? 0;
          if (progressA === 1 && progressB < 1) return -1;
          if (progressB === 1 && progressA < 1) return 1;
          return progressB - progressA;
        })}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.achievementList}
        renderItem={({ item }) => {
          const progress = badgeProgress[item.id] ?? 0;
          return (
            <BadgeItem
              item={item}
              progress={progress}
              onPress={(selected) => {
                setSelectedAchievement(selected);
                setModalVisible(true);
              }}
            />
          );
        }}
      />

      {/* ====== AVATAR MODAL ====== */}
      <AvatarModal
        visible={avatarModalVisible}
        onClose={() => setAvatarModalVisible(false)}
        avatarUrl={avatarUrl}
      />

      {/* ====== BADGE MODAL ====== */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <ImageBackground
            source={require('../assets/images/background.png')}
            style={styles.modalBackgroundImage}
            imageStyle={{ borderRadius: 20 }}>
            <View style={styles.dimmerOverlay} />
            <View style={styles.modalBox}>
              <Text style={styles.modalTitle}>Congratulations!</Text>
              {selectedAchievement && (
                <>
                  <Image
                    source={selectedAchievement.badge}
                    style={styles.modalBadge}
                  />
                  <Text style={styles.modalBadgeTitle}>
                    {selectedAchievement.title}
                  </Text>
                  <Text style={styles.modalBadgeDesc}>
                    {selectedAchievement.description}
                  </Text>
                </>
              )}
              <TouchableOpacity
                style={styles.modalShareBtn}
                onPress={handleShare}>
                <Text style={styles.modalShareText}>Share</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.modalCloseBtn}>
                <Text style={{ color: '#fff', fontSize: 18 }}>✕</Text>
              </TouchableOpacity>
            </View>
          </ImageBackground>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ====== LAYOUT ======
  container: { flex: 1, backgroundColor: '#1B182B' },

  // ====== HEADER ======
  profileTitle: {
    alignItems: 'center',
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#2A273E',
  },
  avatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 4,
    borderColor: '#fff',
    marginBottom: 10,
  },
  name: { color: '#fff', fontWeight: 'bold', fontSize: 20 },
  email: { color: '#aaa', fontSize: 14, marginTop: 2 },

  // ====== SECTION HEADERS ======
  sectionTitleWrapper: {
    backgroundColor: '#2A273E',
    marginTop: 10,
    marginHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 10,
    alignItems: 'center',
  },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },

  // ====== SOCIAL BUTTONS ======
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 10,
    paddingHorizontal: 16,
  },
  socialBtn: {
    flex: 1,
    backgroundColor: '#6C63FF',
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 10,
    alignItems: 'center',
  },
  socialBtnText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },

  // ====== ACHIEVEMENTS LIST ======
  achievementList: { paddingHorizontal: 16, paddingBottom: 16 },

  // ====== MODAL OVERLAY ======
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' },
  modalBackgroundImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dimmerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 0,
  },

  // ====== MODAL CONTENT ======
  modalBox: {
    zIndex: 1,
    backgroundColor: '#2A273E',
    padding: 20,
    borderRadius: 20,
    width: '80%',
    alignItems: 'center',
    position: 'relative',
  },
  modalTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 22,
    marginBottom: 5,
    marginTop: 10,
  },
  modalBadge: {
    width: 130,
    height: 130,
    marginVertical: 10,
    resizeMode: 'contain',
  },
  modalBadgeTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
    marginBottom: 5,
  },
  modalBadgeDesc: {
    color: '#aaa',
    fontSize: 18,
    fontStyle: 'italic',
    marginBottom: 40,
  },
  modalShareBtn: {
    backgroundColor: '#6C63FF',
    paddingVertical: 10,
    paddingHorizontal: 25,
    borderRadius: 10,
    width: '100%',
    alignItems: 'center',
  },
  modalShareText: { color: '#fff', fontWeight: 'bold' },
  modalCloseBtn: { position: 'absolute', top: 10, right: 15 },
});
