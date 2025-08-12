// containers/ReviewContainer.js (Logic Layer)
import React from 'react';
import ReviewView from '../views/ReviewView';

export default function ReviewContainer({ navigation, route }) {
  // Extract parameters from navigation
  const {
    reviewData,
    quizTitle = 'Quiz Review', // Default title if not provided
    score = 0,                  // Default score
    xp = 0,                     // Default XP
  } = route.params;

  let parsed = [];

  try {
    // Get the raw review data from either 'review_data' key or directly from reviewData
    const raw = reviewData?.review_data ?? reviewData;

    // Parse depending on type
    if (Array.isArray(raw)) {
      parsed = raw; // Already in array form
    } else if (typeof raw === 'string') {
      parsed = JSON.parse(raw); // Parse JSON string into an array
    } else {
      parsed = []; // Unsupported type → fallback to empty array
    }
  } catch (error) {
    // Log parsing errors and fallback to empty array
    console.error('Failed to parse review data:', error);
    parsed = [];
  }

  // Render the presentation layer with parsed data and navigation handlers
  return (
    <ReviewView
      parsed={parsed}
      quizTitle={quizTitle}
      score={score}
      xp={xp}
      onClose={() => navigation.goBack()} // Go back to previous screen
    />
  );
}
