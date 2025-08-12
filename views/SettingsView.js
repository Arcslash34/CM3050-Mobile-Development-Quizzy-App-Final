// views/SettingsView.js (Presentation Layer)
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  ScrollView,
  Image,
  Animated,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AvatarModal from '../components/AvatarModal';

/**
 * SettingsView
 * 
 * Displays app settings for:
 *  - Profile info + avatar editing
 *  - Game preferences (notifications, sound, vibration)
 *  - Language & Region detection
 *  - Account management (change password, logout)
 * 
 * @param {bool}    notificationsEnabled  Whether notifications are on
 * @param {bool}    soundEnabled          Whether sound effects are on
 * @param {bool}    vibrationEnabled      Whether vibration is on
 * @param {func}    onToggleNotifications Toggle notifications setting
 * @param {func}    onToggleSound         Toggle sound setting
 * @param {func}    onToggleVibration     Toggle vibration setting
 * @param {string}  avatarUrl             Current profile avatar URL
 * @param {bool}    modalVisible          Avatar modal visibility
 * @param {func}    setModalVisible       Toggle avatar modal
 * @param {bool}    avatarReady           Whether avatar is fully loaded
 * @param {func}    setAvatarReady        Update avatar loaded state
 * @param {string}  username              User's display name
 * @param {string}  email                 User's email
 * @param {string}  region                User's detected region
 * @param {bool}    loadingRegion         Whether region detection is loading
 * @param {Animated.Value} spinAnim       Animated rotation value for refresh
 * @param {func}    onDetectRegion        Callback to detect region
 * @param {object}  navigation            Navigation object
 * @param {func}    handleLogout          Callback to log out user
 */
export default function SettingsView({
  notificationsEnabled,
  soundEnabled,
  vibrationEnabled,
  onToggleNotifications,
  onToggleSound,
  onToggleVibration,
  avatarUrl,
  modalVisible,
  setModalVisible,
  avatarReady,
  setAvatarReady,
  username,
  email,
  region,
  loadingRegion,
  spinAnim,
  onDetectRegion,
  navigation,
  handleLogout,
}) {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* ===== Page Header ===== */}
        <Text style={styles.header}>Settings</Text>

        {/* ===== Profile Section ===== */}
        <View style={styles.profileBox}>
          {/* Avatar */}
          <TouchableOpacity
            onPress={() => {
              setAvatarReady(false);
              setModalVisible(true);
            }}
          >
            <Image
              source={avatarUrl ? { uri: avatarUrl } : require('../assets/images/profile.png')}
              style={styles.avatar}
            />
          </TouchableOpacity>

          {/* Username + Email + Edit link */}
          <TouchableOpacity
            onPress={() => navigation.navigate('EditProfile')}
            style={{ marginLeft: 12, flex: 1, flexDirection: 'row', alignItems: 'center' }}
          >
            <View>
              <Text style={styles.profileName}>{username || 'your_username'}</Text>
              <Text style={styles.profileEmail}>{email || 'your@email.com'}</Text>
            </View>
            <MaterialIcons name="chevron-right" size={24} color="#ccc" style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        </View>

        {/* ===== Game Settings ===== */}
        <Text style={styles.sectionTitle}>Game Settings</Text>

        <View style={styles.itemBox}>
          <View style={styles.row}>
            <Ionicons name="notifications" size={20} color="#fff" />
            <Text style={styles.label}>Notifications</Text>
            <Switch
              value={notificationsEnabled}
              onValueChange={onToggleNotifications}
              style={styles.switch}
            />
          </View>
        </View>

        <View style={styles.itemBox}>
          <View style={styles.row}>
            <Ionicons name="volume-high" size={20} color="#fff" />
            <Text style={styles.label}>Sound</Text>
            <Switch
              value={soundEnabled}
              onValueChange={onToggleSound}
              style={styles.switch}
            />
          </View>
        </View>

        <View style={styles.itemBox}>
          <View style={styles.row}>
            <Ionicons name="phone-portrait" size={20} color="#fff" />
            <Text style={styles.label}>Vibration</Text>
            <Switch
              value={vibrationEnabled}
              onValueChange={onToggleVibration}
              style={styles.switch}
            />
          </View>
        </View>

        {/* ===== Language & Region ===== */}
        <Text style={styles.sectionTitle}>Language & Region</Text>

        {/* Language placeholder */}
        <TouchableOpacity
          style={styles.itemBox2}
          onPress={() => Alert.alert('Coming Soon', 'Language selection will be available soon!')}
        >
          <View style={styles.row}>
            <Ionicons name="language" size={20} color="#fff" />
            <Text style={styles.label}>Language</Text>
            <MaterialIcons name="chevron-right" size={24} color="#ccc" style={styles.arrow} />
          </View>
        </TouchableOpacity>

        {/* Region detection */}
        <TouchableOpacity
          style={[styles.itemBox2, loadingRegion && { opacity: 0.6 }]}
          onPress={loadingRegion ? null : onDetectRegion}
          activeOpacity={loadingRegion ? 1 : 0.7}
        >
          <View style={styles.row}>
            <Ionicons name="earth" size={20} color="#fff" />
            <Text style={styles.label}>Region: {region || 'Tap to detect'}</Text>
            {loadingRegion ? (
              <ActivityIndicator size="small" color="#ccc" style={styles.arrow} />
            ) : (
              <Animated.View
                style={[
                  styles.arrow,
                  {
                    transform: [
                      {
                        rotate: spinAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '360deg'],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <MaterialIcons name="refresh" size={24} color="#ccc" />
              </Animated.View>
            )}
          </View>
        </TouchableOpacity>

        {/* ===== Account Settings ===== */}
        <Text style={styles.sectionTitle}>Account Settings</Text>

        <TouchableOpacity
          style={styles.itemBox2}
          onPress={() => navigation.navigate('ChangePassword')}
        >
          <View style={styles.row}>
            <Ionicons name="key" size={20} color="#fff" />
            <Text style={styles.label}>Change Password</Text>
            <MaterialIcons name="chevron-right" size={24} color="#ccc" style={styles.arrow} />
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.itemBox2}
          onPress={handleLogout}
        >
          <View style={styles.row}>
            <Ionicons name="log-out" size={20} color="#fff" />
            <Text style={styles.label}>Logout</Text>
            <MaterialIcons name="chevron-right" size={24} color="#ccc" style={styles.arrow} />
          </View>
        </TouchableOpacity>
      </ScrollView>

      {/* ===== Avatar Modal ===== */}
      <AvatarModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        avatarUrl={avatarUrl}
        avatarReady={avatarReady}
        setAvatarReady={setAvatarReady}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1B1B1B',
    padding: 16,
  },
  scrollContent: {
    paddingBottom: 20,
  },

  // ===== Header =====
  header: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    alignSelf: 'center',
    marginBottom: 16,
  },

  // ===== Profile =====
  profileBox: {
    backgroundColor: '#2A273E',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 15,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    resizeMode: 'cover',
  },
  profileName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  profileEmail: {
    color: '#ccc',
    fontSize: 13,
  },

  // ===== Sections =====
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 10,
  },

  // ===== Settings Items =====
  itemBox: {
    backgroundColor: '#2A273E',
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  itemBox2: {
    backgroundColor: '#2A273E',
    borderRadius: 12,
    paddingHorizontal: 14,
    marginBottom: 10,
    paddingVertical: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  switch: {
    marginLeft: 'auto',
  },
  arrow: {
    marginLeft: 'auto',
  },
});
