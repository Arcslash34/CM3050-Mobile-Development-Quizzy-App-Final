// views/ReviewView.js (Presentation Layer)
import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * ReviewView
 * Displays a detailed breakdown of quiz results:
 *  - Each question
 *  - Whether the user got it correct, incorrect, or unanswered
 *  - Correct answer vs. user-selected answer
 *
 * @param {Array}  parsed     Array of review objects [{number, question, status, correctAnswer, selectedAnswer}, ...]
 * @param {string} quizTitle  Title/category of the quiz
 * @param {number} score      Percentage score
 * @param {number} xp         XP earned
 * @param {func}   onClose    Callback to close the review view
 */
export default function ReviewView({ parsed, quizTitle, score, xp, onClose }) {
  // Individual review card renderer
  const renderItem = ({ item }) => {
    // Color indicator on the left edge based on result status
    let borderColor = '#00FF99'; // default: correct
    if (item.status === 'incorrect') borderColor = '#FF5555';
    else if (item.status === 'unanswered') borderColor = '#B388FF';

    return (
      <View style={[styles.card, { borderLeftColor: borderColor }]}>
        {/* Question number */}
        <Text style={styles.qNumber}>{item.number}</Text>

        {/* Question text */}
        <Text style={styles.question}>{item.question}</Text>

        {/* Status messages */}
        {item.status === 'incorrect' && (
          <Text style={styles.incorrect}>Wrong Answer</Text>
        )}
        {item.status === 'unanswered' && (
          <Text style={styles.unanswered}>Time’s up, No Answer Selected</Text>
        )}

        {/* Correct and user's answers */}
        <Text style={styles.correct}>Correct Answer: {item.correctAnswer}</Text>
        <Text style={styles.answer}>
          Your Answer: {item.selectedAnswer || '—'}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* ===== Header with close button ===== */}
      <View style={styles.header}>
        <Text style={styles.title}>Quiz Review</Text>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Ionicons name="close-outline" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Quiz meta information */}
      <Text style={styles.category}>{quizTitle}</Text>
      <Text style={styles.subheader}>
        Score: {score}% | XP: {xp}
      </Text>

      {/* If no review data */}
      {parsed.length === 0 ? (
        <Text style={{ color: '#fff', padding: 16, textAlign: 'center' }}>
          No review data available.
        </Text>
      ) : (
        // Scrollable list of review cards
        <FlatList
          data={parsed}
          keyExtractor={(item, index) => index.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 20 }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#12101A',
  },

  // ===== Header =====
  header: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  title: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 10,
  },

  // ===== Meta Info =====
  category: {
    color: '#aaa',
    fontSize: 20,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  subheader: {
    color: '#ccc',
    fontSize: 14,
    marginBottom: 10,
    paddingHorizontal: 16,
  },

  // ===== Question Card =====
  card: {
    backgroundColor: '#222030',
    borderRadius: 10,
    marginBottom: 14,
    padding: 12,
    borderLeftWidth: 5, // Color-coded left edge
  },
  qNumber: {
    color: '#ccc',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  question: {
    color: '#fff',
    marginBottom: 6,
  },

  // Answer styles
  correct: {
    color: '#00FF99',
    fontWeight: 'bold',
  },
  answer: {
    color: '#ccc',
    marginTop: 4,
  },

  // Status styles
  incorrect: {
    color: '#FF4444',
    fontWeight: 'bold',
  },
  unanswered: {
    color: '#B388FF',
    fontWeight: 'bold',
  },
});
