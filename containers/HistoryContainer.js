// containers/HistoryContainer.js (Logic Layer)
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { useNavigation } from '@react-navigation/native';
import { getCategoryImageById } from '../utils/categoryUtils';
import HistoryView from '../views/HistoryView';

export default function HistoryContainer() {
  // ----------------------------
  // State management
  // ----------------------------
  const [history, setHistory] = useState([]);        // Full quiz history from DB
  const [searchText, setSearchText] = useState('');  // Current search filter text
  const [showSearch, setShowSearch] = useState(false); // Toggle search bar
  const navigation = useNavigation();               // Navigation hook

  // ----------------------------
  // Fetch quiz history for current user
  // ----------------------------
  const fetchHistory = async () => {
    // Get the logged-in user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    // If no user or error, exit
    if (userError || !user) return;

    // Fetch history records from Supabase
    const { data, error } = await supabase
      .from('quiz_history')
      .select('*')
      .eq('user_id', user.id) // Only current user's history
      .order('time_taken', { ascending: false }); // Latest first

    if (!error && data) setHistory(data);
  };

  // ----------------------------
  // On mount → fetch history
  // ----------------------------
  useEffect(() => {
    fetchHistory();
  }, []);

  // ----------------------------
  // Delete a history entry
  // ----------------------------
  const handleDelete = async (id) => {
    const { error } = await supabase
      .from('quiz_history')
      .delete()
      .eq('id', id);

    if (!error) {
      // Remove from local state so UI updates immediately
      setHistory((prev) => prev.filter((item) => item.id !== id));
    }
  };

  // ----------------------------
  // Apply search filter to history
  // ----------------------------
  const filteredHistory = history.filter((item) =>
    item.quiz_title.toLowerCase().includes(searchText.toLowerCase())
  );

  // ----------------------------
  // Render history screen
  // ----------------------------
  return (
    <HistoryView
      history={filteredHistory}
      handleDelete={handleDelete}
      navigation={navigation}
      searchText={searchText}
      setSearchText={setSearchText}
      showSearch={showSearch}
      setShowSearch={setShowSearch}
      getCategoryImageById={getCategoryImageById} // For showing category images
    />
  );
}
