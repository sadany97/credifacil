import React, { useState, useMemo } from 'react';
import { View, TextInput, Image, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

// Base de datos de identificación de bancos mexicanos
const BANCO_REGISTRY = [
  { 
    id: '012', 
    name: 'BBVA', 
    bins: ['415231', '455555', '409851', '491573', '400922', '406594', '415231', '423459', '441509', '445091'],
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/1f/BBVA_2019.svg/200px-BBVA_2019.svg.png'
  },
  { 
    id: '002', 
    name: 'Banamex', 
    bins: ['520416', '525678', '549138', '404159', '406389', '421508', '428227', '458162', '491382'],
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/de/Citibanamex_logo.svg/200px-Citibanamex_logo.svg.png'
  },
  { 
    id: '014', 
    name: 'Santander', 
    bins: ['491566', '475801', '557909', '402533', '410583', '426783', '455701', '469268', '489454'],
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b8/Banco_Santander_Logotipo.svg/200px-Banco_Santander_Logotipo.svg.png'
  },
  { 
    id: '072', 
    name: 'Banorte', 
    bins: ['491389', '402766', '547521', '400895', '402766', '406275', '421561', '431563', '455618'],
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/51/Logo_de_Banorte.svg/200px-Logo_de_Banorte.svg.png'
  },
  { 
    id: '127', 
    name: 'Banco Azteca', 
    bins: ['416916', '518812', '603487', '402969', '406478', '416917', '422234', '428866'],
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/8b/Banco_Azteca_logo.svg/200px-Banco_Azteca_logo.svg.png'
  },
  { 
    id: '137', 
    name: 'BanCoppel', 
    bins: ['402966', '411449', '406586', '421602', '428232', '455605', '489410'],
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Coppel_logo.svg/200px-Coppel_logo.svg.png'
  },
  { 
    id: '638', 
    name: 'Nu México', 
    bins: ['557910', '535858', '539483'],
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Nubank_logo_2021.svg/200px-Nubank_logo_2021.svg.png'
  },
  { 
    id: '714', 
    name: 'Spin by Oxxo', 
    bins: ['421316', '416916', '406586'],
    logo: 'https://play-lh.googleusercontent.com/Ky0FMwWf-LdCy0kDflYEoI5xEGbVmP_2Hm0cTlxnQDhPfAv5h0KqUoAUw7hTB1FHKA=w240-h480'
  },
  { 
    id: '646', 
    name: 'Mercado Pago', 
    bins: ['525628', '551238', '533254', '542678'],
    logo: 'https://http2.mlstatic.com/frontend-assets/mp-web-navigation/ui-navigation/6.6.92/mercadopago/logo__large@2x.png'
  },
  { 
    id: '021', 
    name: 'HSBC', 
    bins: ['421350', '444005', '400148', '406376', '412649', '423458', '455700', '476148'],
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/aa/HSBC_logo_%282018%29.svg/200px-HSBC_logo_%282018%29.svg.png'
  },
  { 
    id: '036', 
    name: 'Inbursa', 
    bins: ['406484', '412364', '421599', '455603', '489403', '539206'],
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bf/Inbursa_logo.svg/200px-Inbursa_logo.svg.png'
  },
  { 
    id: '030', 
    name: 'Bajío', 
    bins: ['406273', '410596', '421600', '455606', '489401'],
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/BancoBajio_logo.svg/200px-BancoBajio_logo.svg.png'
  },
  { 
    id: '044', 
    name: 'Scotiabank', 
    bins: ['406589', '419278', '431564', '455614', '476149', '517824'],
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/87/Scotiabank_logo.svg/200px-Scotiabank_logo.svg.png'
  },
  { 
    id: '058', 
    name: 'Banregio', 
    bins: ['406274', '421601', '455607', '489402'],
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/Banregio_logo.svg/200px-Banregio_logo.svg.png'
  },
  { 
    id: '138', 
    name: 'Uala', 
    bins: ['531199', '535110', '553810'],
    logo: 'https://uala.com.ar/og-image.png'
  }
];

interface BankDetectorInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  onBankDetected?: (bank: typeof BANCO_REGISTRY[0] | null) => void;
}

