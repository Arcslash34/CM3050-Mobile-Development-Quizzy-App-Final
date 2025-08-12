// views/FriendsView.js (Presentation Layer)
import React from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AvatarModal from '../components/AvatarModal';
import { Ionicons } from '@expo/vector-icons';

export default function FriendsView({
  users,                   // All users fetched from DB
  myFriends,               // List of current friends
  receivedRequests,        // Friend requests received
  sentRequests,            // Friend requests sent but not accepted yet
  search,                  // Current search query
  setSearch,               // Function to update search query
  sendRequest,             // Function to send friend request
  acceptRequest,           // Function to accept friend request
  handleAvatarPress,       // Function to show avatar modal
  avatarModalVisible,      // Boolean to control avatar modal visibility
  selectedAvatarUrl,       // URL of avatar in modal
  setAvatarModalVisible,   // Function to toggle avatar modal
  loading,                 // Loading state for friend data
  myId,                    // Current logged-in user ID
  navigation,              // Navigation object
}) {
  // ====== FILTER USERS FOR "ALL USERS" LIST ======
  const filteredUsers = users
    .filter((u) => u.username.toLowerCase().includes(search.toLowerCase()))
    .filter((u) => !myFriends.find((f) => f.friend_id === u.id))
    .filter((u) => !sentRequests.find((r) => r.friend_id === u.id));

  // ====== HANDLERS ======
  const handleSendRequest = async (id) => {
    await sendRequest(id);
  };

  const handleAccept = async (id) => {
    await acceptRequest(id);
    Alert.alert('Success', 'You are now friends with this user! 🎉');
  };

  // ====== LOADING STATE ======
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        {/* HEADER */}
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={28} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerText}>Find Friends</Text>
          <View style={styles.placeholder} />
        </View>

        {/* LOADING MESSAGE */}
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>

      {/* ====== HEADER ====== */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerText}>Find Friends</Text>
        <View style={styles.placeholder} />
      </View>

      {/* ====== SEARCH BAR ====== */}
      <TextInput
        placeholder="Search username..."
        value={search}
        onChangeText={setSearch}
        style={styles.input}
        placeholderTextColor="#aaa"
      />

      {/* ====== RECEIVED FRIEND REQUESTS ====== */}
      {receivedRequests.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Friend Requests</Text>
          <FlatList
            data={receivedRequests}
            keyExtractor={(item) => item.user_id}
            renderItem={({ item }) => (
              <View style={styles.userCard}>
                {/* Avatar */}
                <TouchableOpacity
                  onPress={() => handleAvatarPress(item.profiles.avatar_url)}
                  style={styles.avatarBox}
                >
                  <Image
                    source={
                      item.profiles.avatar_url
                        ? { uri: item.profiles.avatar_url }
                        : require('../assets/images/profile.png')
                    }
                    style={styles.avatar}
                  />
                </TouchableOpacity>

                {/* Username */}
                <Text style={styles.username}>{item.profiles.username}</Text>

                {/* Accept Button */}
                <TouchableOpacity
                  style={[styles.button, styles.acceptButton]}
                  onPress={() => handleAccept(item.user_id)}
                >
                  <Text style={styles.buttonText}>Accept</Text>
                </TouchableOpacity>
              </View>
            )}
          />
        </>
      )}

      {/* ====== SENT FRIEND REQUESTS ====== */}
      {sentRequests.length > 0 && (
        <>
          <Text style={styles.sectionTitle}>Pending Sent Requests</Text>
          <FlatList
            data={sentRequests}
            keyExtractor={(item) => item.friend_id}
            renderItem={({ item }) => (
              <View style={styles.userCard}>
                {/* Avatar */}
                <TouchableOpacity
                  onPress={() => handleAvatarPress(item.profiles.avatar_url)}
                  style={styles.avatarBox}
                >
                  <Image
                    source={
                      item.profiles.avatar_url
                        ? { uri: item.profiles.avatar_url }
                        : require('../assets/images/profile.png')
                    }
                    style={styles.avatar}
                  />
                </TouchableOpacity>

                {/* Username */}
                <Text style={styles.username}>{item.profiles.username}</Text>

                {/* Pending Label */}
                <Text style={[styles.buttonText, { color: '#ccc' }]}>Pending</Text>
              </View>
            )}
          />
        </>
      )}

      {/* ====== ALL USERS LIST ====== */}
      <Text style={styles.sectionTitle}>All Users</Text>
      {filteredUsers.length === 0 ? (
        <View style={styles.noUsersBox}>
          <Text style={styles.noUsersText}>No users found to add as friends.</Text>
          {receivedRequests.length === 0 && (
            <Text style={styles.noUsersTextSub}>
              You're all caught up! No pending requests either.
            </Text>
          )}
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <View style={styles.userCard}>
              {/* Avatar */}
              <TouchableOpacity
                onPress={() => handleAvatarPress(item.avatar_url)}
                style={styles.avatarBox}
              >
                <Image
                  source={
                    item.avatar_url
                      ? { uri: item.avatar_url }
                      : require('../assets/images/profile.png')
                  }
                  style={styles.avatar}
                />
              </TouchableOpacity>

              {/* Username */}
              <Text style={styles.username}>{item.username}</Text>

              {/* Add Friend Button */}
              <TouchableOpacity style={styles.button} onPress={() => handleSendRequest(item.id)}>
                <Text style={styles.buttonText}>Add</Text>
              </TouchableOpacity>
            </View>
          )}
        />
      )}

      {/* ====== AVATAR MODAL ====== */}
      <AvatarModal
        visible={avatarModalVisible}
        onClose={() => setAvatarModalVisible(false)}
        avatarUrl={selectedAvatarUrl}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1B182B', padding: 20 },
  backButton: { marginBottom: 10 },
  input: {
    backgroundColor: '#2A273E',
    color: '#fff',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 20,
    marginBottom: 10,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomColor: '#444',
    borderBottomWidth: 1,
  },
  avatarBox: {
    marginRight: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    resizeMode: 'cover',
  },
  username: { color: '#fff', fontSize: 16, flex: 1 },
  button: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  buttonText: { color: '#fff' },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#aaa',
    fontSize: 16,
  },
  noUsersText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 10,
  },
  noUsersTextSub: {
    color: '#666',
    fontSize: 13,
    marginTop: 4,
    textAlign: 'center',
  },
  noUsersBox: {
    marginTop: 20,
    alignItems: 'center',
  },
  acceptButton: {
    backgroundColor: 'green',
  },
});
