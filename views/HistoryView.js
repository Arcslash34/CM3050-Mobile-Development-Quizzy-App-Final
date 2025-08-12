// views/HistoryView.js (Presentation Layer)
import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Image,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SwipeListView } from 'react-native-swipe-list-view';

// ====== ICON & IMAGE MAPPINGS ======
const images = {
  easy: require('../assets/images/easy.png'),
  medium: require('../assets/images/medium.png'),
  hard: require('../assets/images/hard.png'),
  random: require('../assets/images/random.png'),
  timer: require('../assets/images/timer.png'),
  xp: require('../assets/images/xp.png'),
  score: require('../assets/images/score.png'),
  date: require('../assets/images/date.png'),
  time: require('../assets/images/time.png'),
};

export default function HistoryView({
  history,               // Array of quiz history objects
  handleDelete,          // Function to delete a history record
  navigation,            // Navigation object
  searchText,            // Search query text
  setSearchText,         // Setter for search query
  showSearch,            // Boolean toggle for search bar
  setShowSearch,         // Setter for search toggle
  getCategoryImageById,  // Helper to get category image
}) {
  // ====== FORMAT TIME TAKEN ======
  const formatTimeTaken = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} min ${secs} s`;
  };

  // ====== VISIBLE LIST ITEM ======
  const renderVisibleItem = ({ item }) => {
    const difficultyIcon = images[item.difficulty.toLowerCase()];
    const quizImage = getCategoryImageById(item.category_id);

    return (
      <View style={styles.card}>
        <Pressable
          android_ripple={{ color: 'transparent' }}
          onPress={() =>
            navigation.navigate('ReviewContainer', {
              reviewData: item.review_data,
              quizTitle: item.quiz_title,
              score: item.score,
              xp: item.xp,
            })
          }
          style={{ flexDirection: 'row', alignItems: 'center' }}
        >
          {/* Category Image */}
          <Image source={quizImage} style={styles.image} />

          {/* Quiz Metadata */}
          <View style={styles.content}>
            {/* Title */}
            <Text style={[styles.title, { marginBottom: 8 }]}>
              {item.quiz_title}
            </Text>

            {/* Difficulty & Time Taken */}
            <View style={[styles.row, { marginBottom: 8 }]}>
              <View style={styles.itemRow}>
                <Image source={difficultyIcon} style={styles.icon} />
                <Text style={styles.meta}>{item.difficulty}</Text>
              </View>
              <View style={styles.itemRow}>
                <Image source={images.timer} style={styles.icon} />
                <Text style={styles.meta}>
                  {formatTimeTaken(item.time_taken_seconds)}
                </Text>
              </View>
            </View>

            {/* XP & Score */}
            <View style={styles.row}>
              <View style={styles.itemRow}>
                <Image source={images.xp} style={styles.icon} />
                <Text style={[styles.meta, styles.green]}>+{item.xp} XP</Text>
              </View>
              <View style={styles.itemRow}>
                <Image source={images.score} style={styles.icon} />
                <Text style={[styles.meta, styles.green]}>{item.score}%</Text>
              </View>
            </View>
          </View>
        </Pressable>
      </View>
    );
  };

  // ====== HIDDEN DELETE BUTTON (SWIPE ACTION) ======
  const renderHiddenItem = ({ item }) => (
    <View style={styles.rowBack}>
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => handleDelete(item.id)}
      >
        <Ionicons name="trash" size={24} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ====== HEADER ====== */}
      <View style={styles.header}>
        {showSearch ? (
          // Search Bar
          <TextInput
            style={styles.searchInput}
            placeholder="Search quizzes..."
            placeholderTextColor="#aaa"
            value={searchText}
            onChangeText={setSearchText}
            autoFocus
          />
        ) : (
          // Title
          <>
            <View style={{ width: 24 }} />
            <Text style={styles.headerTitle}>Quiz History</Text>
          </>
        )}

        {/* Search Toggle / Close */}
        <TouchableOpacity
          onPress={() => {
            if (showSearch) setSearchText('');
            setShowSearch(!showSearch);
          }}
        >
          <Ionicons
            name={showSearch ? 'close' : 'search'}
            size={22}
            color="#fff"
          />
        </TouchableOpacity>
      </View>

      {/* ====== SWIPE LIST ====== */}
      <SwipeListView
        data={history}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderVisibleItem}
        renderHiddenItem={renderHiddenItem}
        rightOpenValue={-75}
        stopRightSwipe={-75}
        swipeToOpenPercent={50}
        closeOnRowPress
        closeOnScroll
        disableRightSwipe
        contentContainerStyle={{ padding: 16 }}
        ListEmptyComponent={
          <Text style={{ color: '#fff', textAlign: 'center', marginTop: 50 }}>
            No quiz history yet.
          </Text>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#1B182B' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 10,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  searchInput: {
    flex: 1,
    height: 40,
    backgroundColor: '#2A273E',
    borderRadius: 8,
    paddingHorizontal: 12,
    color: '#fff',
    marginRight: 10,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#2A273E',
    borderRadius: 12,
    padding: 6,
    marginBottom: 14,
    alignItems: 'center',
  },
  image: {
    width: 85,
    height: 95,
    borderRadius: 10,
    marginRight: 12,
  },
  content: { flex: 1 },
  title: { color: '#fff', fontWeight: 'bold', fontSize: 17 },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  itemRow: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  icon: { width: 16, height: 16, resizeMode: 'contain', marginRight: 5 },
  meta: { color: '#bbb', fontSize: 13 },
  green: { color: '#00FF99', fontWeight: '600' },
  rowBack: {
    alignItems: 'center',
    backgroundColor: '#FF5A5F',
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingRight: 16,
    marginBottom: 14,
    borderRadius: 12,
  },
  deleteBtn: {
    width: 60,
    height: '100%',
    backgroundColor: '#FF5A5F',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
});
