// containers/MessagesContainer.js (Logic Layer)
import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabase';
import MessagesView from '../views/MessagesView';

export default function MessagesContainer({ navigation }) {
  // ----------------------------
  // State: User, friend lists, UI controls
  // ----------------------------
  const [myId, setMyId] = useState(null);
  const [avatarModalVisible, setAvatarModalVisible] = useState(false);
  const [selectedAvatarUrl, setSelectedAvatarUrl] = useState(null);
  const [selectedFriendData, setSelectedFriendData] = useState(null);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
  const itemRefs = useRef({}); // Track list item refs for dropdown positioning
  const [acceptedFriends, setAcceptedFriends] = useState([]);
  const [blockedFriends, setBlockedFriends] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [showBlocked, setShowBlocked] = useState(false);

  // ----------------------------
  // Fetch friends & categorize into accepted/blocked
  // ----------------------------
  const fetchFriends = async () => {
    setRefreshing(true);

    // Get current user ID
    const { data: session } = await supabase.auth.getSession();
    const id = session?.session?.user?.id;
    setMyId(id);

    // Get all friend relations for this user
    const { data } = await supabase
      .from('friends')
      .select(`friend_id, status, profiles:friends_friend_id_fkey (id, username, avatar_url)`)
      .eq('user_id', id);

    // Categorize into accepted & blocked lists
    if (data) {
      const accepted = data
        .filter(f => f.status === 'accepted')
        .map(f => ({ ...f.profiles, status: f.status }));

      const blocked = data
        .filter(f => f.status === 'blocked')
        .map(f => ({ ...f.profiles, status: f.status }));

      setAcceptedFriends(accepted);
      setBlockedFriends(blocked);
    }

    setRefreshing(false);
  };

  // ----------------------------
  // Avatar preview modal
  // ----------------------------
  const handleAvatarPress = (url) => {
    setSelectedAvatarUrl(url);
    setAvatarModalVisible(true);
  };

  // ----------------------------
  // Dropdown menu positioning
  // ----------------------------
  const handleDropdown = (friend, ref) => {
    if (ref && ref.measure) {
      ref.measure((fx, fy, width, height, px, py) => {
        setDropdownPosition({ top: py + height + 4, left: px + width - 150 });
        setSelectedFriendData(friend);
      });
    }
  };

  // ----------------------------
  // Friend actions: block, unblock, unfriend
  // ----------------------------
  const handleBlock = async (friendId) => {
    await supabase
      .from('friends')
      .update({ status: 'blocked' })
      .eq('user_id', myId)
      .eq('friend_id', friendId);
    setSelectedFriendData(null);
    await fetchFriends();
  };

  const handleUnblock = async (friendId) => {
    await supabase
      .from('friends')
      .update({ status: 'accepted' })
      .eq('user_id', myId)
      .eq('friend_id', friendId);
    setSelectedFriendData(null);
    await fetchFriends();
  };

  const handleUnfriend = async (friendId) => {
    await supabase
      .from('friends')
      .delete()
      .or(`and(user_id.eq.${myId},friend_id.eq.${friendId}),and(user_id.eq.${friendId},friend_id.eq.${myId})`);
    setSelectedFriendData(null);
  };

  // ----------------------------
  // Message actions: delete chat history
  // ----------------------------
  const handleDeleteMessages = async (friendId) => {
    await supabase
      .from('messages')
      .delete()
      .or(`and(sender_id.eq.${myId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${myId})`);
    setSelectedFriendData(null);
  };

  // ----------------------------
  // Load friend data on mount
  // ----------------------------
  useEffect(() => {
    fetchFriends();
  }, []);

  // ----------------------------
  // Render Messages screen
  // ----------------------------
  return (
    <MessagesView
      navigation={navigation}
      myId={myId}
      avatarModalVisible={avatarModalVisible}
      setAvatarModalVisible={setAvatarModalVisible}
      selectedAvatarUrl={selectedAvatarUrl}
      selectedFriendData={selectedFriendData}
      dropdownPosition={dropdownPosition}
      itemRefs={itemRefs}
      acceptedFriends={acceptedFriends}
      blockedFriends={blockedFriends}
      refreshing={refreshing}
      showBlocked={showBlocked}
      setShowBlocked={setShowBlocked}
      handleAvatarPress={handleAvatarPress}
      handleDropdown={handleDropdown}
      handleDeleteMessages={handleDeleteMessages}
      handleUnfriend={handleUnfriend}
      handleBlock={handleBlock}
      handleUnblock={handleUnblock}
      setSelectedFriendData={setSelectedFriendData}
      fetchFriends={fetchFriends}
    />
  );
}
