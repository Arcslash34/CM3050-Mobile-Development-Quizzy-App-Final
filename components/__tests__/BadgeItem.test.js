// components/__tests__/BadgeItem.test.js

/**
 * Unit test scope:
 * - Exercises the BadgeItem component in isolation (no native bridge).
 * - Replaces React Native primitives with a minimal, pure-JS mock to keep tests hermetic.
 * - Verifies text rendering, progress-bar width calculation, and locked/unlocked interactions.
 */

/**
 * Custom, minimal mock of 'react-native':
 * - Uses deep imports for View/Text to avoid DevMenu/TurboModule side effects.
 * - Supplies StyleSheet.create/flatten for style assertions (supports array styles).
 * - Provides lightweight Image and Pressable stand-ins that preserve props.
 */
jest.mock('react-native', () => {
  const React = require('react');

  // Deep imports to avoid DevMenu/TurboModule side effects
  const ViewModule = require('react-native/Libraries/Components/View/View');
  const TextModule = require('react-native/Libraries/Text/Text');
  const View = ViewModule && ViewModule.default ? ViewModule.default : ViewModule;
  const Text = TextModule && TextModule.default ? TextModule.default : TextModule;

  const StyleSheet = {
    create: (styles) => styles,
    flatten: (input) => {
      if (!input) return {};
      if (Array.isArray(input)) {
        return input.reduce((acc, s) => Object.assign(acc, StyleSheet.flatten(s)), {});
      }
      return input;
    },
  };

  // Stand-ins that render as Views; enable event/style inspection without native code
  const Image = (props) => React.createElement(View, props);
  const Pressable = ({ onPress, children, ...rest }) =>
    React.createElement(View, { onPress, ...rest }, children);

  return { View, Text, StyleSheet, Image, Pressable };
});

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import BadgeItem from '../BadgeItem';

/** Helper to create a consistent badge item payload. */
const makeItem = (overrides = {}) => ({
  id: 'badge-1',
  title: 'Marathon Learner',
  description: 'Complete 30 quizzes',
  badge: 'fake.png',
  ...overrides,
});

describe('BadgeItem', () => {
  const onPress = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders title, description, and percent; progress bar width matches progress', () => {
    const item = makeItem();
    const progress = 0.75;

    const { getByText, UNSAFE_getAllByType } = render(
      <BadgeItem item={item} progress={progress} onPress={onPress} />
    );

    // Text content assertions
    expect(getByText('Marathon Learner')).toBeTruthy();
    expect(getByText('Complete 30 quizzes')).toBeTruthy();
    expect(getByText('75%')).toBeTruthy();

    // Progress bar fill width style equals `${progress * 100}%`
    const views = UNSAFE_getAllByType(View);
    const fill = views.find(v => {
      const s = StyleSheet.flatten(v.props.style);
      return s && s.height === 6 && s.backgroundColor === '#00FF7F';
    });
    expect(fill).toBeTruthy();
    const fillStyle = StyleSheet.flatten(fill.props.style);
    expect(fillStyle.width).toBe('75%');
  });

  it('applies locked styling and blocks onPress when progress < 1', () => {
    const item = makeItem();
    const { UNSAFE_getByType, getByText } = render(
      <BadgeItem item={item} progress={0.3} onPress={onPress} />
    );

    // Locked badge image uses reduced opacity
    const img = UNSAFE_getByType(Image);
    const imgStyle = StyleSheet.flatten(img.props.style);
    expect(imgStyle.opacity).toBe(0.25);

    // Locked title uses muted color
    const title = getByText(item.title);
    const titleStyle = StyleSheet.flatten(title.props.style);
    expect(titleStyle.color).toBe('#aaa');

    // Press should be ignored in locked state
    const rootPressable = UNSAFE_getByType(Pressable);
    fireEvent.press(rootPressable);
    expect(onPress).not.toHaveBeenCalled();
  });

  it('applies unlocked styling and triggers onPress with item when progress === 1', () => {
    const item = makeItem();
    const { UNSAFE_getByType, getByText } = render(
      <BadgeItem item={item} progress={1} onPress={onPress} />
    );

    // Unlocked badge image uses full opacity
    const img = UNSAFE_getByType(Image);
    const imgStyle = StyleSheet.flatten(img.props.style);
    expect(imgStyle.opacity).toBe(1);

    // Unlocked title uses bright color
    const title = getByText(item.title);
    const titleStyle = StyleSheet.flatten(title.props.style);
    expect(titleStyle.color).toBe('#fff');

    // Press should call onPress with the badge item
    const rootPressable = UNSAFE_getByType(Pressable);
    fireEvent.press(rootPressable);
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onPress).toHaveBeenCalledWith(item);
  });
});
