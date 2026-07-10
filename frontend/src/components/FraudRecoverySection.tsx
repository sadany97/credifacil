import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

// Lista de plataformas donde se recuperan fraudes
const FRAUD_PLATFORMS = [
  { 
    name: 'Forex/Trading', 
    icon: 'trending-up',
    color: '#10B981',
    description: 'Plataformas de trading falsas'
  },
  { 
    name: 'Criptomonedas', 
    icon: 'logo-bitcoin',
    color: '#F7931A',
    description: 'Exchanges y wallets fraudulentos'
  },
  { 
    name: 'Inversiones', 
    icon: 'pie-chart',
    color: '#6366F1',
    description: 'Esquemas Ponzi y piramidales'
  },
  { 
    name: 'E-commerce', 
    icon: 'cart',
    color: '#EC4899',
    description: 'Tiendas en línea falsas'
  },
  { 
    name: 'Préstamos', 
    icon: 'cash',
    color: '#14B8A6',
    description: 'Apps de préstamos fraudulentas'
  },
  { 
    name: 'Romance Scam', 
    icon: 'heart',
    color: '#EF4444',
    description: 'Estafas románticas en línea'
  },
];

interface FraudRecoverySectionProps {
  compact?: boolean;
}

export const FraudRecoverySection: React.FC<FraudRecoverySectionProps> = ({ compact = false }) => {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="shield-checkmark" size={24} color={COLORS.card} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Crédito de Fraudes</Text>
          <Text style={styles.subtitle}>en Plataformas Digitales</Text>
        </View>
      </View>

      <Text style={styles.description}>
        Nuestro equipo especializado ha recuperado fondos de múltiples tipos de fraudes digitales. 
        Si fuiste víctima de alguna de estas plataformas, podemos ayudarte.
      </Text>

      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.platformsScroll}
        contentContainerStyle={styles.platformsContent}
      >
        {FRAUD_PLATFORMS.map((platform, index) => (
          <View key={index} style={styles.platformCard}>
            <View style={[styles.platformIcon, { backgroundColor: platform.color + '20' }]}>
              <Ionicons name={platform.icon as any} size={28} color={platform.color} />
            </View>
            <Text style={styles.platformName}>{platform.name}</Text>
            <Text style={styles.platformDesc}>{platform.description}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>$47M+</Text>
          <Text style={styles.statLabel}>Recuperados</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>2,847</Text>
          <Text style={styles.statLabel}>Casos exitosos</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>98.7%</Text>
          <Text style={styles.statLabel}>Efectividad</Text>
        </View>
      </View>

      <View style={styles.trustBadges}>
        <View style={styles.trustBadge}>
          <Ionicons name="ribbon" size={16} color={COLORS.success} />
          <Text style={styles.trustBadgeText}>Certificados SHCP</Text>
        </View>
        <View style={styles.trustBadge}>
          <Ionicons name="lock-closed" size={16} color={COLORS.primary} />
          <Text style={styles.trustBadgeText}>100% Confidencial</Text>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.ctaButton}
        onPress={() => Linking.openURL('https://wa.me/5215512345678?text=Hola,%20fui%20víctima%20de%20fraude%20y%20necesito%20ayuda')}
      >
        <Ionicons name="chatbubble-ellipses" size={20} color={COLORS.card} />
        <Text style={styles.ctaButtonText}>Reportar mi caso ahora</Text>
        <Ionicons name="arrow-forward" size={18} color={COLORS.card} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 20,
    marginHorizontal: 20,
    marginVertical: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
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
    fontWeight: '800',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  description: {
    fontSize: 13,
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
    width: 120,
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
  },
  platformIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  platformName: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  platformDesc: {
    fontSize: 10,
    color: COLORS.textMuted,
    textAlign: 'center',
    lineHeight: 14,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '08',
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 16,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.border,
  },
  trustBadges: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 16,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
  },
  trustBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textLight,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: COLORS.accent,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 16,
  },
  ctaButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.card,
  },
});

export default FraudRecoverySection;
