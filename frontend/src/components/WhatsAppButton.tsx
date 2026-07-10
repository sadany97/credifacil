import React from 'react';
import { TouchableOpacity, StyleSheet, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface WhatsAppButtonProps {
  userName: string;
  accountNumber: string;
}

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({ userName, accountNumber }) => {
  const handlePress = () => {
    // Número principal de WhatsApp
    const phoneNumber = '5531048344';
    const message = `Hola, soy ${userName}. Mi número de cuenta es: ${accountNumber || 'N/A'}`;
    const whatsappUrl = `https://wa.me/52${phoneNumber}?text=${encodeURIComponent(message)}`;
    Linking.openURL(whatsappUrl);
  };

  return (
    <TouchableOpacity style={styles.whatsappSmallButton} onPress={handlePress}>
      <Ionicons name="logo-whatsapp" size={28} color="#fff" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  whatsappSmallButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: 16,
    marginBottom: 30,
    shadowColor: '#25D366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 6,
  },
});

export default WhatsAppButton;
