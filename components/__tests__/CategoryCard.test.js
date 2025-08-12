// components/__tests__/CategoryCard.test.js

/**
 * Unit test scope:
 * - Exercises CategoryCard in isolation (no native bridge).
 * - Replaces React Native primitives with a minimal, pure-JS mock to keep tests hermetic.
 * - Verifies rendering, press callback payload, variant-specific styles, and image props.
 */

/**
 * Custom, minimal mock of 'react-native':
 * - Uses deep imports for View/Text to avoid DevMenu/TurboModule side effects.
 * - Supplies StyleSheet.create/flatten so style assertions (including array styles) are possible.
 * - Provides lightweight Image/TouchableOpacity stand-ins that preserve props and allow event checks.
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

  // Lightweight stand-ins that keep props intact for style/event checks
  const Image = (props) => React.createElement(View, props);
  const TouchableOpacity = ({ onPress, children, ...rest }) =>
    React.createElement(View, { onPress, ...rest }, children);

  return { View, Text, Image, TouchableOpacity, StyleSheet };
});

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import CategoryCard from '../CategoryCard';

/** Helper to build a consistent category item payload. */
const makeItem = (overrides = {}) => ({
  id: 'cat-1',
  title: 'Geography',
  img: 'fake.png',
  ...overrides,
});

describe('CategoryCard', () => {
  const onPress = jest.fn();

  beforeEach(() => jest.clearAllMocks());

  it('renders title and calls onPress with item when pressed (default variant)', () => {
    const item = makeItem();

    const { getByText, UNSAFE_getByType } = render(
      <CategoryCard item={item} onPress={onPress} />
    );

    // Title visible
    expect(getByText('Geography')).toBeTruthy();

    // Press root
    const root = UNSAFE_getByType(TouchableOpacity);
    fireEvent.press(root);
    expect(onPress).toHaveBeenCalledTimes(1);
    expect(onPress).toHaveBeenCalledWith(item);

    // Default variant includes base card styles (width: '100%') and no cardAll margin
    const rootStyle = StyleSheet.flatten(root.props.style);
    expect(rootStyle.width).toBe('100%');   // <-- fixed
    expect(rootStyle.marginBottom).toBeUndefined();

    // Label default paddingVertical = 4
    const label = getByText('Geography');
    const labelStyle = StyleSheet.flatten(label.props.style);
    expect(labelStyle.paddingVertical).toBe(4);
  });

  it('applies "all" variant styles to card and label', () => {
    const item = makeItem();

    const { getByText, UNSAFE_getByType } = render(
      <CategoryCard item={item} onPress={onPress} variant="all" />
    );

    const root = UNSAFE_getByType(TouchableOpacity);
    const rootStyle = StyleSheet.flatten(root.props.style);
    expect(rootStyle.width).toBe('48%');
    expect(rootStyle.marginBottom).toBe(15);

    const label = getByText('Geography');
    const labelStyle = StyleSheet.flatten(label.props.style);
    expect(labelStyle.paddingVertical).toBe(6);
  });

  it('passes image source and base styles to Image', () => {
    const item = makeItem({ img: 'my-img.png' });

    const { UNSAFE_getAllByType } = render(
      <CategoryCard item={item} onPress={onPress} />
    );

    // First View inside image wrapper is the mocked Image
    const img = UNSAFE_getAllByType(Image)[0];
    expect(img.props.source).toBe('my-img.png');

    const style = StyleSheet.flatten(img.props.style);
    expect(style.width).toBe('100%');
    expect(style.height).toBe(100);
    expect(style.borderRadius).toBe(10);
  });
});
