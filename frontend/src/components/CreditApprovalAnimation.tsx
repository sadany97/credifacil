// CrediFácil - Animación celebratoria cuando el crédito es aprobado
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Animated,
  Easing,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

const { width, height } = Dimensions.get('window');

interface ConfettiPiece {
  x: Animated.Value;
  y: Animated.Value;
  rotate: Animated.Value;
  color: string;
  size: number;
}

interface CreditApprovalAnimationProps {
  visible: boolean;
  onClose: () => void;
  userName: string;
  amount?: number;
  statusType?: 'aprobado' | 'aprobado_garantia' | 'aprobado_mensualidad' | 'credito_otorgado';
}

const CONFETTI_COLORS = ['#4CAF50', '#81C784', '#FFD700', '#FFC107', '#1976D2', '#42A5F5'];

export const CreditApprovalAnimation: React.FC<CreditApprovalAnimationProps> = ({
  visible,
  onClose,
  userName,
  amount,
  statusType = 'aprobado',
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const checkAnim = useRef(new Animated.Value(0)).current;
  const confettiPieces = useRef<ConfettiPiece[]>([]);
  const [showContent, setShowContent] = useState(false);

  // Generar piezas de confetti
  useEffect(() => {
    confettiPieces.current = Array.from({ length: 30 }, () => ({
      x: new Animated.Value(Math.random() * width),
      y: new Animated.Value(-50),
      rotate: new Animated.Value(0),
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      size: Math.random() * 10 + 5,
    }));
  }, []);

  useEffect(() => {
    if (visible) {
      setShowContent(true);
      // Reset animations
      scaleAnim.setValue(0);
      rotateAnim.setValue(0);
      fadeAnim.setValue(0);
      checkAnim.setValue(0);

      // Animación de entrada
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 40,
          friction: 6,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();

      // Animación del check
      Animated.sequence([
        Animated.delay(300),
        Animated.spring(checkAnim, {
          toValue: 1,
          tension: 50,
          friction: 5,
          useNativeDriver: true,
        }),
      ]).start();

      // Animación de pulso continua
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
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

      // Animación de rotación de estrellas
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 15000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      // Animar confetti
      confettiPieces.current.forEach((piece, index) => {
        piece.y.setValue(-50);
        piece.rotate.setValue(0);
        
        Animated.parallel([
          Animated.timing(piece.y, {
            toValue: height + 50,
            duration: 3000 + Math.random() * 2000,
            delay: index * 100,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(piece.rotate, {
            toValue: 360 * (Math.random() > 0.5 ? 1 : -1),
            duration: 3000,
            delay: index * 100,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
        ]).start();
      });

      // Auto cerrar después de 5 segundos
      const timer = setTimeout(() => {
        onClose();
      }, 5000);

      return () => clearTimeout(timer);
    } else {
      setShowContent(false);
    }
  }, [visible]);

  const rotate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const getStatusMessage = () => {
    switch (statusType) {
      case 'aprobado':
        return '¡Tu crédito ha sido aprobado!';
      case 'aprobado_garantia':
        return '¡Crédito aprobado con garantía!';
      case 'aprobado_mensualidad':
        return '¡Crédito aprobado con mensualidades!';
      case 'credito_otorgado':
        return '¡Tu crédito ha sido depositado!';
      default:
        return '¡Felicidades!';
    }
  };

  const getStatusIcon = () => {
    switch (statusType) {
      case 'aprobado':
        return 'checkmark-circle';
      case 'aprobado_garantia':
        return 'shield-checkmark';
      case 'aprobado_mensualidad':
        return 'calendar-outline';
      case 'credito_otorgado':
        return 'cash';
      default:
        return 'checkmark-circle';
    }
  };

  if (!showContent) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        {/* Confetti */}
        {confettiPieces.current.map((piece, index) => (
          <Animated.View
            key={index}
            style={[
              styles.confetti,
              {
                transform: [
                  { translateX: piece.x },
                  { translateY: piece.y },
                  { rotate: piece.rotate.interpolate({
                    inputRange: [0, 360],
                    outputRange: ['0deg', '360deg'],
                  })},
                ],
                backgroundColor: piece.color,
                width: piece.size,
                height: piece.size,
              },
            ]}
          />
        ))}

        <Animated.View
          style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Estrellas rotando */}
          <Animated.View
            style={[
              styles.starsContainer,
              { transform: [{ rotate }] },
            ]}
          >
            <Ionicons name="star" size={24} color="#FFD700" style={styles.star1} />
            <Ionicons name="star" size={18} color="#FFC107" style={styles.star2} />
            <Ionicons name="star" size={20} color="#FFD700" style={styles.star3} />
            <Ionicons name="star" size={16} color="#FFC107" style={styles.star4} />
          </Animated.View>

          {/* Ícono principal animado */}
          <Animated.View
            style={[
              styles.iconContainer,
              {
                transform: [
                  { scale: Animated.multiply(pulseAnim, checkAnim) },
                ],
              },
            ]}
          >
            <View style={styles.iconOuter}>
              <View style={styles.iconInner}>
                <Ionicons name={getStatusIcon() as any} size={50} color="#FFFFFF" />
              </View>
            </View>
          </Animated.View>

          {/* Badge de éxito */}
          <View style={styles.successBadge}>
            <Ionicons name="trophy" size={14} color="#FFD700" />
            <Text style={styles.successBadgeText}>¡FELICIDADES!</Text>
          </View>

          {/* Nombre del usuario */}
          <Text style={styles.userName}>{userName}</Text>

          {/* Mensaje de estado */}
          <Text style={styles.statusMessage}>{getStatusMessage()}</Text>

          {/* Monto si está disponible */}
          {amount && amount > 0 && (
            <View style={styles.amountContainer}>
              <Text style={styles.amountLabel}>Monto aprobado</Text>
              <Text style={styles.amountValue}>
                ${amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          )}

          {/* Mensaje motivacional */}
          <View style={styles.messageBox}>
            <Text style={styles.messageText}>
              {statusType === 'credito_otorgado' 
                ? 'El monto ha sido depositado a tu cuenta bancaria. ¡Gracias por confiar en CrediFácil!'
                : 'Pronto recibirás tu dinero. ¡Gracias por confiar en CrediFácil!'
              }
            </Text>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <View style={styles.footerBadge}>
              <Ionicons name="shield-checkmark" size={12} color={COLORS.success} />
              <Text style={styles.footerText}>CrediFácil - Al alcance de todos</Text>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confetti: {
    position: 'absolute',
    borderRadius: 2,
  },
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 28,
    padding: 30,
    width: '90%',
    maxWidth: 360,
    alignItems: 'center',
    overflow: 'hidden',
  },
  starsContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  star1: {
    position: 'absolute',
    top: 20,
    left: 30,
  },
  star2: {
    position: 'absolute',
    top: 40,
    right: 40,
  },
  star3: {
    position: 'absolute',
    top: 100,
    left: 20,
  },
  star4: {
    position: 'absolute',
    top: 80,
    right: 25,
  },
  iconContainer: {
    marginBottom: 20,
    zIndex: 10,
  },
  iconOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: COLORS.success + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 15,
  },
  successBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 12,
  },
  successBadgeText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#F57C00',
    letterSpacing: 1.5,
  },
  userName: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  statusMessage: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.success,
    marginBottom: 20,
    textAlign: 'center',
  },
  amountContainer: {
    backgroundColor: COLORS.success + '10',
    borderRadius: 16,
    padding: 16,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: COLORS.success + '30',
  },
  amountLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: '800',
    color: COLORS.success,
  },
  messageBox: {
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 16,
    width: '100%',
    marginBottom: 16,
  },
  messageText: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 22,
  },
  footer: {
    marginTop: 8,
  },
  footerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
});

export default CreditApprovalAnimation;
