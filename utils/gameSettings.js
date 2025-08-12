// utils/gameSettings.js
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Check if game sound is enabled.
 * Reads from AsyncStorage key 'soundEnabled'.
 * Returns true if:
 *  - No value has been stored yet (default behavior)
 *  - Stored value is 'true'
 */
export const isSoundEnabled = async () => {
  const val = await AsyncStorage.getItem('soundEnabled');
  return val === null || val === 'true'; // default to true if not set
};

/**
 * Check if vibration is enabled.
 * Reads from AsyncStorage key 'vibrationEnabled'.
 * Returns true if:
 *  - No value has been stored yet (default behavior)
 *  - Stored value is 'true'
 */
export const isVibrationEnabled = async () => {
  const val = await AsyncStorage.getItem('vibrationEnabled');
  return val === null || val === 'true'; // default to true if not set
};
