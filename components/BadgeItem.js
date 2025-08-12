// components/BadgeItem.js (Presentation Layer) — Displays a badge with title, description, and progress
import React from 'react';
import { View, Text, Image, StyleSheet, Pressable } from 'react-native';

export default function BadgeItem({ item, progress, onPress }) {
  const unlocked = progress === 1; // Badge is unlocked if progress is 100%

  return (
    // Pressable only works if badge is unlocked
    <Pressable style={styles.container} onPress={() => unlocked && onPress(item)}>
      {/* Badge image */}
      <Image source={item.badge} style={[styles.badge, unlocked ? styles.completedBadge : styles.incompleteBadge]} />

      {/* Badge info */}
      <View style={styles.info}>
        <Text style={[styles.title, unlocked ? styles.completedText : styles.incompleteText]}>{item.title}</Text>
        <Text style={[styles.desc, unlocked ? styles.completedText : styles.incompleteText]}>{item.description}</Text>

        {/* Progress bar */}
        <View style={styles.progressBarBackground}>
          <View style={[styles.progressBarFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>

      {/* Progress percentage */}
      <Text style={styles.percent}>{Math.round(progress * 100)}%</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#2A273E',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  badge: { width: 50, height: 50, resizeMode: 'contain', marginRight: 12 },
  info: { flex: 1 },
  title: { fontSize: 15, fontWeight: 'bold' },
  desc: { fontSize: 12, marginBottom: 4 },
  progressBarBackground: {
    height: 6,
    backgroundColor: '#555',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 6,
    backgroundColor: '#00FF7F',
  },
  percent: { fontWeight: 'bold', marginLeft: 8, color: '#00FF7F' },
  completedBadge: { opacity: 1 },
  incompleteBadge: { opacity: 0.25 },
  completedText: { color: '#fff' },
  incompleteText: { color: '#aaa' },
});
