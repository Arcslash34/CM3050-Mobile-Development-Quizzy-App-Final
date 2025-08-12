// views/QuizSetView.js (Presentation Layer)
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Animated,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Static icon map used for row metadata (difficulty, timer, etc.)
const images = {
  easy: require('../assets/images/easy.png'),
  medium: require('../assets/images/medium.png'),
  hard: require('../assets/images/hard.png'),
  timer: require('../assets/images/timer.png'),
  question: require('../assets/images/question.png'),
  tick: require('../assets/images/tick.png'),
  cross: require('../assets/images/cross.png'),
};

export default function QuizSetView({
  // View props from container
  category,          // { id, title, img }
  quizSets,          // Array of quiz set cards to render
  loadingProgress,   // Whether progress is still loading
  fadeAnim,          // Animated.Value for list fade-in
  navigation,        // React Navigation object
  onSelectQuiz,      // Handler when a quiz set is tapped
}) {
  // Renders a single quiz set card
  const renderItem = ({ item }) => {
    const difficultyImage = images[item.difficulty.toLowerCase()];
    const statusImage = item.completed ? images.tick : images.cross;

    return (
      <TouchableOpacity onPress={() => onSelectQuiz(item)}>
        <View style={styles.card}>
          <Image source={category.img} style={styles.image} />
          <View style={styles.cardContent}>
            <Text style={styles.title}>#{item.displayIndex} {category.title}</Text>

            {/* Row: difficulty + time per question */}
            <View style={styles.rowBetween}>
              <View style={styles.rowLeft}>
                <Image source={difficultyImage} style={styles.icon} />
                <Text style={styles.meta}>{item.difficulty}</Text>
              </View>
              <View style={styles.rowRight}>
                <Image source={images.timer} style={styles.icon} />
                <Text style={styles.meta}>{item.time}</Text>
              </View>
            </View>

            {/* Row: question count + completion status */}
            <View style={styles.rowBetween}>
              <View style={styles.rowLeft}>
                <Image source={images.question} style={styles.icon} />
                <Text style={styles.meta}>{item.questions} Questions</Text>
              </View>
              <View style={styles.rowRight}>
                <Image source={statusImage} style={styles.statusIcon} />
                <Text style={[styles.meta, item.completed ? styles.completed : styles.incomplete]}>
                  {item.completed ? 'Completed' : 'Incomplete'}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header with back button and category title */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{category.title}</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Loading state vs animated list */}
      {loadingProgress ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#6C63FF" />
          <Text style={styles.loaderText}>Preparing your quizzes...</Text>
        </View>
      ) : (
        <Animated.FlatList
          data={quizSets}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          renderItem={renderItem}
          style={{ opacity: fadeAnim }}   // Fade-in effect controlled by container
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1B182B',
  },
  // Header bar (back, title, spacer)
  header: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  // Quiz set card layout
  card: {
    flexDirection: 'row',
    backgroundColor: '#2A273E',
    borderRadius: 12,
    marginBottom: 14,
    padding: 5,
  },
  image: {
    width: 85,
    height: 85,
    borderRadius: 10,
    marginRight: 12,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  title: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  // Rows for metadata (difficulty/time & questions/status)
  rowBetween: {
    flexDirection: 'row',
    marginTop: 4,
  },
  rowLeft: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowRight: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  // Small inline icons
  icon: {
    width: 18,
    height: 18,
    marginRight: 6,
    resizeMode: 'contain',
  },
  statusIcon: {
    width: 18,
    height: 18,
    marginRight: 4,
    resizeMode: 'contain',
  },
  // Metadata text styles
  meta: {
    color: '#bbb',
    fontSize: 13,
    marginBottom: 2,
  },
  completed: {
    color: 'lightgreen',
    fontWeight: '600',
  },
  incomplete: {
    color: '#f77',
    fontWeight: '600',
  },
  // Loading UI
  loaderContainer: {
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center'
  },
  loaderText: {
    color: 'white', 
    marginTop: 10
  }
});
