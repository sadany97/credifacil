import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

interface WelcomeModalProps {
  visible: boolean;
  onClose: () => void;
  userName: string;
  statusMessage?: string;
  isNewUser?: boolean;
}

export const WelcomeModal: React.FC<WelcomeModalProps> = ({
  visible,
  onClose,
  userName,
  statusMessage,
  isNewUser = false,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      // Reset animations
      scaleAnim.setValue(0);
      rotateAnim.setValue(0);
      fadeAnim.setValue(0);

      // Start animations
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();

      // Pulse animation for the icon
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Rotate animation for decorative elements
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 20000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [visible]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const defaultMessage = isNewUser
    ? '¡Felicidades! Has iniciado exitosamente tu proceso de crédito de fondos. Nuestro equipo está trabajando para ti.'
    : statusMessage || 'Tu proceso de crédito está en curso. Pronto tendrás novedades.';

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Decorative rotating background */}
          <Animated.View
            style={[
              styles.decorativeCircle,
              { transform: [{ rotate }] },
            ]}
          >
            <View style={styles.decorativeDot1} />
            <View style={styles.decorativeDot2} />
            <View style={styles.decorativeDot3} />
          </Animated.View>

          {/* Main icon */}
          <Animated.View
            style={[
              styles.iconContainer,
              { transform: [{ scale: pulseAnim }] },
            ]}
          >
            <View style={styles.iconOuter}>
              <View style={styles.iconInner}>
                <Ionicons name="rocket" size={40} color="#FFFFFF" />
              </View>
            </View>
          </Animated.View>

          {/* Badge */}
          <View style={styles.badge}>
            <Ionicons name="checkmark-circle" size={14} color={COLORS.success} />
            <Text style={styles.badgeText}>PROCESO ACTIVO</Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>
            {isNewUser ? '¡Bienvenido!' : '¡Actualización!'}
          </Text>
          <Text style={styles.userName}>{userName}</Text>

          {/* Message */}
          <View style={styles.messageBox}>
            <View style={styles.messageIcon}>
              <Ionicons name="information-circle" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.messageText}>{defaultMessage}</Text>
          </View>

          {/* Status indicators */}
          <View style={styles.statusContainer}>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, styles.statusDotActive]} />
              <Text style={styles.statusText}>Cuenta verificada</Text>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, styles.statusDotActive]} />
              <Text style={styles.statusText}>Proceso iniciado</Text>
            </View>
            <View style={styles.statusItem}>
              <View style={[styles.statusDot, styles.statusDotPending]} />
              <Text style={styles.statusText}>En crédito</Text>
            </View>
          </View>

          {/* Close button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Text style={styles.closeButtonText}>Entendido</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Footer */}
          <Text style={styles.footer}>
            CrediFácil Financiero
          </Text>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 28,
    padding: 30,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    overflow: 'hidden',
  },
  decorativeCircle: {
    position: 'absolute',
    top: -50,
    width: 200,
    height: 200,
  },
  decorativeDot1: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent + '30',
  },
  decorativeDot2: {
    position: 'absolute',
    top: 60,
    right: 30,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary + '20',
  },
  decorativeDot3: {
    position: 'absolute',
    bottom: 40,
    left: 50,
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success + '40',
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconInner: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.success + '15',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 16,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.success,
    letterSpacing: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 4,
  },
  userName: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: 20,
  },
  messageBox: {
    flexDirection: 'row',
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  messageIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  messageText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textLight,
    lineHeight: 22,
  },
  statusContainer: {
    width: '100%',
    marginBottom: 24,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  statusDotActive: {
    backgroundColor: COLORS.success,
  },
  statusDotPending: {
    backgroundColor: COLORS.warning,
  },
  statusText: {
    fontSize: 14,
    color: COLORS.textLight,
    fontWeight: '500',
  },
  closeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 14,
    width: '100%',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  footer: {
    marginTop: 20,
    fontSize: 11,
    color: COLORS.textMuted,
    letterSpacing: 0.5,
  },
});

export default WelcomeModal;
