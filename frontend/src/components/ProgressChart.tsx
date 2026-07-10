import React from 'react';
import Animated, { FadeIn, FadeInUp, FadeInDown, FadeInLeft, FadeInRight, FadeOut } from 'react-native-reanimated';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

const { width } = Dimensions.get('window');

interface ProgressChartProps {
  totalAmount: number;
  recoveredAmount: number;
  pendingAmount: number;
  progress: number; // 0-100
}

export const ProgressChart: React.FC<ProgressChartProps> = ({
  totalAmount,
  recoveredAmount,
  pendingAmount,
  progress,
}) => {
  const formatCurrency = (value: number) => {
    return '$' + value.toLocaleString('es-MX', { minimumFractionDigits: 0 });
  };

  return (
    <Animated.View entering={FadeInUp.springify()} style={styles.container}>
      <Text style={styles.title}>Progreso de Crédito</Text>
      
      {/* Circular Progress */}
      <View style={styles.circleContainer}>
        <View style={styles.circleOuter}>
          <View style={[styles.circleProgress, {
            borderTopColor: 'transparent',
            borderRightColor: progress > 25 ? COLORS.success : 'transparent',
            borderBottomColor: progress > 50 ? COLORS.success : 'transparent',
            borderLeftColor: progress > 75 ? COLORS.success : 'transparent',
            transform: [{ rotate: `${(progress / 100) * 360}deg` }],
          }]} />
          <View style={styles.circleInner}>
            <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
            <Text style={styles.progressLabel}>Completado</Text>
          </View>
        </View>
      </View>

      {/* Stats Grid */}
      <View style={styles.statsGrid}>
        <View style={[styles.statBox, { backgroundColor: COLORS.primary + '10' }]}>
          <View style={[styles.statIcon, { backgroundColor: COLORS.primary + '20' }]}>
            <Ionicons name="wallet" size={20} color={COLORS.primary} />
          </View>
          <Text style={styles.statLabel}>Total</Text>
          <Text style={[styles.statValue, { color: COLORS.primary }]}>{formatCurrency(totalAmount)}</Text>
        </View>

        <View style={[styles.statBox, { backgroundColor: COLORS.success + '10' }]}>
          <View style={[styles.statIcon, { backgroundColor: COLORS.success + '20' }]}>
            <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
          </View>
          <Text style={styles.statLabel}>Disponible</Text>
          <Text style={[styles.statValue, { color: COLORS.success }]}>{formatCurrency(recoveredAmount)}</Text>
        </View>

        <View style={[styles.statBox, { backgroundColor: COLORS.warning + '10' }]}>
          <View style={[styles.statIcon, { backgroundColor: COLORS.warning + '20' }]}>
            <Ionicons name="time" size={20} color={COLORS.warning} />
          </View>
          <Text style={styles.statLabel}>Pendiente</Text>
          <Text style={[styles.statValue, { color: COLORS.warning }]}>{formatCurrency(pendingAmount)}</Text>
        </View>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View style={styles.progressBarBg}>
          <Animated.View 
            style={[styles.progressBarFill, { 
              width: `${progress}%`,
            }]} 
          />
        </View>
        <View style={styles.progressBarLabels}>
          <Text style={styles.progressBarLabel}>0%</Text>
          <Text style={styles.progressBarLabel}>50%</Text>
          <Text style={styles.progressBarLabel}>100%</Text>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
    color: COLORS.text,
  },
  circleContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  circleOuter: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 12,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  circleProgress: {
    position: 'absolute',
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 12,
    borderColor: COLORS.success,
  },
  circleInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressPercent: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.success,
  },
  progressLabel: {
    fontSize: 12,
    marginTop: 2,
    color: COLORS.textMuted,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  statBox: {
    flex: 1,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 11,
    marginBottom: 4,
    color: COLORS.textMuted,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  progressBarContainer: {
    marginTop: 8,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    backgroundColor: COLORS.border,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: COLORS.success,
  },
  progressBarLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  progressBarLabel: {
    fontSize: 10,
    color: COLORS.textMuted,
  },
});

export default ProgressChart;
