import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Tipos de feedback háptico
export type HapticType = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' | 'selection';

/**
 * Ejecuta feedback háptico según el tipo especificado
 */
export const triggerHaptic = async (type: HapticType = 'medium'): Promise<void> => {
  try {
    switch (type) {
      case 'light':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'medium':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'heavy':
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'success':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'warning':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case 'error':
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      case 'selection':
        await Haptics.selectionAsync();
        break;
      default:
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  } catch (error) {
    // Silently fail if haptics are not available
    console.log('Haptics not available:', error);
  }
};

/**
 * Feedback háptico para recepción de dinero (muy satisfactorio)
 */
export const triggerMoneyReceivedHaptic = async (): Promise<void> => {
  try {
    // Secuencia de haptics para simular "dinero cayendo"
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, 100);
    setTimeout(async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 200);
  } catch (error) {
    console.log('Haptics not available:', error);
  }
};

/**
 * Feedback háptico para botones de acción
 */
export const triggerButtonHaptic = async (): Promise<void> => {
  await triggerHaptic('light');
};

/**
 * Feedback háptico para errores
 */
export const triggerErrorHaptic = async (): Promise<void> => {
  await triggerHaptic('error');
};

/**
 * Feedback háptico para éxito
 */
export const triggerSuccessHaptic = async (): Promise<void> => {
  await triggerHaptic('success');
};

/**
 * Feedback háptico para selección de elementos
 */
export const triggerSelectionHaptic = async (): Promise<void> => {
  await triggerHaptic('selection');
};
