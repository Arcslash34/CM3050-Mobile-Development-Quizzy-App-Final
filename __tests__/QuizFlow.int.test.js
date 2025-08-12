// __tests__/QuizFlow.int.test.js
import '@testing-library/jest-native/extend-expect';

/**
 * Integration test scope:
 * - Exercises QuizContainer orchestration with a lightweight QuizView stub.
 * - Runs inside Navigation/SafeArea shells while avoiding real native/ESM code.
 * - Mocks AsyncStorage and Expo bridges (AV/Haptics/Notifications) and Supabase insert.
 * - Uses fake timers and a helper to advance the 1500ms completion delay reliably.
 * - Covers paths: normal quiz (history insert), daily quiz (save + cancel notifications),
 *   hint penalty, incorrect answer, multi-question flow, and auto-submit on timer expiry.
 */

// --- Native/ESM virtual stubs (avoid resolving real native/ESM code) ---
jest.mock('react-native-gesture-handler', () => ({}), { virtual: true });
jest.mock('react-native-screens', () => ({ enableScreens: jest.fn() }), { virtual: true });
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper', () => ({}), { virtual: true });

/**
 * React Navigation + Safe Area shims
 * - Provide minimal wrappers for focus and layout prerequisites without importing ESM builds.
 */
jest.mock('@react-navigation/native', () => {
  const React = require('react');
  return {
    NavigationContainer: ({ children }) => children,
    useFocusEffect: (cb) => {
      React.useEffect(() => (typeof cb === 'function' ? cb() : undefined), []);
    },
  };
}, { virtual: true });

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: ({ children }) => children,
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
  };
}, { virtual: true });

/** Stub binary assets used by QuizContainer sound effects */
jest.mock('../assets/correct.mp3', () => 'correct.mp3', { virtual: true });
jest.mock('../assets/incorrect.mp3', () => 'incorrect.mp3', { virtual: true });

/** AsyncStorage + Expo bridges (Audio/Haptics/Notifications) */
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);
jest.mock('expo-av', () => ({
  Audio: {
    Sound: jest.fn().mockImplementation(() => ({
      unloadAsync: jest.fn(async () => {}),
      loadAsync: jest.fn(async () => {}),
      playAsync: jest.fn(async () => {}),
    })),
  },
}));
jest.mock('expo-haptics', () => ({
  NotificationFeedbackType: { Success: 'success', Error: 'error' },
  notificationAsync: jest.fn(async () => {}),
}));
jest.mock('expo-notifications', () => ({
  cancelAllScheduledNotificationsAsync: jest.fn(async () => {}),
}));

// Jest-safe out-of-scope mock vars (captured by module factories)
let mockInsert;     // for supabase.from().insert
let mockSaveDaily;  // for saveDailyQuizResult

/**
 * Supabase and daily saver mocks
 * - Declared before importing the container so the module under test
 *   captures the factories with the test-scoped variables above.
 */
jest.mock('../supabase', () => {
  return {
    supabase: {
      auth: {
        getUser: jest.fn(async () => ({ data: { user: { id: 'u1' } }, error: null })),
      },
      from: () => ({
        insert: (...args) => mockInsert?.(...args),
      }),
    },
  };
});

jest.mock('../utils/saveDailyQuizResult', () => ({
  saveDailyQuizResult: (...args) => mockSaveDaily?.(...args),
}));

/**
 * QuizView stub
 * - Exposes minimal UI handles to drive the container: show question,
 *   trigger hint, pick correct/wrong answer, submit.
 */
jest.mock('../views/QuizView', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return function MockQuizView(props) {
    const { questionData, setSelected, handleSubmit, handleHint } = props;
    return (
      <>
        <Text testID="q">{questionData?.question ?? '...'}</Text>
        <Text onPress={() => handleHint?.()}>Use Hint</Text>
        <Text onPress={() => setSelected?.(questionData?.correctAnswer)}>Pick Correct</Text>
        <Text onPress={() => setSelected?.('WRONG')}>Pick Wrong</Text>
        <Text onPress={() => handleSubmit?.()}>Submit</Text>
      </>
    );
  };
});

import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
const { NavigationContainer } = require('@react-navigation/native');
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
const QuizContainer = require('../containers/QuizContainer').default;

/** Simple wrapper to satisfy provider requirements */
const wrap = (ui) => (
  <SafeAreaProvider>
    <NavigationContainer>{ui}</NavigationContainer>
  </SafeAreaProvider>
);

/** Minimal navigation stub for assertions */
const makeNav = () => ({
  navigate: jest.fn(),
  dispatch: jest.fn(),
  addListener: jest.fn(() => () => {}),
});

