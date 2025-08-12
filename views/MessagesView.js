// views/MessagesView.js (Presentation Layer)
import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Image,
  TouchableWithoutFeedback
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AvatarModal from '../components/AvatarModal';

export default function MessagesView({
  navigation,                // Navigation object
  myId,                       // Current logged-in user ID
  avatarModalVisible,         // State for showing avatar modal
  setAvatarModalVisible,      // Setter for avatar modal visibility
  selectedAvatarUrl,          // URL of the selected avatar
  selectedFriendData,         // Friend data for dropdown actions
  dropdownPosition,           // Position of dropdown menu
  itemRefs,                   // References for each friend row
  acceptedFriends,            // List of accepted friends
  blockedFriends,             // List of blocked friends
  refreshing,                 // Pull-to-refresh loading state
  showBlocked,                // Whether blocked users are visible
  setShowBlocked,             // Setter for blocked users visibility
  handleAvatarPress,          // Handler for tapping an avatar
  handleDropdown,              // Handler for opening dropdown
  handleDeleteMessages,        // Handler for deleting chat history
  handleUnfriend,              // Handler for unfriending
  handleBlock,                 // Handler for blocking
  handleUnblock,               // Handler for unblocking
  setSelectedFriendData,       // Setter for selected friend dropdown data
  fetchFriends                 // Function to refresh friends list
}) {
  // ====== FRIEND ITEM RENDERER ======
  const renderFriendItem = (item) => (
    <View ref={(ref) => (itemRefs.current[item.id] = ref)} collapsable={false}>
      <TouchableOpacity
        onPress={() => {
          if (item.status === 'accepted') {
            navigation.navigate('ChatContainer', {
              userId: myId,
              friendId: item.id,
              friendName: item.username
            });
          }
        }}
        onLongPress={() => handleDropdown(item, itemRefs.current[item.id])}
        activeOpacity={1}
      >
        <View style={styles.friendItem}>
          <TouchableOpacity onPress={() => handleAvatarPress(item.avatar_url)}>
            <Image
              source={item.avatar_url ? { uri: item.avatar_url } : require('../assets/images/profile.png')}
              style={styles.avatar}
            />
          </TouchableOpacity>
          <View style={styles.chatBox}>
            <Text style={styles.friendName}>
              {item.username} {item.status === 'blocked' ? '🚫' : ''}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );

  // ====== MAIN RENDER ======
  return (
    <SafeAreaView style={styles.container}>
      
      {/* ====== HEADER ====== */}
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerText}>My Friends</Text>
        <View style={styles.placeholder} />
      </View>

      {/* ====== FRIEND LIST & BLOCKED LIST ====== */}
      <TouchableWithoutFeedback onPress={() => setSelectedFriendData(null)}>
        <View style={{ flex: 1 }}>
          
          {/* Accepted Friends List */}
          <FlatList
            data={acceptedFriends}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => renderFriendItem(item)}
            ListHeaderComponent={<Text style={styles.sectionTitle}>Friends</Text>}
            ListEmptyComponent={
              <Text style={styles.emptyText}>
                You haven’t added any friends yet. Start connecting! 🤝
              </Text>
            }
            refreshing={refreshing}
            onRefresh={fetchFriends}
          />

          {/* Toggle Blocked Users */}
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={() => setShowBlocked(!showBlocked)}
          >
            <Text style={styles.toggleText}>
              {showBlocked ? 'Hide Blocked Users' : 'Show Blocked Users'}
            </Text>
          </TouchableOpacity>

          {/* Blocked Friends List */}
          {showBlocked && (
            <FlatList
              data={blockedFriends}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => renderFriendItem(item)}
              ListHeaderComponent={<Text style={styles.sectionTitle}>Blocked Users</Text>}
              ListEmptyComponent={
                <Text style={styles.emptyText}>You haven't blocked anyone.</Text>
              }
              refreshing={refreshing}
              onRefresh={fetchFriends}
            />
          )}
        </View>
      </TouchableWithoutFeedback>

      {/* ====== DROPDOWN MENU ====== */}
      {selectedFriendData && (
        <View
          style={[styles.dropdown, { top: dropdownPosition.top, left: dropdownPosition.left }]}
        >
          {selectedFriendData.status === 'accepted' ? (
            <>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => handleDeleteMessages(selectedFriendData.id)}
              >
                <Text style={styles.dropdownText}>🗑️ Delete Chat</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => handleUnfriend(selectedFriendData.id)}
              >
                <Text style={styles.dropdownText}>❌ Unfriend</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => handleBlock(selectedFriendData.id)}
              >
                <Text style={[styles.dropdownText, { color: '#FF4C4C' }]}>🚫 Block</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={styles.dropdownItem}
              onPress={() => handleUnblock(selectedFriendData.id)}
            >
              <Text style={[styles.dropdownText, { color: 'lightgreen' }]}>✅ Unblock</Text>
            </TouchableOpacity>
          )}
        </View>
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
  // ====== LAYOUT ======
  container: { flex: 1, backgroundColor: '#1B182B', padding: 20 },
  
  // ====== HEADER ======
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: { padding: 5, marginBottom: 10 },
  headerText: {
    flex: 1,
    textAlign: 'center',
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  placeholder: { width: 28 },

  // ====== FRIEND ITEM ======
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#2A273E',
    marginBottom: 10,
    borderRadius: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
    resizeMode: 'cover',
  },
  chatBox: { flex: 1 },
  friendName: { color: '#fff', fontSize: 16 },

  // ====== DROPDOWN ======
  dropdown: {
    position: 'absolute',
    backgroundColor: '#2A273E',
    borderRadius: 8,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    zIndex: 1000,
    paddingVertical: 4,
    minWidth: 150,
  },
  dropdownItem: { paddingVertical: 8, paddingHorizontal: 12 },
  dropdownText: { color: '#fff', fontSize: 14 },

  // ====== LIST SECTION ======
  sectionTitle: {
    color: '#aaa',
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 6,
  },
  emptyText: { color: '#888', fontSize: 14, textAlign: 'center', marginTop: 12 },

  // ====== TOGGLE BLOCKED USERS ======
  toggleButton: {
    backgroundColor: '#2A273E',
    paddingVertical: 10,
    borderRadius: 10,
    marginVertical: 10,
    alignItems: 'center',
  },
  toggleText: { color: '#6C63FF', fontWeight: 'bold', fontSize: 14 },
});
