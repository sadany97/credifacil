import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

interface ExtractionProgressProps {
  visible: boolean;
}

export const ExtractionProgress: React.FC<ExtractionProgressProps> = ({ visible }) => {
  const spinValue = useRef(new Animated.Value(0)).current;
  const pulseValue = useRef(new Animated.Value(1)).current;
  const progressValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Animación de rotación infinita
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();

      // Animación de pulso
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseValue, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseValue, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Animación de barra de progreso
      Animated.loop(
        Animated.sequence([
          Animated.timing(progressValue, {
            toValue: 1,
            duration: 3000,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.timing(progressValue, {
            toValue: 0,
            duration: 0,
            useNativeDriver: false,
          }),
        ])
      ).start();
    }
  }, [visible]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const progressWidth = progressValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  if (!visible) return null;

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        {/* Icono animado */}
        <View style={styles.iconSection}>
          <Animated.View style={[styles.outerCircle, { transform: [{ scale: pulseValue }] }]}>
            <Animated.View style={[styles.spinnerCircle, { transform: [{ rotate: spin }] }]}>
              <View style={styles.spinnerDot} />
            </Animated.View>
            <View style={styles.innerCircle}>
              <Ionicons name="wallet" size={32} color={COLORS.success} />
            </View>
          </Animated.View>
        </View>

        {/* Texto principal */}
        <Text style={styles.title}>Extracción en Progreso</Text>
        <Text style={styles.message}>
          Tu crédito se ha iniciado generando extracción de fondos
        </Text>

        {/* Barra de progreso animada */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <Animated.View style={[styles.progressFill, { width: progressWidth }]} />
          </View>
          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>Procesando...</Text>
            <Animated.Text style={styles.progressPercent}>
              En curso
            </Animated.Text>
          </View>
        </View>

        {/* Indicadores de estado */}
        <View style={styles.statusIndicators}>
          <View style={styles.statusItem}>
            <View style={[styles.statusDot, styles.statusDotActive]} />
            <Text style={styles.statusText}>Conexión establecida</Text>
          </View>
          <View style={styles.statusItem}>
            <View style={[styles.statusDot, styles.statusDotActive]} />
            <Text style={styles.statusText}>Verificación de cuenta</Text>
          </View>
          <View style={styles.statusItem}>
            <Animated.View style={[styles.statusDot, styles.statusDotProcessing, { transform: [{ scale: pulseValue }] }]} />
            <Text style={[styles.statusText, { color: COLORS.warning }]}>Extrayendo fondos...</Text>
          </View>
          <View style={styles.statusItem}>
            <View style={styles.statusDot} />
            <Text style={[styles.statusText, { color: COLORS.textMuted }]}>Transferencia a cuenta</Text>
          </View>
        </View>

        {/* Nota informativa */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={18} color={COLORS.accent} />
          <Text style={styles.infoText}>
            Este proceso puede tomar algunos minutos. No cierre la aplicación.
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    marginHorizontal: 20,
    marginVertical: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 1,
    borderColor: COLORS.success + '30',
  },
  card: {
    padding: 24,
    alignItems: 'center',
  },
  iconSection: {
    marginBottom: 20,
  },
  outerCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.success + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  spinnerCircle: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: 'transparent',
    borderTopColor: COLORS.success,
    borderRightColor: COLORS.success + '50',
  },
  spinnerDot: {
    position: 'absolute',
    top: -3,
    left: '50%',
    marginLeft: -6,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.success,
  },
  innerCircle: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.success + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.success,
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 24,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.success,
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  progressLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  progressPercent: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.success,
  },
  statusIndicators: {
    width: '100%',
    marginBottom: 20,
  },
  statusItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.border,
  },
  statusDotActive: {
    backgroundColor: COLORS.success,
  },
  statusDotProcessing: {
    backgroundColor: COLORS.warning,
  },
  statusText: {
    fontSize: 13,
    color: COLORS.text,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: COLORS.accent + '10',
    padding: 14,
    borderRadius: 12,
    width: '100%',
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: COLORS.textLight,
    lineHeight: 18,
  },
});

export default ExtractionProgress;