/** Timer/mocks lifecycle */
beforeEach(() => {
  jest.clearAllMocks();
  mockInsert = jest.fn(async () => ({ data: [{ id: 'row1' }], error: null }));
  mockSaveDaily = jest.fn(async () => ({}));
  jest.useFakeTimers();
});

afterEach(() => {
  jest.useRealTimers();
});

/**
 * Helper: reliably flush the 1500ms completion path and any queued work
 * - Advances timers, runs pending timers, and yields microtasks.
 */
async function flushTimersAndMicrotasks(ms = 1600) {
  await act(async () => {
    jest.advanceTimersByTime(ms);
  });
  await act(async () => {
    jest.runOnlyPendingTimers();
  });
  await act(async () => {});
  await act(async () => Promise.resolve());
}

describe('QuizFlow Integration Tests', () => {
  test('normal quiz: inserts history and navigates with results', async () => {
    const params = {
      quizSetId: 'cat10_hard_set1',
      quizTitle: '#1 General',
      difficulty: 'hard',
      questions: [
        { question: '2+2?', correct_answer: '4', incorrect_answers: ['3', '5', '6'] },
      ],
    };
    const navigation = makeNav();

    const { findByText, getByText } = render(wrap(
      <QuizContainer route={{ params }} navigation={navigation} />
    ));

    await findByText('2+2?');

    fireEvent.press(getByText('Pick Correct'));
    // let setSelected commit
    await act(async () => {});
    fireEvent.press(getByText('Submit'));

    await flushTimersAndMicrotasks(1700);

    await waitFor(() => expect(mockInsert).toHaveBeenCalled());
    await waitFor(() => expect(navigation.navigate).toHaveBeenCalled());
    expect(navigation.navigate).toHaveBeenCalledWith(
      'ResultContainer',
      expect.objectContaining({
        totalQuestions: 1,
        correct: expect.any(Number),
        incorrect: expect.any(Number),
        unanswered: expect.any(Number),
        xpEarned: expect.any(Number),
        reviewData: expect.any(Array),
        categoryTitle: '#1 General',
      })
    );
  });

  test('daily quiz: saves daily, cancels notifications, no history insert', async () => {
    const params = {
      quizSetId: 'daily-2025-01-01',
      quizTitle: 'Daily Quiz - 2025-01-01',
      difficulty: 'hard',
      questions: [
        { question: 'Capital of France?', correct_answer: 'Paris', incorrect_answers: ['Rome', 'Berlin', 'Madrid'] },
      ],
    };
    const navigation = makeNav();

    const { findByText, getByText } = render(wrap(
      <QuizContainer route={{ params }} navigation={navigation} />
    ));

    await findByText('Capital of France?');

    fireEvent.press(getByText('Pick Correct'));
    await act(async () => {});
    fireEvent.press(getByText('Submit'));

    await flushTimersAndMicrotasks(1700);

    await waitFor(() => expect(mockSaveDaily).toHaveBeenCalled());
    expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('lastDailyQuizDate', expect.any(String));
    expect(mockInsert).not.toHaveBeenCalled();
    await waitFor(() => expect(navigation.navigate).toHaveBeenCalled());
    expect(navigation.navigate).toHaveBeenCalledWith(
      'ResultContainer',
      expect.objectContaining({ xpEarned: expect.any(Number) })
    );
  });

  test('hint penalty path: navigates with xp after hint then correct', async () => {
    const params = {
      quizSetId: 'cat10_hard_set1',
      quizTitle: '#1 General',
      difficulty: 'hard',
      questions: [
        { question: 'Fastest land animal?', correct_answer: 'Cheetah', incorrect_answers: ['Lion', 'Horse', 'Tiger'] },
      ],
    };
    const navigation = makeNav();

    const { findByText, getByText } = render(wrap(
      <QuizContainer route={{ params }} navigation={navigation} />
    ));

    await findByText('Fastest land animal?');

    fireEvent.press(getByText('Use Hint'));
    fireEvent.press(getByText('Pick Correct'));
    await act(async () => {});
    fireEvent.press(getByText('Submit'));

    await flushTimersAndMicrotasks(1700);

    await waitFor(() => expect(navigation.navigate).toHaveBeenCalled());
    expect(navigation.navigate).toHaveBeenCalledWith(
      'ResultContainer',
      expect.objectContaining({ xpEarned: expect.any(Number) })
    );
  });

  test('incorrect answer path: records incorrect answer and navigates', async () => {
    const params = {
      quizSetId: 'cat10_easy_set1',
      quizTitle: 'Easy Questions',
      difficulty: 'easy',
      questions: [
        { question: 'What color is the sky?', correct_answer: 'Blue', incorrect_answers: ['Red', 'Green', 'Yellow'] },
      ],
    };
    const navigation = makeNav();

    const { findByText, getByText } = render(wrap(
      <QuizContainer route={{ params }} navigation={navigation} />
    ));

    await findByText('What color is the sky?');

    fireEvent.press(getByText('Pick Wrong'));
    await act(async () => {});
    fireEvent.press(getByText('Submit'));

    await flushTimersAndMicrotasks(1700);

    await waitFor(() => expect(navigation.navigate).toHaveBeenCalled());
    expect(navigation.navigate).toHaveBeenCalledWith(
      'ResultContainer',
      expect.objectContaining({
        correct: expect.any(Number),
        incorrect: expect.any(Number),
        xpEarned: expect.any(Number),
      })
    );
  });

  test('multiple questions: progresses through all questions', async () => {
    const params = {
      // must match /cat(\d+)_/ so category_id parsing doesn't throw
      quizSetId: 'cat42_medium_set1',
      quizTitle: 'Multi-Question Quiz',
      difficulty: 'medium',
      questions: [
        { question: 'Q1', correct_answer: 'A1', incorrect_answers: ['B1', 'C1'] },
        { question: 'Q2', correct_answer: 'A2', incorrect_answers: ['B2', 'C2'] },
      ],
    };
    const navigation = makeNav();

    const { findByText, getByText } = render(wrap(
      <QuizContainer route={{ params }} navigation={navigation} />
    ));

    // Q1
    await findByText('Q1');
    fireEvent.press(getByText('Pick Correct'));
    await act(async () => {});
    fireEvent.press(getByText('Submit'));
    await flushTimersAndMicrotasks(1700);

    // Q2
    await findByText('Q2');
    fireEvent.press(getByText('Pick Correct'));
    await act(async () => {});
    fireEvent.press(getByText('Submit'));
    await flushTimersAndMicrotasks(1700);

    await waitFor(() => expect(navigation.navigate).toHaveBeenCalled());
    expect(navigation.navigate).toHaveBeenCalledWith(
      'ResultContainer',
      expect.objectContaining({
        totalQuestions: 2,
        correct: expect.any(Number),
        xpEarned: expect.any(Number),
      })
    );
  });
});

