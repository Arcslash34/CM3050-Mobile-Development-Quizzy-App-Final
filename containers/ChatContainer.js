// containers/ChatContainer.js (Logic Layer)
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { supabase } from '../supabase';
import ChatView from '../views/ChatView';

export default function ChatContainer({ route, navigation }) {
  // Extract parameters passed from navigation
  const { userId, friendId, friendName } = route.params;

  // Local state
  const [messages, setMessages] = useState([]); // Stores all chat messages
  const [input, setInput] = useState(''); // Input text for sending new message
  const [loading, setLoading] = useState(true); // Loading state for initial fetch
  const flatListRef = useRef(); // Ref to scroll chat list to bottom

  // Memoized sorted messages (chronological order)
  const sortedMessages = useMemo(() => [...messages].sort((a, b) =>
    new Date(a.timestamp) - new Date(b.timestamp)
  ), [messages]);

  // Fetch messages between the current user and friend
  const fetchMessages = useCallback(async () => {
    const { data } = await supabase
      .from('messages')
      .select('*')
      // Fetch both sent and received messages between two users
      .or(`and(sender_id.eq.${userId},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${userId})`)
      .order('timestamp', { ascending: true });

    if (data) {
      setMessages(data);
      // Auto-scroll to bottom after fetching
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: false });
      }, 100);
      setLoading(false);
    }
  }, [userId, friendId]);

  // Initial fetch + real-time subscription
  useEffect(() => {
    fetchMessages();

    // Subscribe to real-time changes in "messages" table
    const channel = supabase
      .channel('messages-chat')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, (payload) => {
        const msg = payload.new;
        const isRelevant =
          (msg.sender_id === userId && msg.receiver_id === friendId) ||
          (msg.sender_id === friendId && msg.receiver_id === userId);

        // Handle new messages
        if (payload.eventType === 'INSERT' && isRelevant) {
          setMessages((prev) => prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]);
        }
        // Handle deleted messages
        else if (payload.eventType === 'DELETE') {
          setMessages((prev) => prev.filter((m) => m.id !== payload.old.id));
        }
      })
      .subscribe();

    // Cleanup subscription when component unmounts
    return () => supabase.removeChannel(channel);
  }, [userId, friendId, fetchMessages]);

  // Send a new message
  const sendMessage = async () => {
    if (!input.trim()) return; // Ignore empty messages
    const { error } = await supabase.from('messages').insert([
      { sender_id: userId, receiver_id: friendId, content: input.trim() },
    ]);
    if (!error) setInput(''); // Clear input if successful
  };

  // Delete a message (only if sender is the current user)
  const handleDeleteMessage = async (id) => {
    const { error } = await supabase.from('messages').delete().eq('id', id).eq('sender_id', userId);
    if (!error) setMessages((prev) => prev.filter((msg) => msg.id !== id));
  };

  // Pass data and handlers to presentation layer
  return (
    <ChatView
      messages={sortedMessages}
      loading={loading}
      input={input}
      setInput={setInput}
      sendMessage={sendMessage}
      handleDeleteMessage={handleDeleteMessage}
      navigation={navigation}
      friendName={friendName}
      flatListRef={flatListRef}
      userId={userId}
    />
  );
}
