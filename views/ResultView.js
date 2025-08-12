// views/ResultView.js (Presentation Layer)
import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

// Preload all result-related icons into a dictionary for easy lookup
const statImages = {
  'correct2.png': require('../assets/images/correct2.png'),
  'unanswer.png': require('../assets/images/unanswer.png'),
  'wrong2.png': require('../assets/images/wrong2.png'),
  'trophy.png': require('../assets/images/trophy.png'),
  'point.png': require('../assets/images/point.png'),
  'time2.png': require('../assets/images/time2.png'),
};

export default function ResultView({
  score, // Percentage score (0–100)
  timeStr, // Formatted time taken (e.g., "1m 32s")
  correct, // Number of correct answers
  incorrect, // Number of incorrect answers
  unanswered, // Number of unanswered questions
  xpEarned, // XP earned for the quiz
  onShare, // Handler for "Share" button
  onReview, // Handler for "Review" button
  onClose, // Handler for closing the result screen
}) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* ===== Top section: Title, close button, and score summary ===== */}
        <View style={styles.contentContainer}>
          {/* Header with title and close icon */}
          <View style={styles.headerWrapper}>
            <Text style={styles.title}>Quiz Result</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close-outline" size={28} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Celebration trophy image */}
          <Image
            source={require('../assets/images/congrat.png')}
            style={styles.trophy}
          />
          <Text style={styles.congrats}>Congratulations!</Text>

          {/* Score display */}
          <Text style={styles.scoreLabel}>YOUR SCORE</Text>
          <Text style={styles.scoreValue}>{score}%</Text>

          {/* ===== Middle section: Quiz statistics ===== */}
          <View style={styles.statsContainer}>
            {/* Row 1: Question results */}
            <View style={styles.row}>
              <Stat
                icon="correct2.png"
                label={`${correct} Questions`}
                title="Correct"
                color="#00FF99"
              />
              <Stat
                icon="unanswer.png"
                label={`${unanswered} Question`}
                title="Unanswered"
                color="#00CFFF"
              />
              <Stat
                icon="wrong2.png"
                label={`${incorrect} Question`}
                title="Incorrect"
                color="#FF4444"
              />
            </View>

            {/* Row 2: Extra info */}
            <View style={styles.row}>
              <Stat icon="trophy.png" label="+12 Ranks" title="Leaderboard" />
              <Stat
                icon="point.png"
                label={`+ ${xpEarned} XP`}
                title="Points Earned"
              />
              <Stat icon="time2.png" label={timeStr} title="Time Taken" />
            </View>
          </View>
        </View>

        {/* ===== Bottom section: Action buttons ===== */}
        <View style={styles.buttonWrapper}>
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.buttonGrey} onPress={onShare}>
              <Text style={styles.buttonText}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.buttonPurple} onPress={onReview}>
              <Text style={styles.buttonText}>Review</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

/**
 * Reusable Stat box component
 * @param {string} icon   - Key for statImages object
 * @param {string} label  - Main value text
 * @param {string} title  - Description text
 * @param {string} color  - Optional label color
 */
function Stat({ icon, label, title, color = '#fff' }) {
  const imageSource = statImages[icon];
  return (
    <View style={styles.statBox}>
      <Image source={imageSource} style={styles.statIcon} />
      <Text style={[styles.statLabel, { color }]}>{label}</Text>
      <Text style={styles.statTitle}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#1B182B' },
  container: {
    flex: 1,
    backgroundColor: '#1B182B',
    padding: 20,
    justifyContent: 'space-between',
  },

  // Header
  contentContainer: { alignItems: 'center' },
  headerWrapper: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    position: 'relative',
  },
  title: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 20,
    textAlign: 'center',
  },
  closeButton: { position: 'absolute', right: 0, top: 0 },

  // Score display
  trophy: { width: 220, height: 220, resizeMode: 'contain' },
  congrats: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  scoreLabel: { color: '#ccc', fontSize: 14, marginTop: 5 },
  scoreValue: { fontSize: 45, color: '#00FF99', fontWeight: 'bold' },

  // Stat box styling
  statsContainer: { width: '100%', marginTop: 20 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    width: '100%',
    marginBottom: 12,
  },
  statBox: {
    flexBasis: '30%',
    backgroundColor: '#2A273E',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statIcon: { width: 30, height: 30, marginBottom: 6, resizeMode: 'contain' },
  statLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#fff',
  },
  statTitle: { fontSize: 12, color: '#aaa', textAlign: 'center' },

  // Buttons
  buttonWrapper: { paddingBottom: 10 },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 20,
    justifyContent: 'space-between',
    width: '100%',
  },
  buttonGrey: {
    backgroundColor: '#444',
    flex: 1,
    padding: 14,
    borderRadius: 8,
    marginRight: 5,
    alignItems: 'center',
  },
  buttonPurple: {
    backgroundColor: '#6C63FF',
    flex: 1,
    padding: 14,
    borderRadius: 8,
    marginLeft: 5,
    alignItems: 'center',
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
});
