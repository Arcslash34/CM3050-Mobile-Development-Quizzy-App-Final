// containers/FriendsContainer.js (Logic Layer)
import React, { useEffect, useState } from 'react';
import FriendsView from '../views/FriendsView';
import { supabase } from '../supabase';
import { Alert } from 'react-native';

export default function FriendsContainer({ navigation }) {
  // ----------------------------
  // State for users & friendships
  // ----------------------------
  const [users, setUsers] = useState([]);                  // All other users (excluding me)
  const [myFriends, setMyFriends] = useState([]);          // Friends with 'accepted' status
  const [receivedRequests, setReceivedRequests] = useState([]); // Incoming friend requests
  const [sentRequests, setSentRequests] = useState([]);    // Requests I’ve sent
  const [search, setSearch] = useState('');                // Search text for filtering users
  const [myId, setMyId] = useState(null);                  // Current logged-in user ID
  const [loading, setLoading] = useState(true);            // Loading state for fetch
  const [avatarModalVisible, setAvatarModalVisible] = useState(false); // Show avatar in modal
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState(null);    // Selected avatar URL

  // ----------------------------
  // Fetch all necessary data
  // ----------------------------
  const fetchAllData = async () => {
    // Get logged-in user ID
    const { data: sessionData } = await supabase.auth.getSession();
    const id = sessionData?.session?.user?.id;
    setMyId(id);

    // Fetch all users except me
    const { data: usersData } = await supabase
      .from('profiles')
      .select('id, username, avatar_url')
      .neq('id', id);
    setUsers(usersData || []);

    // Fetch accepted friends
    const { data: friendsData } = await supabase
      .from('friends')
      .select('friend_id, status')
      .eq('user_id', id)
      .eq('status', 'accepted');
    setMyFriends(friendsData || []);

    // Fetch pending incoming requests
    const { data: incoming } = await supabase
      .from('friends')
      .select('user_id, profiles!friends_user_id_fkey(username, avatar_url)')
      .eq('friend_id', id)
      .eq('status', 'pending');
    setReceivedRequests(incoming || []);

    // Fetch pending requests I sent
    const { data: sent } = await supabase
      .from('friends')
      .select('friend_id, profiles!friend_id(username, avatar_url)')
      .eq('user_id', id)
      .eq('status', 'pending');
    setSentRequests(sent || []);

    setLoading(false);
  };

  // ----------------------------
  // Run fetch on mount
  // ----------------------------
  useEffect(() => {
    fetchAllData();
  }, []);

  // ----------------------------
  // Send a new friend request
  // ----------------------------
  const sendRequest = async (friendId) => {
    const { error } = await supabase.from('friends').insert([
      { user_id: myId, friend_id: friendId, status: 'pending' },
    ]);
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      Alert.alert('Friend Request Sent', 'Your friend request has been sent successfully! 🎉');
      await fetchAllData();
    }
  };

  // ----------------------------
  // Accept an incoming request
  // ----------------------------
  const acceptRequest = async (friendId) => {
    // Update sender’s record to 'accepted'
    await supabase
      .from('friends')
      .update({ status: 'accepted' })
      .eq('user_id', friendId)
      .eq('friend_id', myId);

    // Create reciprocal record for me
    await supabase.from('friends').insert([
      { user_id: myId, friend_id: friendId, status: 'accepted' },
    ]);

    Alert.alert('Success', 'You are now friends with this user! 🎉');
    await fetchAllData();
  };

  // ----------------------------
  // Handle avatar press → open modal
  // ----------------------------
  const handleAvatarPress = (url) => {
    setSelectedAvatarUrl(url);
    setAvatarModalVisible(true);
  };

  // ----------------------------
  // Render friends view
  // ----------------------------
  return (
    <FriendsView
      users={users}
      myFriends={myFriends}
      receivedRequests={receivedRequests}
      sentRequests={sentRequests}
      search={search}
      setSearch={setSearch}
      sendRequest={sendRequest}
      acceptRequest={acceptRequest}
      handleAvatarPress={handleAvatarPress}
      avatarModalVisible={avatarModalVisible}
      selectedAvatarUrl={selectedAvatarUrl}
      setAvatarModalVisible={setAvatarModalVisible}
      loading={loading}
      myId={myId}
      navigation={navigation}
    />
  );
}
