import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { COLORS } from '../constants';

interface ProfessionalLogoProps {
  size?: 'large' | 'small';
}

export const ProfessionalLogo: React.FC<ProfessionalLogoProps> = ({ size = 'large' }) => {
  const isLarge = size === 'large';
  const logoSize = isLarge ? 140 : 70;
  
  return (
    <View style={[styles.logoWrapper, isLarge && styles.logoWrapperLarge]}>
      <Image 
        source={require('../../assets/images/credifacil_logo.jpg')}
        style={{ width: logoSize, height: logoSize, borderRadius: logoSize / 2 }}
        resizeMode="contain"
      />
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
});

export default ProfessionalLogo;
