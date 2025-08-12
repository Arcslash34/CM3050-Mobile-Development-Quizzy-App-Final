// components/__tests__/AvatarModal.test.js

/**
 * Unit test scope:
 * - Exercises the AvatarModal component in isolation (no native bridge).
 * - Replaces React Native primitives with a minimal, pure-JS mock to keep tests hermetic.
 * - Avoids importing the full 'react-native' module to prevent environment-specific crashes.
 * - Verifies three behaviors: loading spinner visibility, overlay-close interaction, and conditional render.
 */

/**
 * Custom, minimal mock of react-native:
 * - Provides View, StyleSheet, Modal, ActivityIndicator, Image, and Pressable with deterministic behavior.
 * - StyleSheet.flatten is implemented to support array styles in assertions.
 * - Modal renders children only when `visible` is true (mirrors native semantics for this test).
 * - Pressable proxies onPress via a View so RTL can fire events without native dependencies.
 */
jest.mock('react-native', () => {
  const React = require('react');

  // Pull View from a safe deep path, unwrap default if needed
  const ViewModule = require('react-native/Libraries/Components/View/View');
  const View = ViewModule && ViewModule.default ? ViewModule.default : ViewModule;

  // Provide a minimal StyleSheet with create, absoluteFill, and flatten
  const StyleSheet = {
    create: (styles) => styles,
    absoluteFill: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0 },
    flatten: (input) => {
      if (!input) return {};
      if (Array.isArray(input)) {
        return input.reduce((acc, item) => {
          const flat = StyleSheet.flatten(item);
          return Object.assign(acc, flat);
        }, {});
      }
      return input;
    },
  };

  // Lightweight stand-ins that preserve props (style & handlers)
  const Modal = ({ visible, children }) =>
    visible ? React.createElement(View, null, children) : null;

  const ActivityIndicator = (props) => React.createElement(View, props);
  const Image = (props) => React.createElement(View, props);
  const Pressable = ({ onPress, children, ...rest }) =>
    React.createElement(View, { onPress, ...rest }, children);

  return {
    View,
    StyleSheet,
    Modal,
    ActivityIndicator,
    Image,
    Pressable,
  };
});

/**
 * Asset stub:
 * - Mocks the local image so Jest can resolve the import path without bundler context.
 */
jest.mock('../assets/images/profile.png', () => 'profile.png', { virtual: true });

import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ActivityIndicator, Image, Pressable } from 'react-native';
import AvatarModal from '../AvatarModal';

describe('AvatarModal', () => {
  const onClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('shows loader while image is loading and hides it after onLoad', () => {
    const { UNSAFE_getByType, UNSAFE_queryByType } = render(
      <AvatarModal visible={true} onClose={onClose} avatarUrl="https://example.com/a.png" />
    );

    // Loader visible initially (pre-image load state)
    expect(UNSAFE_getByType(ActivityIndicator)).toBeTruthy();

    const img = UNSAFE_getByType(Image);

    // Before onLoad: image is hidden via styles.hidden (0x0)
    const before = img.props.style;
    const flatBefore = Array.isArray(before) ? Object.assign({}, ...before) : before;
    expect(flatBefore.width).toBe(0);
    expect(flatBefore.height).toBe(0);

    // Simulate image load event → spinner should disappear and image becomes visible
    fireEvent(img, 'load');

    // Loader disappears
    expect(UNSAFE_queryByType(ActivityIndicator)).toBeNull();

    // After onLoad: visible (250x250) per component styles
    const after = img.props.style;
    const flatAfter = Array.isArray(after) ? Object.assign({}, ...after) : after;
    expect(flatAfter.width).toBe(250);
    expect(flatAfter.height).toBe(250);
  });

  it('invokes onClose when overlay is pressed', () => {
    const { UNSAFE_getByType } = render(
      <AvatarModal visible={true} onClose={onClose} avatarUrl="https://example.com/a.png" />
    );
    const overlay = UNSAFE_getByType(Pressable);
    fireEvent.press(overlay);
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not render when not visible', () => {
    const { UNSAFE_queryByType } = render(
      <AvatarModal visible={false} onClose={onClose} avatarUrl="https://example.com/a.png" />
    );
    expect(UNSAFE_queryByType(Pressable)).toBeNull();
    expect(UNSAFE_queryByType(ActivityIndicator)).toBeNull();
    expect(UNSAFE_queryByType(Image)).toBeNull();
  });
});
