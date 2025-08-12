// __tests__/QuizSetContainer.int.test.js
/**
 * Integration test scope:
 * - Exercises QuizSetContainer orchestration end-to-end with a lightweight view stub.
 * - Avoids real native/ESM modules via RN/Navigation/Safe Area shims.
 * - Supabase and quizSetMap are mocked: `mockHistoryRows` controls completion flags,
 *   and the quizSetMap mock exports a shared object that is mutated per test.
 * - Uses Jest fake timers; `flushFocusWork` advances the container’s 500ms loading delay.
 * - Verifies:
 *   1) Filtered quiz set list (>=8 questions), sequential displayIndex, completion flags,
 *      and per-difficulty time strings.
 *   2) Selecting a valid set navigates to QuizContainer with the correct payload.
 *   3) Selecting an invalid/missing set shows an alert and does not navigate.
 */

import '@testing-library/jest-native/extend-expect';

// Minimal native shims
jest.mock('react-native-gesture-handler', () => ({}), { virtual: true });
jest.mock('react-native-screens', () => ({ enableScreens: jest.fn() }), { virtual: true });
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper', () => ({}), { virtual: true });

// React Navigation + Safe Area shims (avoid ESM/native)
jest.mock('@react-navigation/native', () => {
  const React = require('react');
  return {
    NavigationContainer: ({ children }) => children,
    useFocusEffect: (cb) => {
      // run the effect on mount like focus
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

// ---- Supabase + quizSetMap controllable fakes ----
let mockHistoryRows = [];
jest.mock('../supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(async () => ({ data: { user: { id: 'u1' } }, error: null })),
    },
    from: () => ({
      select: () => ({
        eq: async () => ({ data: mockHistoryRows, error: null }),
      }),
    }),
  },
}));

jest.mock('../utils/quizSetMap', () => {
  const store = {};
  return { __esModule: true, default: store };
});

// after the mocks, grab the same reference so you can mutate it
const mockQuizSetMap = require('../utils/quizSetMap').default;

// Lightweight view driver
jest.mock('../views/QuizSetView', () => {
  const React = require('react');
  const { Text } = require('react-native');
  return function MockQuizSetView({ quizSets = [], loadingProgress, onSelectQuiz }) {
    return (
      <>
        <Text testID="loading">{loadingProgress ? 'loading' : 'ready'}</Text>
        {quizSets.map((it) => (
          <React.Fragment key={it.id}>
            <Text testID={`item-${it.id}`}>{JSON.stringify(it)}</Text>
            <Text testID={`press-${it.id}`} onPress={() => onSelectQuiz(it)}>Open</Text>
          </React.Fragment>
        ))}
        {/* trigger invalid path explicitly */}
        <Text
          testID="press-invalid"
          onPress={() => onSelectQuiz({ id: 'cat5_hard_set2', difficulty: 'hard', displayIndex: 99 })}
        >
          Open Invalid
        </Text>
      </>
    );
  };
});

import React from 'react';
import { Alert } from 'react-native';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import QuizSetContainer from '../containers/QuizSetContainer';

const wrap = (ui) => (
  <SafeAreaProvider>
    <NavigationContainer>{ui}</NavigationContainer>
  </SafeAreaProvider>
);

const makeNav = () => ({
  navigate: jest.fn(),
  dispatch: jest.fn(),
  addListener: jest.fn(() => () => {}),
});

const mkQs = (n) =>
  Array.from({ length: n }, (_, i) => ({
    question: `Q${i + 1}`,
    correct_answer: 'A',
    incorrect_answers: ['B', 'C', 'D'],
  }));

