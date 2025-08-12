// views/QuizView.js (Presentation Layer)
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function QuizView({
  // Props passed from container
  questionData, // Object with question, options, correct answer
  selected, // Currently selected option
  submitted, // Whether answer has been submitted
  showXPMessage, // Show XP gain/loss message
  earnedXP, // XP earned for current question
  usedHint, // Whether hint was used
  remainingTime, // Seconds left
  totalTime, // Total time for the question
  currentIndex, // Current question index
  quizLength, // Total questions in quiz
  eliminatedOption, // Option removed by hint
  setSelected, // Select an answer
  handleSubmit, // Submit handler
  handleHint, // Hint handler
  navigation, // Navigation object
}) {
  // Animations for flashing effect and timer bar
  const flashAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(1)).current;

  // Dynamic bar color based on progress
  const barColor = progressAnim.interpolate({
    inputRange: [0, 0.3, 1],
    outputRange: ['#FF3B3B', '#FFA500', '#32CD32'],
  });

  // Restart timer bar on each new question
  useEffect(() => {
    progressAnim.setValue(1);
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: totalTime * 1000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  }, [currentIndex, progressAnim, totalTime]);

  // Flash when 10s or less remain and not submitted
  const isFlashing = remainingTime <= 10 && !submitted;

  // Loading fallback
  if (!questionData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <Text style={{ color: '#fff', textAlign: 'center' }}>
            Loading question...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Option button styling logic
  const getOptionStyle = (option) => {
    if (!submitted)
      return selected === option ? styles.optionSelected : styles.optionDefault;
    if (option === questionData.correctAnswer)
      return selected === null ? styles.optionReveal : styles.optionCorrect;
    if (option === selected && option !== questionData.correctAnswer)
      return styles.optionWrong;
    return styles.optionDefault;
  };

  // Icons for selected/correct/wrong states
  const renderOptionIcon = (option) => {
    const isCorrect = option === questionData.correctAnswer;
    const isSelected = option === selected;

    if (!submitted && isSelected)
      return (
        <Ionicons
          name="radio-button-on"
          size={22}
          color="#6C63FF"
          style={{ marginLeft: 8 }}
        />
      );

    if (submitted) {
      if (isCorrect)
        return (
          <Ionicons
            name="checkmark-circle"
            size={22}
            color="#4CAF50"
            style={{ marginLeft: 8 }}
          />
        );
      if (isSelected && !isCorrect)
        return (
          <Ionicons
            name="close-circle"
            size={22}
            color="#F44336"
            style={{ marginLeft: 8 }}
          />
        );
    }

    return (
      <Ionicons
        name="ellipse-outline"
        size={22}
        color="#888"
        style={{ marginLeft: 8 }}
      />
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header: back, progress, hint */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerText}>
            {currentIndex + 1}/{quizLength}
          </Text>
          <TouchableOpacity
            onPress={() => {
              if (!usedHint) handleHint();
            }}
            disabled={usedHint}
            style={{ opacity: usedHint ? 0.3 : 1 }}>
            <Image
              source={require('../assets/images/hint.png')}
              style={styles.hintIcon}
            />
          </TouchableOpacity>
        </View>

        {/* Question text */}
        <View style={styles.questionBox}>
          <Text style={styles.questionText}>{questionData.question}</Text>
        </View>

        {/* Timer bar & countdown */}
        <View style={styles.timerRow}>
          <Animated.View style={styles.timerContainer}>
            <Animated.View
              style={[
                styles.timerBar,
                {
                  width: progressAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0%', '100%'],
                  }),
                  backgroundColor: barColor,
                  opacity: isFlashing ? flashAnim : 1,
                },
              ]}
            />
          </Animated.View>
          <Animated.Text
            style={[
              styles.timerText,
              { color: barColor, opacity: isFlashing ? flashAnim : 1 },
            ]}>
            {remainingTime}
          </Animated.Text>
        </View>

        {/* Answer options list */}
        <FlatList
          data={questionData.options}
          keyExtractor={(item, index) => index.toString()}
          renderItem={({ item }) => {
            if (item === eliminatedOption) return null; // Hide eliminated option
            return (
              <TouchableOpacity
                style={[styles.optionContainer, getOptionStyle(item)]}
                onPress={() => !submitted && setSelected(item)}
                disabled={submitted}>
                <View style={styles.optionTextWrapper}>
                  <Text style={styles.optionText}>{item}</Text>
                </View>
                {renderOptionIcon(item)}
              </TouchableOpacity>
            );
          }}
        />

        {/* XP gain/loss message */}
        {showXPMessage && (
          <View style={styles.xpGainContainer}>
            <Text
              style={[
                styles.xpGainText,
                { color: earnedXP > 0 ? '#00FF99' : '#FF5555' },
              ]}>
              {earnedXP > 0
                ? `+${earnedXP} XP earned!`
                : 'No XP earned – try again!'}
            </Text>
            {usedHint && earnedXP > 0 && (
              <Text style={styles.hintNote}>XP halved due to hint usage</Text>
            )}
          </View>
        )}

        {/* Submit button */}
        <TouchableOpacity
          style={[
            styles.submitButton,
            !selected && { backgroundColor: '#888' },
          ]}
          onPress={handleSubmit}
          disabled={!selected || submitted}>
          <Text style={styles.submitText}>Submit</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#1B182B' },
  container: { flex: 1, padding: 16, backgroundColor: '#1B182B' },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerText: { color: '#fff', fontSize: 16 },
  hintIcon: { width: 24, height: 24, resizeMode: 'contain' },

  // Question
  questionBox: {
    backgroundColor: '#2A273E',
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
  },
  questionText: { color: '#fff', fontSize: 18, textAlign: 'center' },

  // Timer
  timerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 10,
    padding: 2,
    borderWidth: 1,
    borderColor: '#888',
    borderRadius: 15,
  },
  timerContainer: {
    flex: 1,
    height: 10,
    backgroundColor: '#444',
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 10,
  },
  timerBar: { height: '100%', borderRadius: 20, paddingHorizontal: 1 },
  timerText: { fontSize: 14, fontWeight: 'bold' },

  // Options
  optionContainer: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
    justifyContent: 'space-between',
  },
  optionDefault: { borderColor: '#999' },
  optionSelected: { borderColor: '#6C63FF', backgroundColor: '#4B3F72' },
  optionCorrect: { backgroundColor: '#2d5234', borderColor: 'green' },
  optionWrong: { backgroundColor: '#5a2c2c', borderColor: 'red' },
  optionReveal: { backgroundColor: '#2C3E91', borderColor: '#4F7BFF' },
  optionTextWrapper: { flex: 1, paddingRight: 8 },
  optionText: { color: '#fff', fontSize: 15 },

  // XP message
  xpGainContainer: { marginTop: 10, alignItems: 'center' },
  xpGainText: { fontSize: 20, fontWeight: '600' },
  hintNote: {
    color: '#89CFF0',
    fontSize: 16,
    marginTop: 4,
    fontStyle: 'italic',
  },

  // Submit button
  submitButton: {
    marginTop: 16,
    backgroundColor: '#6C63FF',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  submitText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
