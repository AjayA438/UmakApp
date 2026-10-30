import Toast from 'react-native-toast-message';
import { Alert } from 'react-native';

/** Tiny helpers so every screen reports feedback the same way. */
export const toast = {
  success: (text1, text2) => Toast.show({ type: 'success', text1, text2 }),
  error: (text1, text2) => Toast.show({ type: 'error', text1, text2 }),
  info: (text1, text2) => Toast.show({ type: 'info', text1, text2 }),
};

/** Cross-platform confirmation dialog (destructive actions turn red). */
export const confirmAction = (title, message, onConfirm, { confirmLabel = 'Confirm', destructive = false } = {}) =>
  Alert.alert(title, message, [
    { text: 'Cancel', style: 'cancel' },
    { text: confirmLabel, style: destructive ? 'destructive' : 'default', onPress: onConfirm },
  ]);
