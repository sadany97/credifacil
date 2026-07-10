import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Vibration,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');

interface PinScreenProps {
  mode: 'create' | 'verify' | 'confirm';
  onSuccess: (pin: string) => void;
  onCancel?: () => void;
  title?: string;
}

export const PinScreen: React.FC<PinScreenProps> = ({
  mode,
  onSuccess,
  onCancel,
  title,
}) => {
  const { colors } = useTheme();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [error, setError] = useState('');
  
  const shakeX = useSharedValue(0);

  const shake = () => {
    shakeX.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
    Vibration.vibrate(200);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const handleNumberPress = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      setError('');

      if (newPin.length === 4) {
        setTimeout(() => handlePinComplete(newPin), 200);
      }
    }
  };

  const handleDelete = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
    }
  };

  const handlePinComplete = (completedPin: string) => {
    if (mode === 'create') {
      if (step === 'enter') {
        setConfirmPin(completedPin);
        setPin('');
        setStep('confirm');
      } else {
        if (completedPin === confirmPin) {
          onSuccess(completedPin);
        } else {
          setError('Los PINs no coinciden');
          shake();
          setPin('');
          setStep('enter');
          setConfirmPin('');
        }
      }
    } else {
      onSuccess(completedPin);
    }
  };

  const getTitle = () => {
    if (title) return title;
    if (mode === 'create') {
      return step === 'enter' ? 'Crear PIN de seguridad' : 'Confirma tu PIN';
    }
    return 'Ingresa tu PIN';
  };

  const numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'delete'];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        {onCancel && (
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Ionicons name="close" size={28} color={colors.text} />
          </TouchableOpacity>
        )}
        <View style={styles.logoContainer}>
          <View style={[styles.logoBox, { backgroundColor: colors.accent }]}>
            <Ionicons name="lock-closed" size={32} color={colors.primary} />
          </View>
        </View>
        <Text style={[styles.title, { color: colors.text }]}>{getTitle()}</Text>
        <Text style={[styles.subtitle, { color: colors.textMuted }]}>
          {mode === 'create' 
            ? 'Crea un PIN de 4 dígitos para proteger tu cuenta'
            : 'Ingresa tu PIN para continuar'}
        </Text>
      </View>

      <Animated.View style={[styles.dotsContainer, animatedStyle]}>
        {[0, 1, 2, 3].map((i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: i < pin.length ? colors.accent : colors.border,
                borderColor: i < pin.length ? colors.accent : colors.border,
              },
            ]}
          />
        ))}
      </Animated.View>

      {error ? (
        <Text style={[styles.errorText, { color: colors.danger }]}>{error}</Text>
      ) : (
        <View style={styles.errorPlaceholder} />
      )}

      <View style={styles.keypad}>
        {numbers.map((num, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.key,
              num === '' && styles.keyEmpty,
              { backgroundColor: num ? colors.card : 'transparent' },
            ]}
            onPress={() => {
              if (num === 'delete') {
                handleDelete();
              } else if (num !== '') {
                handleNumberPress(num);
              }
            }}
            disabled={num === ''}
            activeOpacity={0.7}
          >
            {num === 'delete' ? (
              <Ionicons name="backspace-outline" size={28} color={colors.text} />
            ) : (
              <Text style={[styles.keyText, { color: colors.text }]}>{num}</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  cancelButton: {
    position: 'absolute',
    top: 0,
    right: 20,
    padding: 10,
  },
  logoContainer: {
    marginBottom: 20,
  },
  logoBox: {
    width: 70,
    height: 70,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
    marginBottom: 20,
    gap: 20,
  },
  dot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    height: 20,
  },
  errorPlaceholder: {
    height: 20,
  },
  keypad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 40,
    marginTop: 30,
    gap: 15,
  },
  key: {
    width: (width - 120) / 3,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  keyEmpty: {
    shadowOpacity: 0,
    elevation: 0,
  },
  keyText: {
    fontSize: 28,
    fontWeight: '600',
  },
});

export default PinScreen;
