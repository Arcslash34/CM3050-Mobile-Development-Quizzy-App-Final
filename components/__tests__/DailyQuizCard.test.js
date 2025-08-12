// components/__tests__/DailyQuizCard.test.js

/**
 * Unit test scope:
 * - Exercises DailyQuizCard in isolation (no native bridge).
 * - Replaces React Native primitives with a minimal, pure-JS mock to keep tests hermetic.
 * - Verifies text rendering, press callback, and core style expectations.
 */

/**
 * Custom, minimal mock of 'react-native':
 * - Uses deep imports for View/Text to avoid DevMenu/TurboModule side effects.
 * - Supplies StyleSheet.create/flatten so style assertions (including array styles) are possible.
 * - Provides lightweight TouchableOpacity/ImageBackground stand-ins that preserve props and support event checks.
 */
// Minimal, safe mock of react-native for this component
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

  const TouchableOpacity = ({ onPress, children, ...rest }) =>
    React.createElement(View, { onPress, ...rest }, children);

  const ImageBackground = ({ source, style, imageStyle, children, ...rest }) =>
    React.createElement(View, { source, style, imageStyle, ...rest }, children);

  return { View, Text, TouchableOpacity, ImageBackground, StyleSheet };
});

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { TouchableOpacity, ImageBackground, StyleSheet } from 'react-native';
import DailyQuizCard from '../DailyQuizCard';

describe('DailyQuizCard', () => {
  const onPress = jest.fn();

  beforeEach(() => jest.clearAllMocks());

  // Ensures primary text content is rendered
  it('renders title, subtitle, and button text', () => {
    const { getByText } = render(<DailyQuizCard onPress={onPress} />);

    expect(getByText('Daily Quiz')).toBeTruthy();
    expect(getByText('Everyday Learn & Play')).toBeTruthy();
    expect(getByText('Start Quiz')).toBeTruthy();
  });

  // Verifies button press invokes the provided handler
  it('calls onPress when button is pressed', () => {
    const { getByText, UNSAFE_getByType } = render(<DailyQuizCard onPress={onPress} />);

    // Find TouchableOpacity by type
    const button = UNSAFE_getByType(TouchableOpacity);
    fireEvent.press(button);
    expect(onPress).toHaveBeenCalledTimes(1);

    // Ensure button text is correct
    expect(getByText('Start Quiz')).toBeTruthy();
  });

  // Confirms key style attributes on the card and its button
  it('applies expected styles to card and button', () => {
    const { UNSAFE_getByType } = render(<DailyQuizCard onPress={onPress} />);

    // Card (ImageBackground)
    const card = UNSAFE_getByType(ImageBackground);
    const cardStyle = StyleSheet.flatten(card.props.style);
    expect(cardStyle.borderRadius).toBe(16);
    expect(cardStyle.padding).toBe(20);
    expect(cardStyle.marginTop).toBe(20);

    // Button
    const button = UNSAFE_getByType(TouchableOpacity);
    const btnStyle = StyleSheet.flatten(button.props.style);
    expect(btnStyle.backgroundColor).toBe('#fff');
    expect(btnStyle.borderRadius).toBe(8);
  });
});
