import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, getBankConfig, detectCardType } from '../constants';

interface DigitalCardProps {
  profile: any;
}

// Component to render stylized bank logo
const BankLogo: React.FC<{ bankName: string; config: any }> = ({ bankName, config }) => {
  const upperName = bankName?.toUpperCase() || '';
  
  // Special logos for specific banks
  if (upperName === 'BBVA') {
    return (
      <View style={styles.bankLogoContainer}>
        <View style={[styles.bbvaHexagon, { backgroundColor: '#FFFFFF' }]}>
          <Text style={[styles.bbvaText, { color: '#004481' }]}>BBVA</Text>
        </View>
      </View>
    );
  }
  
  if (upperName === 'SANTANDER') {
    return (
      <View style={styles.bankLogoContainer}>
        <View style={styles.santanderFlame}>
          <View style={[styles.santanderDot, { backgroundColor: '#FFFFFF' }]} />
          <View style={[styles.santanderDot, { backgroundColor: '#FFFFFF', marginLeft: 3 }]} />
        </View>
        <Text style={[styles.bankLogoText, { color: config.textColor, marginLeft: 8 }]}>
          SANTANDER
        </Text>
      </View>
    );
  }
  
  if (upperName === 'CITIBANAMEX') {
    return (
      <View style={styles.bankLogoContainer}>
        <View style={[styles.citiArc, { borderColor: '#FF6200' }]} />
        <Text style={[styles.bankLogoText, { color: config.textColor, marginLeft: 8 }]}>
          CITIBANAMEX
        </Text>
      </View>
    );
  }
  
  if (upperName === 'BANORTE') {
    return (
      <View style={styles.bankLogoContainer}>
        <View style={styles.banorteIcon}>
          <View style={[styles.banorteDiamond, { backgroundColor: '#FFFFFF' }]} />
        </View>
        <Text style={[styles.bankLogoText, { color: config.textColor, marginLeft: 8 }]}>
          BANORTE
        </Text>
      </View>
    );
  }
  
  if (upperName === 'HSBC') {
    return (
      <View style={styles.bankLogoContainer}>
        <View style={styles.hsbcHexagons}>
          <View style={[styles.hsbcTriangle, { borderBottomColor: '#FFFFFF' }]} />
          <View style={[styles.hsbcTriangle, styles.hsbcTriangleRight, { borderBottomColor: '#FFFFFF' }]} />
        </View>
        <Text style={[styles.bankLogoText, { color: config.textColor, marginLeft: 8 }]}>
          HSBC
        </Text>
      </View>
    );
  }

  if (upperName === 'NU') {
    return (
      <View style={styles.bankLogoContainer}>
        <View style={[styles.nuCircle, { backgroundColor: '#FFFFFF' }]}>
          <Text style={[styles.nuText, { color: '#820AD1' }]}>Nu</Text>
        </View>
      </View>
    );
  }

  if (upperName === 'MERCADO PAGO') {
    return (
      <View style={styles.bankLogoContainer}>
        <View style={styles.mpHandshake}>
          <Ionicons name="hand-left" size={14} color="#FFE600" />
          <Ionicons name="hand-right" size={14} color="#FFE600" style={{ marginLeft: -4 }} />
        </View>
        <Text style={[styles.bankLogoText, { color: config.textColor, marginLeft: 6, fontSize: 12 }]}>
          MERCADO PAGO
        </Text>
      </View>
    );
  }
  
  // Default: Show stylized text logo with icon
  return (
    <View style={styles.bankLogoContainer}>
      <View style={[styles.defaultLogoIcon, { backgroundColor: config.accentColor || '#FFD700' }]}>
        <Ionicons name="shield-checkmark" size={14} color={config.primaryColor} />
      </View>
      <Text style={[styles.bankLogoText, { color: config.textColor }]}>
        {config.logo}
      </Text>
    </View>
  );
};

