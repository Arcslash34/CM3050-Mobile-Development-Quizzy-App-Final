// components/CategoryCard.js (Presentation Layer) — Displays a category card with image and label
import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';

export default function CategoryCard({ item, onPress, variant = 'default' }) {
  const isAllCategories = variant === 'all'; // Special style for "All Categories" view

  return (
    // Card clickable to trigger onPress with item
    <TouchableOpacity
      style={[styles.card, isAllCategories && styles.cardAll]}
      onPress={() => onPress(item)}
    >
      {/* Category image */}
      <View style={styles.imageWrapper}>
        <Image source={item.img} style={styles.image} />
      </View>

      {/* Category title */}
      <Text style={[styles.label, isAllCategories && styles.labelAll]}>
        {item.title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#2A273E',
    borderRadius: 12,
    padding: 5,
    width: '100%',
  },
  cardAll: {
    width: '48%',
    marginBottom: 15,
  },
  imageWrapper: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 100,
    borderRadius: 10,
  },
  label: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    paddingVertical: 4,
  },
  labelAll: {
    paddingVertical: 6,
  },
});
