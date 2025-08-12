// views/RankingView.js (Presentation Layer)
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import PagerView from 'react-native-pager-view';
import { SafeAreaView } from 'react-native-safe-area-context';

const crownImages = [
  require('../assets/images/crown1.png'),
  require('../assets/images/crown2.png'),
  require('../assets/images/crown3.png'),
];

export default function RankingView({
  activeTab, // Current active ranking tab
  setActiveTab, // Tab change handler
  pagerRef, // PagerView ref for swiping pages
  rankingData, // Ranking data object {tabKey: [...]}
  loading, // Loading state
  showHint, // Whether to show swipe hint
  arrowAnim, // Animation for swipe hint arrow
  tabKeys, // Array of tab names (e.g., ['global', 'local'])
  fetchData, // (Unused here) could be for refresh
}) {
  // Render top 3 podium layout
  const renderPodium = (topThree) => (
    <View style={styles.podiumWrapper}>
      {/* 2nd place */}
      <View style={styles.podium}>
        <View style={styles.lowerPodium}>
          <Image source={crownImages[1]} style={styles.smallCrown} />
          <Image
            source={
              topThree[1]?.avatar
                ? { uri: topThree[1].avatar }
                : require('../assets/images/profile.png')
            }
            style={styles.podiumAvatar}
          />
          <Text style={styles.podiumName}>{topThree[1]?.name}</Text>
          <Text style={styles.podiumScore}>{topThree[1]?.score}</Text>
          <LinearGradient
            colors={['#333', 'transparent']}
            style={styles.stageBox}>
            <Text style={styles.stageNumber}>2</Text>
          </LinearGradient>
        </View>
      </View>

      {/* 1st place */}
      <View style={styles.podium}>
        <View style={styles.upperPodium}>
          <Image source={crownImages[0]} style={styles.bigCrown} />
          <Image
            source={
              topThree[0]?.avatar
                ? { uri: topThree[0].avatar }
                : require('../assets/images/user.jpeg')
            }
            style={styles.firstAvatar}
          />
          <Text style={styles.podiumName}>{topThree[0]?.name}</Text>
          <Text style={styles.podiumScore}>{topThree[0]?.score}</Text>
          <LinearGradient
            colors={['#333', 'transparent']}
            style={[styles.stageBox, { height: 110 }]}>
            <Text style={styles.stageNumber}>1</Text>
          </LinearGradient>
        </View>
      </View>

      {/* 3rd place */}
      <View style={styles.podium}>
        <View style={styles.lowerPodium}>
          <Image source={crownImages[2]} style={styles.smallCrown} />
          <Image
            source={
              topThree[2]?.avatar
                ? { uri: topThree[2].avatar }
                : require('../assets/images/user.jpeg')
            }
            style={styles.podiumAvatar}
          />
          <Text style={styles.podiumName}>{topThree[2]?.name}</Text>
          <Text style={styles.podiumScore}>{topThree[2]?.score}</Text>
          <LinearGradient
            colors={['#333', 'transparent']}
            style={styles.stageBox}>
            <Text style={styles.stageNumber}>3</Text>
          </LinearGradient>
        </View>
      </View>
    </View>
  );

  // Render rankings for a given tab
  const renderRanking = (tab) => {
    const data = rankingData[tab] || [];
    const topThree = data.slice(0, 3);
    const lowerRanks = data.slice(3);

    return (
      <>
        {loading ? (
          // Loader
          <ActivityIndicator
            size="large"
            color="#6C63FF"
            style={{ marginTop: 50 }}
          />
        ) : (
          <>
            {/* Podium if at least 3 players */}
            {topThree.length >= 3 && renderPodium(topThree)}

            {/* Remaining ranks list */}
            <FlatList
              data={lowerRanks}
              renderItem={({ item, index }) => (
                <View style={styles.rankItem}>
                  <Text style={styles.rankNumber}>{index + 4}</Text>
                  <Image
                    source={
                      item.avatar
                        ? { uri: item.avatar }
                        : require('../assets/images/user.jpeg')
                    }
                    style={styles.avatar}
                  />
                  <Text style={styles.name}>{item.name}</Text>
                  <Text style={styles.score}>{item.score}</Text>
                </View>
              )}
              keyExtractor={(item) => item.id}
              contentContainerStyle={{ padding: 16 }}
            />
          </>
        )}
      </>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Title */}
      <Text style={styles.header}>Ranking</Text>

      {/* Tab buttons */}
      <View style={styles.tabContainer}>
        {tabKeys.map((tab, i) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabButton, activeTab === tab && styles.activeTab]}
            onPress={() => {
              setActiveTab(tab);
              pagerRef.current?.setPage(i);
            }}>
            <Text style={styles.tabText}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Swipe hint */}
      {showHint && (
        <Animated.View
          style={[
            styles.swipeHintContainer,
            {
              opacity: arrowAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0.3, 1],
              }),
              transform: [
                {
                  translateX: arrowAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [-12, 12],
                  }),
                },
              ],
            },
          ]}>
          <Text style={styles.swipeHintText}>Swipe for more rankings</Text>
          <Image
            source={require('../assets/images/swipe-arrow.png')}
            style={styles.swipeArrow}
          />
        </Animated.View>
      )}

      {/* Swipeable pager for each tab */}
      <PagerView
        style={{ flex: 1 }}
        initialPage={0}
        ref={pagerRef}
        onPageSelected={(e) => {
          const pageIndex = e.nativeEvent.position;
          const newTab = tabKeys[pageIndex];
          setActiveTab(newTab);
        }}>
        {tabKeys.map((tab) => (
          <View key={tab} style={{ flex: 1 }}>
            {renderRanking(tab)}
          </View>
        ))}
      </PagerView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#1B182B' },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginVertical: 10,
  },

  // Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#333',
    borderRadius: 10,
    padding: 4,
    marginHorizontal: 20,
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: { backgroundColor: '#6C63FF' },
  tabText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },

  // Podium
  podiumWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginHorizontal: 20,
  },
  podium: { flex: 1, alignItems: 'center' },
  upperPodium: { alignItems: 'center' },
  lowerPodium: { alignItems: 'center' },
  bigCrown: { width: 50, height: 50, resizeMode: 'contain', marginBottom: -7 },
  smallCrown: {
    width: 40,
    height: 40,
    resizeMode: 'contain',
    marginBottom: -7,
  },
  podiumAvatar: { width: 60, height: 60, borderRadius: 30, marginBottom: 4 },
  firstAvatar: { width: 80, height: 80, borderRadius: 35, marginBottom: 4 },
  stageBox: {
    marginTop: 6,
    width: 100,
    height: 80,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  stageNumber: { color: '#737373', fontWeight: '500', fontSize: 55 },
  podiumName: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  podiumScore: { color: '#aaa', fontSize: 12, marginBottom: 4 },

  // Lower ranks
  rankItem: {
    flexDirection: 'row',
    backgroundColor: '#2A273E',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginBottom: 10,
    alignItems: 'center',
  },
  rankNumber: {
    width: 20,
    textAlign: 'center',
    color: '#fff',
    fontWeight: '500',
    fontSize: 18,
    marginRight: 10,
  },
  avatar: { width: 35, height: 35, borderRadius: 18, marginRight: 12 },
  name: { flex: 1, color: '#fff', fontWeight: '600', fontSize: 15 },
  score: { color: '#6C63FF', fontWeight: 'bold', fontSize: 15 },

  // Swipe hint
  swipeHintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    marginHorizontal: 20,
    borderRadius: 10,
    padding: 12,
    marginBottom: 6,
  },
  swipeHintText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 10,
  },
  swipeArrow: {
    width: 40,
    height: 30,
    resizeMode: 'contain',
    tintColor: '#fff',
  },
});