beforeEach(() => {
  jest.clearAllMocks();
  jest.useFakeTimers();

  // reset and populate quizSetMap (keep same ref)
  Object.keys(mockQuizSetMap).forEach((k) => delete mockQuizSetMap[k]);
  Object.assign(mockQuizSetMap, {
    'cat5_easy_set1':   { results: mkQs(10) }, // included
    'cat5_easy_set2':   { results: mkQs(7) },  // filtered (<8)
    'cat5_medium_set1': { results: mkQs(9) },  // included
    'cat5_medium_set2': { results: mkQs(8) },  // included
    'cat5_hard_set1':   { results: mkQs(12) }, // included
    // 'cat5_hard_set2' missing -> invalid
  });

  // completed history rows (only mark sets that actually exist & have >=8)
  mockHistoryRows = [
    { quiz_set_id: 'cat5_easy_set1' },
    { quiz_set_id: 'cat5_hard_set1' },
    { quiz_set_id: 'cat5_easy_set2' }, // ignored (filtered by length)
  ];
});

afterEach(() => {
  jest.useRealTimers();
});

const flushFocusWork = async (ms = 600) => {
  // container sets loading false after 500ms timeout; give it a bit more
  await act(async () => { jest.advanceTimersByTime(ms); });
  await act(async () => { jest.runOnlyPendingTimers(); });
  await act(async () => {}); // drain microtasks
  await act(async () => Promise.resolve());
};

test('builds filtered list with sequential displayIndex and completion flags', async () => {
  const navigation = makeNav();
  const category = { id: 5, title: 'General Knowledge' };

  const { getByTestId } = render(
    wrap(<QuizSetContainer route={{ params: { category } }} navigation={navigation} />)
  );

  // initially loading...
  expect(getByTestId('loading').props.children).toBe('loading');

  await flushFocusWork(); // finish fetch + delay

  await waitFor(() =>
    expect(getByTestId('loading').props.children).toBe('ready')
  );

  const parse = (id) => JSON.parse(getByTestId(`item-${id}`).props.children);

  const easy1   = parse('cat5_easy_set1');
  const med1    = parse('cat5_medium_set1');
  const med2    = parse('cat5_medium_set2');
  const hard1   = parse('cat5_hard_set1');

  // present (>=8) and in order easy -> medium1 -> medium2 -> hard1
  expect(easy1.displayIndex).toBe(1);
  expect(med1.displayIndex).toBe(2);
  expect(med2.displayIndex).toBe(3);
  expect(hard1.displayIndex).toBe(4);

  // completion flags from history
  expect(easy1.completed).toBe(true);
  expect(hard1.completed).toBe(true);
  expect(med1.completed).toBe(false);
  expect(med2.completed).toBe(false);

  // time strings by difficulty
  expect(easy1.time).toBe('60 sec / Qs');
  expect(med1.time).toBe('45 sec / Qs');
  expect(hard1.time).toBe('30 sec / Qs');
});

test('selecting a set navigates to QuizContainer with correct payload', async () => {
  const navigation = makeNav();
  const category = { id: 5, title: 'General Knowledge' };

  const { getByTestId } = render(
    wrap(<QuizSetContainer route={{ params: { category } }} navigation={navigation} />)
  );

  await flushFocusWork();

  // Open medium_set2 (has displayIndex 3)
  fireEvent.press(getByTestId('press-cat5_medium_set2'));

  expect(navigation.navigate).toHaveBeenCalledWith(
    'QuizContainer',
    expect.objectContaining({
      quizSetId: 'cat5_medium_set2',
      difficulty: 'Medium',
      quizTitle: '#3 General Knowledge',
      questions: expect.any(Array),
    })
  );
  const payload = navigation.navigate.mock.calls[0][1];
  expect(payload.questions).toHaveLength(8);
});

test('invalid set shows alert without navigating', async () => {
  const navigation = makeNav();
  const category = { id: 5, title: 'General Knowledge' };
  const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => {});

  const { getByTestId } = render(
    wrap(<QuizSetContainer route={{ params: { category } }} navigation={navigation} />)
  );

  await flushFocusWork();

  fireEvent.press(getByTestId('press-invalid'));

  expect(alertSpy).toHaveBeenCalled();
  expect(navigation.navigate).not.toHaveBeenCalled();

  alertSpy.mockRestore();
});