const BankDetectorInput: React.FC<BankDetectorInputProps> = ({
  value,
  onChangeText,
  placeholder = "Número de tarjeta o CLABE",
  label = "Número de Tarjeta o CLABE",
  onBankDetected
}) => {
  const [imageLoading, setImageLoading] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Lógica de detección en tiempo real con useMemo para optimización
  const detectedBank = useMemo(() => {
    const cleanNumber = value.replace(/\D/g, ''); // Limpia caracteres no numéricos

    let bank = null;

    // Identificación por CLABE (18 dígitos) - usa los primeros 3 dígitos
    if (cleanNumber.length >= 3) {
      const prefix = cleanNumber.substring(0, 3);
      bank = BANCO_REGISTRY.find(b => b.id === prefix);
    }

    // Identificación por Tarjeta (primeros 6 dígitos = BIN)
    if (!bank && cleanNumber.length >= 6) {
      const bin = cleanNumber.substring(0, 6);
      bank = BANCO_REGISTRY.find(b => b.bins.some(b_code => bin.startsWith(b_code)));
    }

    // Callback cuando se detecta un banco
    if (onBankDetected && bank !== undefined) {
      onBankDetected(bank);
    }

    return bank;
  }, [value, onBankDetected]);

  // Formatear el número para mejor legibilidad
  const formatNumber = (text: string) => {
    const clean = text.replace(/\D/g, '');
    // Si parece CLABE (18 dígitos), no formatear con espacios
    if (clean.length > 16) {
      return clean.slice(0, 18);
    }
    // Formatear como tarjeta (grupos de 4)
    const groups = clean.match(/.{1,4}/g);
    return groups ? groups.join(' ') : clean;
  };

  const handleChange = (text: string) => {
    const formatted = formatNumber(text);
    onChangeText(formatted);
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[
        styles.inputWrapper,
        detectedBank && styles.inputWrapperActive
      ]}>
        <View style={styles.iconContainer}>
          <Ionicons 
            name="card-outline" 
            size={22} 
            color={detectedBank ? COLORS.accent : COLORS.textMuted} 
          />
        </View>
        
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          keyboardType="numeric"
          maxLength={22} // 18 dígitos + 4 espacios
          onChangeText={handleChange}
          value={value}
        />
        
        {/* Muestra el logo dinámicamente si hay coincidencia */}
        {detectedBank && (
          <View style={styles.logoContainer}>
            {imageLoading && (
              <ActivityIndicator size="small" color={COLORS.accent} />
            )}
            {!imageError ? (
              <Image 
                source={{ uri: detectedBank.logo }} 
                style={[styles.logo, imageLoading && styles.logoHidden]}
                resizeMode="contain"
                onLoadStart={() => setImageLoading(true)}
                onLoadEnd={() => setImageLoading(false)}
                onError={() => {
                  setImageError(true);
                  setImageLoading(false);
                }}
              />
            ) : (
              <View style={styles.fallbackLogo}>
                <Ionicons name="business" size={20} color={COLORS.accent} />
              </View>
            )}
            <Text style={styles.bankName}>{detectedBank.name}</Text>
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={12} color={COLORS.success} />
            </View>
          </View>
        )}
      </View>
      
      {/* Indicador de tipo detectado */}
      {detectedBank && value.replace(/\D/g, '').length >= 3 && (
        <View style={styles.detectionInfo}>
          <Ionicons name="shield-checkmark" size={14} color={COLORS.success} />
          <Text style={styles.detectionText}>
            {value.replace(/\D/g, '').length >= 16 ? 'Tarjeta detectada' : 
             value.replace(/\D/g, '').length === 18 ? 'CLABE detectada' : 
             'Banco identificado'}: {detectedBank.name}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: COLORS.text,
    marginBottom: 8,
    fontWeight: '600',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: COLORS.card,
    minHeight: 56,
  },
  inputWrapperActive: {
    borderColor: COLORS.accent,
    backgroundColor: 'rgba(201, 162, 39, 0.05)',
  },
  iconContainer: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
    letterSpacing: 1,
  },
  logoContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    marginLeft: 10,
    paddingLeft: 10,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
    minWidth: 60,
  },
  logo: {
    width: 40,
    height: 28,
  },
  logoHidden: {
    opacity: 0,
  },
  fallbackLogo: {
    width: 40,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(201, 162, 39, 0.1)',
    borderRadius: 4,
  },
  bankName: {
    fontSize: 9,
    color: COLORS.textMuted,
    marginTop: 2,
    textAlign: 'center',
    fontWeight: '600',
  },
  verifiedBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
  },
  detectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
  },
  detectionText: {
    fontSize: 12,
    color: COLORS.success,
    marginLeft: 6,
    fontWeight: '500',
  },
});

export default BankDetectorInput;
export { BANCO_REGISTRY };
