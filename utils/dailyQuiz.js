// utils/dailyQuiz.js
import quizSetMap from './quizSetMap';

/**
 * Generates a daily quiz based on the current date.
 * The same quiz will be generated for all users on the same day
 * (using a date-based hash as a seed).
 */
export const generateDailyQuiz = () => {
  // Get today's date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  // Generate a numeric seed from today's date
  // This ensures the quiz selection is consistent for the whole day
  const seed = hashString(today);

  // Get all available quiz set keys from the imported quizSetMap
  const allKeys = Object.keys(quizSetMap);

  // Pick a set deterministically using the seed
  const chosenKey = allKeys[seed % allKeys.length];

  // Retrieve the full question list for that quiz set
  const allQuestions = quizSetMap[chosenKey].results;

  // Shuffle the questions randomly (basic shuffle)
  // Note: This makes question order different for each user,
  // but the same set is chosen per day.
  const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());

  // Take only the first 10 questions for the daily quiz
  const questions = shuffled.slice(0, 10);

  // Return the structured quiz data
  return {
    quizTitle: `Daily Quiz - ${today}`,  // Display title
    quizSetId: `daily-${today}`,         // Unique ID for this daily quiz
    dateTaken: today,                    // Store the date for records
    categoryTitle: 'Mixed',               // Category label
    difficulty: 'random',                 // Difficulty label
    questions,                            // Final question set
  };
};

/**
 * Converts a string into a numeric hash by summing character codes.
 * Used here to generate a pseudo-random but deterministic number from a date.
 */
const hashString = (str) => {
  return str.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
};