export const DigitalCard: React.FC<DigitalCardProps> = ({ profile }) => {
  const formatNumber = (num: string) => {
    if (!num) return '0000 0000 0000 0000';
    // Format based on length
    if (num.length === 18) {
      // CLABE format: 3-3-11-1
      return num.replace(/(\d{3})(\d{3})(\d{11})(\d{1})/, '$1 $2 $3 $4');
    } else if (num.length <= 11) {
      // Account number - no special format
      return num;
    } else {
      // Card number - groups of 4
      return num.replace(/(.{4})/g, '$1 ').trim();
    }
  };

  const getNumberLabel = (num: string) => {
    if (!num) return 'NÚMERO DE TARJETA';
    if (num.length === 18) return 'CLABE INTERBANCARIA';
    if (num.length <= 11) return 'NÚMERO DE CUENTA';
    return 'NÚMERO DE TARJETA';
  };

  const bankName = profile?.bank_name || 'CrediFácil';
  const bankConfig = getBankConfig(bankName);
  
  // Auto-detect card type based on card number
  const cardType = detectCardType(profile?.account_number || '');

  return (
    <View style={styles.digitalCardWrapper}>
      <View style={[styles.digitalCard, { backgroundColor: bankConfig.primaryColor }]}>
        {/* Gradient overlay for premium look */}
        <View style={[styles.cardGradientOverlay, { backgroundColor: bankConfig.secondaryColor }]} />
        <View style={[styles.cardGradientOverlay2, { backgroundColor: bankConfig.accentColor || '#FFFFFF' }]} />
        
        {/* Pattern overlay for texture */}
        <View style={styles.patternOverlay}>
          {[...Array(6)].map((_, i) => (
            <View 
              key={i} 
              style={[
                styles.patternLine, 
                { 
                  backgroundColor: bankConfig.textColor,
                  top: 20 + (i * 35),
                  transform: [{ rotate: '-15deg' }]
                }
              ]} 
            />
          ))}
        </View>
        
        <View style={styles.cardHeader}>
          <BankLogo bankName={bankName} config={bankConfig} />
          <View style={[styles.cardTypeBadge, { backgroundColor: bankConfig.secondaryColor + '90' }]}>
            {cardType === 'visa' ? (
              <Text style={[styles.cardTypeText, { color: bankConfig.textColor }]}>VISA</Text>
            ) : (
              <View style={styles.mastercardLogo}>
                <View style={[styles.mastercardCircle, { backgroundColor: '#eb001b' }]} />
                <View style={[styles.mastercardCircle, { backgroundColor: '#f79e1b', marginLeft: -8 }]} />
              </View>
            )}
          </View>
        </View>

        {/* Chip with enhanced design */}
        <View style={styles.cardChipWrapper}>
          <View style={styles.cardChip}>
            <View style={[styles.chipLine, { backgroundColor: bankConfig.primaryColor + '40' }]} />
            <View style={[styles.chipLine, { backgroundColor: bankConfig.primaryColor + '40' }]} />
            <View style={[styles.chipLine, { backgroundColor: bankConfig.primaryColor + '40' }]} />
          </View>
          <View style={styles.contactlessIcon}>
            <Ionicons name="wifi" size={18} color={bankConfig.textColor + '80'} style={{ transform: [{ rotate: '90deg' }] }} />
          </View>
        </View>

        <View style={styles.numberContainer}>
          <Text style={[styles.numberLabel, { color: bankConfig.textColor + '80' }]}>
            {getNumberLabel(profile?.account_number)}
          </Text>
          <Text style={[styles.cardNumber, { color: bankConfig.textColor }]}>
            {formatNumber(profile?.account_number)}
          </Text>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.cardHolderSection}>
            <Text style={[styles.cardLabel, { color: bankConfig.textColor + '70' }]}>TITULAR DE LA CUENTA</Text>
            <Text style={[styles.cardName, { color: bankConfig.textColor }]}>
              {profile?.name?.toUpperCase() || 'USUARIO'}
            </Text>
          </View>
          <View style={styles.cardBrand}>
            <View style={[styles.verifiedBadge, { backgroundColor: bankConfig.accentColor || '#FFD700' }]}>
              <Ionicons name="checkmark-circle" size={14} color={bankConfig.primaryColor} />
            </View>
            <Text style={[styles.cardBrandText, { color: bankConfig.accentColor || '#FFD700' }]}>VERIFICADO</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const { width } = Dimensions.get('window');
const cardWidth = width - 40;

const styles = StyleSheet.create({
  digitalCardWrapper: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  digitalCard: {
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 12,
    overflow: 'hidden',
    minHeight: 220,
  },
  cardGradientOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: 200,
    height: 200,
    borderRadius: 100,
    opacity: 0.25,
    transform: [{ translateX: 50 }, { translateY: -50 }],
  },
  cardGradientOverlay2: {
    position: 'absolute',
    bottom: -50,
    left: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    opacity: 0.08,
  },
  patternOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  patternLine: {
    position: 'absolute',
    left: -50,
    width: cardWidth + 100,
    height: 1,
    opacity: 0.05,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    zIndex: 1,
  },
  bankLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bankLogoText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
  defaultLogoIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  // BBVA specific
  bbvaHexagon: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  bbvaText: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
  },
  // Santander specific
  santanderFlame: {
    flexDirection: 'row',
  },
  santanderDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  // Citibanamex specific
  citiArc: {
    width: 20,
    height: 10,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    borderWidth: 3,
    borderBottomWidth: 0,
  },
  // Banorte specific
  banorteIcon: {
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  banorteDiamond: {
    width: 12,
    height: 12,
    transform: [{ rotate: '45deg' }],
    borderRadius: 2,
  },
  // HSBC specific
  hsbcHexagons: {
    flexDirection: 'row',
  },
  hsbcTriangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderBottomWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  hsbcTriangleRight: {
    transform: [{ rotate: '180deg' }],
    marginLeft: 2,
  },
  // Nu specific
  nuCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nuText: {
    fontSize: 14,
    fontWeight: '800',
  },
  // Mercado Pago specific
  mpHandshake: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTypeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  cardTypeText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 2,
  },
  mastercardLogo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mastercardCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  cardChipWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    zIndex: 1,
  },
  cardChip: {
    width: 50,
    height: 38,
    backgroundColor: '#D4AF37',
    borderRadius: 8,
    justifyContent: 'center',
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  chipLine: {
    height: 3,
    marginBottom: 4,
    borderRadius: 2,
  },
  contactlessIcon: {
    marginLeft: 12,
    opacity: 0.8,
  },
  numberContainer: {
    marginBottom: 14,
    zIndex: 1,
  },
  numberLabel: {
    fontSize: 10,
    letterSpacing: 1,
    marginBottom: 6,
    fontWeight: '500',
  },
  cardNumber: {
    fontSize: 19,
    fontWeight: '600',
    letterSpacing: 2,
    fontFamily: 'monospace',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    zIndex: 1,
  },
  cardHolderSection: {
    flex: 1,
  },
  cardLabel: {
    fontSize: 9,
    marginBottom: 4,
    letterSpacing: 1,
    fontWeight: '500',
  },
  cardName: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 1,
  },
  cardBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  verifiedBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardBrandText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default DigitalCard;
