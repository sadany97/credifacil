// CrediFácil - Sección de Beneficios de Crédito
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

// Beneficios de CrediFácil
const CREDIT_BENEFITS = [
  { 
    name: 'Sin Buró', 
    icon: 'checkmark-shield',
    color: '#4CAF50',
    description: 'No consultamos tu historial crediticio'
  },
  { 
    name: 'Aprobación Rápida', 
    icon: 'flash',
    color: '#FF9800',
    description: 'Respuesta en menos de 24 horas'
  },
  { 
    name: 'Tasas Justas', 
    icon: 'trending-down',
    color: '#1976D2',
    description: 'Las mejores tasas del mercado'
  },
  { 
    name: 'Sin Aval', 
    icon: 'person-done',
    color: '#9C27B0',
    description: 'No necesitas fiador ni garantía'
  },
  { 
    name: '100% Digital', 
    icon: 'phone-portrait',
    color: '#00BCD4',
    description: 'Todo el proceso desde tu celular'
  },
  { 
    name: 'Seguro', 
    icon: 'shield-checkmark',
    color: '#4CAF50',
    description: 'Tus datos están protegidos'
  },
];

interface CreditBenefitsSectionProps {
  compact?: boolean;
}

export const FraudRecoverySection: React.FC<CreditBenefitsSectionProps> = ({ compact = false }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="star" size={24} color={COLORS.card} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>¿Por qué CrediFácil?</Text>
          <Text style={styles.subtitle}>Beneficios exclusivos para ti</Text>
        </View>
      </View>

      <Text style={styles.description}>
        Somos la mejor opción para obtener tu crédito de forma rápida, segura y sin complicaciones. 
        Más de 1 millón de mexicanos ya confían en nosotros.
      </Text>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.platformsScroll}
        contentContainerStyle={styles.platformsContent}
      >
        {CREDIT_BENEFITS.map((benefit, index) => (
          <View key={index} style={styles.platformCard}>
            <View style={[styles.platformIcon, { backgroundColor: benefit.color + '20' }]}>
              <Ionicons name={benefit.icon as any} size={28} color={benefit.color} />
            </View>
            <Text style={styles.platformName}>{benefit.name}</Text>
            <Text style={styles.platformDescription}>{benefit.description}</Text>
          </View>
        ))}
      </ScrollView>

      {!compact && (
        <View style={styles.statsContainer}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>+1M</Text>
            <Text style={styles.statLabel}>Clientes</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>95%</Text>
            <Text style={styles.statLabel}>Aprobación</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>24h</Text>
            <Text style={styles.statLabel}>Respuesta</Text>
          </View>
        </View>
      )}

      <View style={styles.trustBadge}>
        <Ionicons name="ribbon" size={18} color="#FFD700" />
        <Text style={styles.trustText}>Institución regulada por CONDUSEF</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.textLight,
    marginTop: 2,
  },
  description: {
    fontSize: 14,
    color: COLORS.textLight,
    lineHeight: 20,
    marginBottom: 16,
  },
  platformsScroll: {
    marginHorizontal: -20,
  },
  platformsContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  platformCard: {
    width: 140,
    backgroundColor: COLORS.background,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
  },
  platformIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  platformName: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  platformDescription: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 14,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '10',
    borderRadius: 14,
    padding: 16,
    marginTop: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: COLORS.border,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 16,
    paddingVertical: 10,
    backgroundColor: '#FFF8E1',
    borderRadius: 10,
  },
  trustText: {
    fontSize: 12,
    color: '#F57C00',
    fontWeight: '600',
  },
});

export default FraudRecoverySection;
