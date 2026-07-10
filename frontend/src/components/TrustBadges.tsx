import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

export const TrustBadges: React.FC = () => (
  <View style={styles.trustBadgesContainer}>
    <View style={styles.trustBadge}>
      <Ionicons name="shield-checkmark" size={20} color={COLORS.success} />
      <Text style={styles.trustBadgeText}>100% Seguro</Text>
    </View>
    <View style={styles.trustBadge}>
      <Ionicons name="lock-closed" size={20} color={COLORS.accent} />
      <Text style={styles.trustBadgeText}>Datos Protegidos</Text>
    </View>
    <View style={styles.trustBadge}>
      <Ionicons name="ribbon" size={20} color={COLORS.gold} />
      <Text style={styles.trustBadgeText}>Certificado</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  trustBadgesContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 16,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  trustBadgeText: {
    fontSize: 11,
    color: COLORS.text,
    marginLeft: 6,
    fontWeight: '600',
  },
});

export default TrustBadges;
