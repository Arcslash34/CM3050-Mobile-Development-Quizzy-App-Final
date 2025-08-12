// components/DailyQuizCard.js (Presentation Layer) — Displays a card for the daily quiz feature
import React from 'react';
import { View, Text, TouchableOpacity, ImageBackground, StyleSheet } from 'react-native';

export default function DailyQuizCard({ onPress }) {
  return (
    // Card background with daily quiz image
    <ImageBackground
      source={require('../assets/images/daily.jpg')}
      style={styles.card}
      imageStyle={{ borderRadius: 16 }}
    >
      <Text style={styles.title}>Daily Quiz</Text>
      <Text style={styles.subtitle}>Everyday Learn & Play</Text>
      <TouchableOpacity style={styles.button} onPress={onPress}>
        <Text style={styles.buttonText}>Start Quiz</Text>
      </TouchableOpacity>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: '#BBB',
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    borderRadius: 8,
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
  },
  buttonText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
});
