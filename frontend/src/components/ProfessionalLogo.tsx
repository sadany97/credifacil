import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

interface ProfessionalLogoProps {
  size?: 'large' | 'small';
}

export const ProfessionalLogo: React.FC<ProfessionalLogoProps> = ({ size = 'large' }) => {
  const isLarge = size === 'large';
  const logoSize = isLarge ? 110 : 60;
  const iconSize = isLarge ? 40 : 22;
  const shieldSize = isLarge ? 28 : 16;
  
  return (
    <View style={[styles.logoWrapper, isLarge && styles.logoWrapperLarge]}>
      <View style={[
        styles.logoOuterRing,
        { width: logoSize + 20, height: logoSize + 20, borderRadius: (logoSize + 20) / 2 }
      ]}>
        <View style={[
          styles.logoMainCircle,
          { width: logoSize, height: logoSize, borderRadius: logoSize / 2 }
        ]}>
          <View style={styles.logoInnerGlow}>
            <View style={styles.logoIconStack}>
              <Ionicons name="shield-checkmark" size={shieldSize} color={COLORS.gold} style={styles.logoShield} />
              <Ionicons name="trending-up" size={iconSize} color={COLORS.card} />
            </View>
          </View>
        </View>
      </View>
      
      {isLarge && (
        <View style={styles.verifiedBadge}>
          <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  logoWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoWrapperLarge: {
    marginBottom: 16,
  },
  logoOuterRing: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.gold + '40',
    backgroundColor: 'transparent',
  },
  logoMainCircle: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 12,
  },
  logoInnerGlow: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoIconStack: {
    alignItems: 'center',
  },
  logoShield: {
    marginBottom: -8,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: 0,
    right: -5,
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 2,
  },
});

export default ProfessionalLogo;
