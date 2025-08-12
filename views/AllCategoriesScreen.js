// views/AllCategoriesScreen.js (Presentation Layer)
import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import CategoryCard from '../components/CategoryCard';

export default function AllCategoriesScreen({
  navigation,       // Navigation prop for navigating between screens
  searchQuery,      // Current search text
  setSearchQuery,   // Function to update search text
  searchActive,     // Boolean indicating if the search bar is visible
  setSearchActive,  // Function to toggle search bar visibility
  searchAnim,       // Animated.Value controlling search bar height
  filteredData,     // List of filtered category data
}) {
  // Animate search bar height from 0 to 70 when expanded
  const searchHeight = searchAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 70],
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>

        {/* ====== HEADER ====== */}
        {/* Contains back button, title, and search toggle */}
        <View style={styles.header}>
          {/* Back button */}
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconWrapper}>
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>

          {/* Screen title */}
          <Text style={styles.headerTitle}>All Categories</Text>

          {/* Search toggle button */}
          <TouchableOpacity onPress={() => setSearchActive(!searchActive)} style={styles.iconWrapper}>
            <Ionicons name="search" size={24} color="white" />
          </TouchableOpacity>
        </View>

        {/* ====== SEARCH BAR ====== */}
        {/* Expands with animation when searchActive is true */}
        <Animated.View style={[styles.searchWrapper, { height: searchHeight }]}>
          {searchActive && (
            <View style={styles.searchInputContainer}>
              {/* Search input field */}
              <TextInput
                placeholder="Search categories..."
                placeholderTextColor="#999"
                value={searchQuery}
                onChangeText={setSearchQuery}
                style={styles.searchInput}
              />

              {/* Clear search text button */}
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={22} color="#999" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </Animated.View>

        {/* ====== CATEGORY LIST ====== */}
        <FlatList
          data={filteredData} // List of categories to display
          numColumns={2}      // Display 2 items per row
          keyExtractor={(item, index) => index.toString()}
          columnWrapperStyle={{ justifyContent: 'space-between' }}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item }) => (
            <CategoryCard
              item={item}
              variant="all"
              onPress={() => navigation.navigate('QuizSet', { category: item })}
            />
          )}
          // Message when no categories match the search
          ListEmptyComponent={
            <Text style={{ color: '#aaa', textAlign: 'center', marginTop: 20 }}>
              No matching categories.
            </Text>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1B182B',
  },
  container: {
    flex: 1,
    backgroundColor: '#1B182B',
    padding: 20,
    paddingTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    position: 'relative',
  },
  headerTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  iconWrapper: {
    padding: 6,
    zIndex: 1,
  },
  searchWrapper: {
    overflow: 'hidden',
    marginBottom: 10,
  },
  searchInputContainer: {
    backgroundColor: '#2A273E',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    color: 'white',
    fontSize: 16,
    paddingRight: 8,
  },
});