/**
 * Auto-submit behavior
 * - Verifies that countdown expiry triggers submission both for normal and daily quizzes.
 */
test('auto-submit on timer expiry (normal quiz): unanswered navigates + history insert', async () => {
  const params = {
    quizSetId: 'cat10_hard_set1',
    quizTitle: '#1 General',
    difficulty: 'hard', // 30s per question
    questions: [
      { question: 'Timeout Q', correct_answer: 'A', incorrect_answers: ['B','C','D'] },
    ],
  };
  const navigation = makeNav();

  const { findByText } = render(wrap(
    <QuizContainer route={{ params }} navigation={navigation} />
  ));

  await findByText('Timeout Q');

  // Let the 30s countdown hit zero (no selection made)
  await act(async () => { jest.advanceTimersByTime(30_000); });

  // Container schedules a 1500ms completion callback
  await flushTimersAndMicrotasks(1700);

  await waitFor(() => expect(mockInsert).toHaveBeenCalled());
  await waitFor(() => expect(navigation.navigate).toHaveBeenCalled());
  expect(navigation.navigate).toHaveBeenCalledWith(
    'ResultContainer',
    expect.objectContaining({
      totalQuestions: 1,
      correct: 0,
      incorrect: 0,
      unanswered: 1,
    })
  );
});

test('auto-submit on timer expiry (daily quiz): saves daily, no insert', async () => {
  const params = {
    quizSetId: 'daily-2025-01-01',
    quizTitle: 'Daily Quiz - 2025-01-01',
    difficulty: 'hard',
    questions: [
      { question: 'Timeout Daily', correct_answer: 'A', incorrect_answers: ['B','C','D'] },
    ],
  };
  const navigation = makeNav();

  const { findByText } = render(wrap(
    <QuizContainer route={{ params }} navigation={navigation} />
  ));

  await findByText('Timeout Daily');

  await act(async () => { jest.advanceTimersByTime(30_000); });
  await flushTimersAndMicrotasks(1700);

  await waitFor(() => expect(mockSaveDaily).toHaveBeenCalled());
  expect(mockInsert).not.toHaveBeenCalled();
  expect(Notifications.cancelAllScheduledNotificationsAsync).toHaveBeenCalled();
  expect(AsyncStorage.setItem).toHaveBeenCalledWith('lastDailyQuizDate', expect.any(String));
  await waitFor(() => expect(navigation.navigate).toHaveBeenCalled());
  expect(navigation.navigate).toHaveBeenCalledWith(
    'ResultContainer',
    expect.objectContaining({ unanswered: 1 })
  );
});
