// views/HomeView.js (Presentation Layer)
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DailyQuizCard from '../components/DailyQuizCard';
import CategoryCard from '../components/CategoryCard';

export default function HomeView({
  username,               // Displayed username
  avatarUrl,              // Profile avatar image URL
  categoryData,           // Array of quiz categories
  rewardPoints,           // User's reward points
  localRank,              // User's local ranking
  onCategoryPress,        // Handler for category card press
  onDailyQuizPress,       // Handler for daily quiz press
  onProfilePress,         // Handler for profile avatar press
  onRankingPress,         // Handler for stats press
  onAllCategoriesPress,   // Handler for "Load All" press
}) {
  // ====== FLATLIST HEADER SECTION ======
  const renderHeader = () => (
    <>
      {/* ====== USER GREETING & AVATAR ====== */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hi, {username || 'User'}</Text>
          <Text style={styles.subtitle}>Let's make everyday productive</Text>
        </View>
        <TouchableOpacity onPress={onProfilePress}>
          <Image
            source={
              avatarUrl
                ? { uri: avatarUrl }
                : require('../assets/images/profile.png')
            }
            style={styles.avatar}
          />
        </TouchableOpacity>
      </View>

      {/* ====== USER STATS ====== */}
      <View style={styles.statsContainer}>
        {/* Reward Points */}
        <TouchableOpacity style={styles.statItem} onPress={onRankingPress}>
          <Image
            source={require('../assets/images/wreath.png')}
            style={styles.statIconImage}
          />
          <View style={styles.statText}>
            <Text style={styles.statTitle}>Reward Points</Text>
            <Text style={styles.statValue}>{rewardPoints}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.divider} />

        {/* Local Rank */}
        <TouchableOpacity style={styles.statItem} onPress={onRankingPress}>
          <Image
            source={require('../assets/images/award.png')}
            style={styles.statIconImage}
          />
          <View style={styles.statText}>
            <Text style={styles.statTitle}>Local Ranking</Text>
            <Text style={styles.statValue}>{localRank}</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* ====== DAILY QUIZ CARD ====== */}
      <DailyQuizCard onPress={onDailyQuizPress} />

      {/* ====== QUIZ CATEGORIES HEADER ====== */}
      <View style={styles.categoryHeader}>
        <Text style={styles.categoryTitle}>Quiz Categories</Text>
        <TouchableOpacity onPress={onAllCategoriesPress}>
          <Text style={styles.loadAll}>Load All</Text>
        </TouchableOpacity>
      </View>
    </>
  );

  // ====== MAIN RENDER ======
  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ====== CATEGORY GRID ====== */}
      <FlatList
        data={categoryData.slice(0, 10)} // Show only top 10 categories
        keyExtractor={(item, index) => index.toString()}
        numColumns={2}
        ListHeaderComponent={renderHeader}
        contentContainerStyle={styles.container}
        columnWrapperStyle={{ justifyContent: 'space-between' }}
        renderItem={({ item }) => (
          <View style={styles.categoryWrapper}>
            <CategoryCard item={item} onPress={onCategoryPress} />
          </View>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // ====== LAYOUT ======
  safeArea: { flex: 1, backgroundColor: '#1B182B' },
  container: { padding: 20, backgroundColor: '#1B182B' },

  // ====== HEADER ======
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  greeting: { fontSize: 20, fontWeight: 'bold', color: '#FFFFFF' },
  subtitle: { color: '#BBB', fontSize: 14, marginTop: 2 },
  avatar: { width: 45, height: 45, borderRadius: 25 },

  // ====== USER STATS ======
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#2A273E',
    borderRadius: 12,
    marginTop: 10,
    padding: 14,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIconImage: {
    width: 30,
    height: 30,
    resizeMode: 'contain',
    marginRight: 12,
  },
  statText: { justifyContent: 'center', alignItems: 'center' },
  statTitle: { color: '#DDD', fontSize: 14, marginBottom: 2 },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#FFD700' },
  divider: {
    width: 2,
    height: '100%',
    backgroundColor: '#444',
    marginHorizontal: 12,
  },

  // ====== CATEGORY HEADER ======
  categoryHeader: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  categoryTitle: { color: '#FFFFFF', fontSize: 20, fontWeight: 'bold' },
  loadAll: { color: '#BBB', fontSize: 14, fontWeight: '600' },

  // ====== CATEGORY CARD WRAPPER ======
  categoryWrapper: { width: '48%', marginBottom: 15 },
});
