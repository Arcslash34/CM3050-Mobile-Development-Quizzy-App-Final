// utils/badgeConfig.js
// This file defines the list of achievements/badges available in the app.
// Each achievement has an ID, title, description, and image reference.
// The badges are used for gamification, motivating users to keep engaging with quizzes.

const achievements = [
  {
    id: 1,
    title: 'First Quiz', // Awarded when user completes their first quiz
    description: 'Complete your first quiz',
    badge: require('../assets/badge/badge1.png'),
  },
  {
    id: 2,
    title: 'Perfectionist', // Awarded for scoring 100% on any quiz
    description: 'Score 100% on a quiz',
    badge: require('../assets/badge/badge2.png'),
  },
  {
    id: 3,
    title: 'Fast Learner', // Awarded for finishing a quiz in under 1 minute
    description: 'Finish a quiz under 1 minute',
    badge: require('../assets/badge/badge3.png'),
  },
  {
    id: 4,
    title: 'Knowledge Seeker', // Awarded for completing 10 quizzes in total
    description: 'Complete 10 quizzes',
    badge: require('../assets/badge/badge4.png'),
  },
  {
    id: 5,
    title: 'Quiz Master', // Awarded for completing 50 quizzes in total
    description: 'Complete 50 quizzes',
    badge: require('../assets/badge/badge5.png'),
  },
  {
    id: 6,
    title: 'Fast Finisher', // Awarded for finishing 10 quizzes in under 1 minute each
    description: 'Finish 10 quizzes under 1 minute',
    badge: require('../assets/badge/badge6.png'),
  },
  {
    id: 7,
    title: 'Quiz Verified', // Awarded for completing an official/certified quiz
    description: 'Complete a certified or official quiz',
    badge: require('../assets/badge/badge7.png'),
  },
  {
    id: 8,
    title: 'Sharp Shooter', // Awarded for a perfect score in a hard-level quiz
    description: 'Achieve a perfect score in a hard-level quiz',
    badge: require('../assets/badge/badge8.png'),
  },
  {
    id: 9,
    title: 'Gamer Level 2', // Awarded after completing 20 quizzes (level up)
    description: 'Complete 20 quizzes to level up your gaming badge',
    badge: require('../assets/badge/badge9.png'),
  },
  {
    id: 10,
    title: 'Crystal Clear', // Awarded for completing a quiz without using hints
    description: 'Answer all questions in a quiz without using hints',
    badge: require('../assets/badge/badge10.png'),
  },
  {
    id: 11,
    title: 'On Fire!', // Awarded for completing 5 quizzes in a single session
    description: 'Complete 5 quizzes in a single session',
    badge: require('../assets/badge/badge11.png'),
  },
  {
    id: 12,
    title: 'Happy Camper', // Awarded for being active for 7 consecutive days
    description: 'Stay active in the app for 7 consecutive days',
    badge: require('../assets/badge/badge12.png'),
  },
  {
    id: 13,
    title: 'Piece of Cake', // Awarded for a flawless easy-level quiz
    description: 'Complete an easy quiz flawlessly',
    badge: require('../assets/badge/badge13.png'),
  },
  {
    id: 14,
    title: 'Daily Drop', // Awarded for opening the app daily
    description: 'Open the app daily for a surprise reward',
    badge: require('../assets/badge/badge14.png'),
  },
  {
    id: 15,
    title: 'Crown Jewel I', // Diamond badge for top performance in 1 quiz
    description: 'Earn a diamond badge for top performance in 1 quiz',
    badge: require('../assets/badge/badge15.png'),
  },
  {
    id: 16,
    title: 'Royal Streak', // Top scores in 3 quizzes without retries
    description: 'Achieve top scores in 3 quizzes without retries',
    badge: require('../assets/badge/badge16.png'),
  },
  {
    id: 17,
    title: 'First Share', // Awarded for sharing a badge/quiz result once
    description: 'Share any badge or quiz result once',
    badge: require('../assets/badge/badge17.png'),
  },
  {
    id: 18,
    title: 'Social Sharer', // Awarded for sharing 5 times
    description: 'Share 5 times in total',
    badge: require('../assets/badge/badge18.png'),
  },
  {
    id: 19,
    title: 'First Friend', // Awarded for adding first friend
    description: 'Add your first friend',
    badge: require('../assets/badge/badge19.png'),
  },
  {
    id: 20,
    title: 'Friendly Circle', // Awarded for having 5 accepted friends
    description: 'Have 5 friends accepted',
    badge: require('../assets/badge/badge20.png'),
  },
];

export { achievements };
