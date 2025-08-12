// containers/AllCategoriesContainer.js (Logic Layer)
import React, { useState, useRef, useEffect } from 'react';
import { Animated } from 'react-native';
import { getTriviaCategories } from '../utils/categoryUtils';
import AllCategoriesScreen from '../views/AllCategoriesScreen';

export default function AllCategoriesContainer({ navigation }) {
  // Search input value
  const [searchQuery, setSearchQuery] = useState('');
  // Whether the search bar is active (expanded)
  const [searchActive, setSearchActive] = useState(false);
  // All available trivia categories
  const [allCategories, setAllCategories] = useState([]);
  // Animation value for search bar transition
  const searchAnim = useRef(new Animated.Value(0)).current;

  // Filter categories based on search query
  const filteredData = allCategories.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Fetch categories from API/cache/local fallback on mount
  useEffect(() => {
    const fetchAllCategories = async () => {
      const categories = await getTriviaCategories();
      setAllCategories(categories);
    };
    fetchAllCategories();
  }, []);

  // Animate search bar when activated/deactivated
  useEffect(() => {
    Animated.timing(searchAnim, {
      toValue: searchActive ? 1 : 0,
      duration: 300,
      useNativeDriver: false, // Can't use native driver for layout animations
    }).start();
  }, [searchActive, searchAnim]);

  // Pass all props and filtered data to the presentation layer
  return (
    <AllCategoriesScreen
      navigation={navigation}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      searchActive={searchActive}
      setSearchActive={setSearchActive}
      searchAnim={searchAnim}
      filteredData={filteredData}
    />
  );
}
