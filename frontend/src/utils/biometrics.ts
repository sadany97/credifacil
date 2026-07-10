import * as LocalAuthentication from 'expo-local-authentication';
import { Platform, Alert, Linking } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const BIOMETRIC_ENABLED_KEY = '@credifacil_biometric_enabled';
const BIOMETRIC_EMAIL_KEY = '@credifacil_biometric_email';

export interface BiometricResult {
  success: boolean;
  error?: string;
  biometricType?: string;
}

export const checkBiometricAvailability = async (): Promise<{
  available: boolean;
  biometricType: string;
  enrolled: boolean;
  hardwareExists: boolean;
}> => {
  try {
    // Verificar si hay hardware biométrico
    const compatible = await LocalAuthentication.hasHardwareAsync();
    console.log('[Biometrics] Hardware compatible:', compatible);
    
    if (!compatible) {
      console.log('[Biometrics] No hay hardware biométrico');
      return { available: false, biometricType: 'none', enrolled: false, hardwareExists: false };
    }

    // Verificar si hay biometría registrada
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    console.log('[Biometrics] Enrolled:', enrolled);

    // Obtener tipos de autenticación soportados
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    console.log('[Biometrics] Types:', types);
    
    let biometricType = 'Biométrico';
    
    // En Android, la huella digital es más común
    if (Platform.OS === 'android') {
      if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        biometricType = 'Huella Digital';
      } else if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        biometricType = 'Reconocimiento Facial';
      }
    } else {
      // iOS
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
        biometricType = 'Face ID';
      } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
        biometricType = 'Touch ID';
      }
    }

    // Si el hardware existe pero no está configurado
    if (!enrolled) {
      console.log('[Biometrics] Hardware existe pero no hay biometría configurada');
      return { available: false, biometricType, enrolled: false, hardwareExists: true };
    }

    console.log('[Biometrics] Biometría disponible:', biometricType);
    return { available: true, biometricType, enrolled: true, hardwareExists: true };
  } catch (error) {
    console.error('[Biometrics] Error checking availability:', error);
    return { available: false, biometricType: 'none', enrolled: false, hardwareExists: false };
  }
};

export const authenticateWithBiometrics = async (): Promise<BiometricResult> => {
  try {
    const { available, biometricType, enrolled, hardwareExists } = await checkBiometricAvailability();
    
    // Si no hay hardware o no está disponible
    if (!hardwareExists) {
      return { 
        success: false, 
        error: 'Tu dispositivo no cuenta con sensor biométrico' 
      };
    }

    // Si hay hardware pero no está configurado
    if (!enrolled) {
      return { 
        success: false, 
        error: `Para usar ${biometricType}, primero debes configurar tu huella digital o reconocimiento facial en los ajustes de tu dispositivo.` 
      };
    }

    if (!available) {
      return { 
        success: false, 
        error: 'La autenticación biométrica no está disponible' 
      };
    }

    // Solicitar autenticación biométrica
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: `Verificar con ${biometricType}`,
      cancelLabel: 'Cancelar',
      fallbackLabel: 'Usar contraseña',
      disableDeviceFallback: false,
      // En Android, esto es importante para mostrar el diálogo correcto
      requireConfirmation: Platform.OS === 'android',
    });

    console.log('[Biometrics] Auth result:', result);

    if (result.success) {
      return { success: true, biometricType };
    } else {
      let errorMessage = 'Autenticación fallida';
      if (result.error === 'user_cancel') {
        errorMessage = 'Autenticación cancelada';
      } else if (result.error === 'user_fallback') {
        errorMessage = 'fallback';
      } else if (result.error === 'system_cancel') {
        errorMessage = 'Sistema canceló la autenticación';
      } else if (result.error === 'lockout') {
        errorMessage = 'Demasiados intentos fallidos. Intenta más tarde.';
      } else if ((result.error as string) === 'lockout_permanent') {
        errorMessage = 'Sensor biométrico bloqueado. Reinicia tu dispositivo.';
      } else if (result.error === 'not_enrolled') {
        errorMessage = 'No hay huella digital registrada en este dispositivo.';
      }
      return { success: false, error: errorMessage };
    }
  } catch (error: any) {
    console.error('[Biometrics] Authentication error:', error);
    return { success: false, error: error.message || 'Error de autenticación biométrica' };
  }
};

export const promptBiometricSetup = (biometricType: string): void => {
  Alert.alert(
    `Configurar ${biometricType}`,
    `Para usar ${biometricType} en esta app, primero debes registrar tu huella digital o rostro en la configuración de seguridad de tu dispositivo.`,
    [
      { text: 'Cancelar', style: 'cancel' },
      { 
        text: 'Abrir Ajustes', 
        onPress: () => {
          if (Platform.OS === 'android') {
            Linking.openSettings();
          } else {
            Linking.openURL('App-Prefs:root=TOUCHID_PASSCODE');
          }
        }
      }
    ]
  );
};

export const saveBiometricCredentials = async (email: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
    await AsyncStorage.setItem(BIOMETRIC_EMAIL_KEY, email);
  } catch (error) {
    console.error('Error saving biometric credentials:', error);
  }
};

export const getBiometricCredentials = async (): Promise<{ enabled: boolean; email: string | null }> => {
  try {
    const enabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
    const email = await AsyncStorage.getItem(BIOMETRIC_EMAIL_KEY);
    return { enabled: enabled === 'true', email };
  } catch (error) {
    console.error('Error getting biometric credentials:', error);
    return { enabled: false, email: null };
  }
};

export const clearBiometricCredentials = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(BIOMETRIC_ENABLED_KEY);
    await AsyncStorage.removeItem(BIOMETRIC_EMAIL_KEY);
  } catch (error) {
    console.error('Error clearing biometric credentials:', error);
  }
};

export const isBiometricEnabled = async (): Promise<boolean> => {
  try {
    const enabled = await AsyncStorage.getItem(BIOMETRIC_ENABLED_KEY);
    return enabled === 'true';
  } catch (error) {
    return false;
  }
};
