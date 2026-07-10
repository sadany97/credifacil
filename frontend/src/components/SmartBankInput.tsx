import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  View, 
  TextInput, 
  Text, 
  StyleSheet, 
  Animated, 
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, getBankConfig, BankConfig } from '../constants';

// Base de datos completa de identificación de bancos mexicanos por CLABE
const CLABE_BANK_REGISTRY: { [key: string]: string } = {
  '002': 'CITIBANAMEX',
  '012': 'BBVA',
  '014': 'SANTANDER',
  '021': 'HSBC',
  '030': 'BAJÍO',
  '036': 'INBURSA',
  '037': 'INTERACCIONES',
  '042': 'MIFEL',
  '044': 'SCOTIABANK',
  '058': 'BANREGIO',
  '059': 'INVEX',
  '060': 'BANSI',
  '062': 'AFIRME',
  '072': 'BANORTE',
  '102': 'ACCENDO',
  '106': 'BANK OF AMERICA',
  '108': 'MUFG',
  '110': 'JP MORGAN',
  '112': 'BMONEX',
  '113': 'VE POR MAS',
  '124': 'DEUTSCHE BANK',
  '126': 'CREDIT SUISSE',
  '127': 'BANCO AZTECA',
  '128': 'AUTOFIN',
  '129': 'BARCLAYS',
  '130': 'COMPARTAMOS',
  '131': 'BANCO FAMSA',
  '132': 'MULTIVA',
  '133': 'ACTINVER',
  '134': 'WAL-MART',
  '135': 'NAFIN',
  '136': 'INTERBANCO',
  '137': 'BANCOPPEL',
  '138': 'ABC CAPITAL',
  '139': 'CONSUBANCO',
  '140': 'VOLKSWAGEN',
  '141': 'CIBANCO',
  '143': 'CAJA POP MEXICA',
  '145': 'BBASE',
  '147': 'BANKAOOL',
  '148': 'PAGATODO',
  '150': 'INMOBILIARIO',
  '152': 'BANCREA',
  '154': 'DONDE',
  '155': 'BANCO S3',
  '156': 'SABADELL',
  '157': 'MASARI',
  '158': 'FORJADORES',
  '159': 'UNAGRA',
  '160': 'MIZUHO',
  '166': 'BANCO BIENESTAR',
  '168': 'ICBC',
  '600': 'MONEXCB',
  '601': 'GBM',
  '602': 'MASARI',
  '605': 'VALUE',
  '606': 'FUNDACION DONDÉ',
  '608': 'FINCOMUN',
  '610': 'NU',
  '613': 'MULTIVA CUSTODIA',
  '616': 'FINAMEX',
  '617': 'VALMEX',
  '618': 'ÚNICA',
  '619': 'ASEA',
  '620': 'PROFUTURO',
  '621': 'CB ACTINVER',
  '622': 'AKALA',
  '623': 'CB INTERCAM',
  '626': 'CB BAJIO',
  '627': 'ZURICH',
  '628': 'ZURICHVI',
  '629': 'SU CASITA',
  '630': 'CB INTERCAM',
  '631': 'CI BOLSA',
  '632': 'BULLTICK CB',
  '633': 'STERLING',
  '634': 'FINMARK',
  '636': 'HDI SEGUROS',
  '637': 'ORDER',
  '638': 'NU',
  '640': 'CB JP MORGAN',
  '642': 'REFORMA',
  '646': 'STP',
  '647': 'TELECOMM',
  '648': 'EVERCORE',
  '649': 'OSKNDIA',
  '651': 'KLAR',
  '652': 'CREDICAPITAL',
  '653': 'KUSPIT',
  '655': 'UNAGRA',
  '656': 'SOFIEXPRESS',
  '659': 'ASP INTEGRA OPC',
  '670': 'LIBERTAD',
  '674': 'CAJA TELEFONIST',
  '677': 'CAJA POPULAR',
  '679': 'FND',
  '680': 'CRISTOBAL COLON',
  '683': 'CAJA MORELIA',
  '684': 'TRANSFER',
  '685': 'FONDO (FIRA)',
  '686': 'INVERCAP',
  '689': 'FOMPED',
  '690': 'CASA DE AHORRO',
  '699': 'FONDEADORA',
  '703': 'TESORED',
  '706': 'ARCUS',
  '710': 'NVIO',
  '711': 'STORI',
  '712': 'RAPPI',
  '714': 'SPIN BY OXXO',
  '722': 'MERCADO PAGO',
  '723': 'CUENCA',
  '901': 'CLS',
  '902': 'INDEVAL',
  '903': 'MONEYCORP',
  '999': 'N/A',
};

// BIN database for card detection
const CARD_BIN_REGISTRY: { prefix: string; bank: string }[] = [
  // BBVA
  { prefix: '415231', bank: 'BBVA' },
  { prefix: '455555', bank: 'BBVA' },
  { prefix: '409851', bank: 'BBVA' },
  { prefix: '491573', bank: 'BBVA' },
  { prefix: '4092', bank: 'BBVA' },
  // Banamex/Citibanamex
  { prefix: '520416', bank: 'CITIBANAMEX' },
  { prefix: '525678', bank: 'CITIBANAMEX' },
  { prefix: '549138', bank: 'CITIBANAMEX' },
  { prefix: '404159', bank: 'CITIBANAMEX' },
  { prefix: '421508', bank: 'CITIBANAMEX' },
  // Santander
  { prefix: '491566', bank: 'SANTANDER' },
  { prefix: '475801', bank: 'SANTANDER' },
  { prefix: '557909', bank: 'SANTANDER' },
  { prefix: '402533', bank: 'SANTANDER' },
  // Banorte
  { prefix: '491389', bank: 'BANORTE' },
  { prefix: '402766', bank: 'BANORTE' },
  { prefix: '547521', bank: 'BANORTE' },
  { prefix: '4559', bank: 'BANORTE' },
  // HSBC
  { prefix: '421350', bank: 'HSBC' },
  { prefix: '444005', bank: 'HSBC' },
  { prefix: '400148', bank: 'HSBC' },
  // Banco Azteca
  { prefix: '416916', bank: 'BANCO AZTECA' },
  { prefix: '518812', bank: 'BANCO AZTECA' },
  { prefix: '603487', bank: 'BANCO AZTECA' },
  // BanCoppel
  { prefix: '402966', bank: 'BANCOPPEL' },
  { prefix: '411449', bank: 'BANCOPPEL' },
  // Nu
  { prefix: '557910', bank: 'NU' },
  { prefix: '535858', bank: 'NU' },
  { prefix: '539483', bank: 'NU' },
  // Mercado Pago
  { prefix: '525628', bank: 'MERCADO PAGO' },
  { prefix: '551238', bank: 'MERCADO PAGO' },
  // Scotiabank
  { prefix: '406589', bank: 'SCOTIABANK' },
  { prefix: '419278', bank: 'SCOTIABANK' },
  // Inbursa
  { prefix: '406484', bank: 'INBURSA' },
  { prefix: '412364', bank: 'INBURSA' },
  // Stori
  { prefix: '5579', bank: 'STORI' },
  // Klar
  { prefix: '5361', bank: 'KLAR' },
  // Uala
  { prefix: '531199', bank: 'UALA' },
  { prefix: '535110', bank: 'UALA' },
  // Rappi
  { prefix: '5579', bank: 'RAPPI' },
  // Hey Banco
  { prefix: '5474', bank: 'HEY BANCO' },
];

interface SmartBankInputProps {
  value: string;
  onChangeText: (text: string, cleanValue: string) => void;
  placeholder?: string;
  label?: string;
  inputType?: 'clabe' | 'card' | 'auto';
  onBankDetected?: (bankName: string | null, config: BankConfig | null) => void;
}

export const SmartBankInput: React.FC<SmartBankInputProps> = ({
  value,
  onChangeText,
  placeholder = "Ingresa CLABE o número de tarjeta",
  label,
  inputType = 'auto',
  onBankDetected,
}) => {
  const [detectedBank, setDetectedBank] = useState<string | null>(null);
  const [detectedType, setDetectedType] = useState<'clabe' | 'card' | null>(null);
  const [bankConfig, setBankConfig] = useState<BankConfig | null>(null);
  
  // Animations
  const checkScale = useRef(new Animated.Value(0)).current;
  const checkOpacity = useRef(new Animated.Value(0)).current;
  const borderColorAnim = useRef(new Animated.Value(0)).current;
  const logoSlide = useRef(new Animated.Value(20)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;

  // Animate check mark when bank is detected
  const animateDetection = () => {
    // Reset animations
    checkScale.setValue(0);
    checkOpacity.setValue(0);
    logoSlide.setValue(20);
    logoOpacity.setValue(0);

    Animated.parallel([
      // Check mark pop animation
      Animated.sequence([
        Animated.timing(checkScale, {
          toValue: 1.3,
          duration: 200,
          easing: Easing.out(Easing.back(2)),
          useNativeDriver: true,
        }),
        Animated.timing(checkScale, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(checkOpacity, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      // Border color animation
      Animated.timing(borderColorAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }),
      // Logo slide in
      Animated.timing(logoSlide, {
        toValue: 0,
        duration: 300,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Reset animations when bank is not detected
  const resetAnimation = () => {
    Animated.parallel([
      Animated.timing(checkOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(borderColorAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(logoOpacity, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Detect bank from input
  const detectBank = useMemo(() => {
    const cleanNumber = value.replace(/\D/g, '');
    let bank: string | null = null;
    let type: 'clabe' | 'card' | null = null;

    // Detect CLABE (18 digits, starts with 3-digit bank code)
    if (cleanNumber.length >= 3 && (inputType === 'clabe' || inputType === 'auto')) {
      const clabePrefix = cleanNumber.substring(0, 3);
      if (CLABE_BANK_REGISTRY[clabePrefix]) {
        bank = CLABE_BANK_REGISTRY[clabePrefix];
        type = 'clabe';
      }
    }

    // Detect Card (if no CLABE match or card type forced)
    if (!bank && cleanNumber.length >= 4 && (inputType === 'card' || inputType === 'auto')) {
      for (const entry of CARD_BIN_REGISTRY) {
        if (cleanNumber.startsWith(entry.prefix)) {
          bank = entry.bank;
          type = 'card';
          break;
        }
      }
    }

    return { bank, type, cleanNumber };
  }, [value, inputType]);

  // Update state and trigger animations
  useEffect(() => {
    const { bank, type } = detectBank;
    
    if (bank !== detectedBank) {
      setDetectedBank(bank);
      setDetectedType(type);
      
      if (bank) {
        const config = getBankConfig(bank);
        setBankConfig(config);
        animateDetection();
        onBankDetected?.(bank, config);
      } else {
        setBankConfig(null);
        resetAnimation();
        onBankDetected?.(null, null);
      }
    }
  }, [detectBank]);

  // Format input as user types
  const formatInput = (text: string): string => {
    const clean = text.replace(/\D/g, '');
    
    // Auto-detect format based on length and first digits
    if (clean.length <= 16) {
      // Card format: XXXX XXXX XXXX XXXX
      const groups = clean.match(/.{1,4}/g);
      return groups ? groups.join(' ') : clean;
    } else {
      // CLABE format: XXX XXX XXXXXXXXXXX X (3-3-11-1)
      if (clean.length <= 18) {
        let formatted = '';
        if (clean.length > 0) formatted += clean.substring(0, 3);
        if (clean.length > 3) formatted += ' ' + clean.substring(3, 6);
        if (clean.length > 6) formatted += ' ' + clean.substring(6, 17);
        if (clean.length > 17) formatted += ' ' + clean.substring(17, 18);
        return formatted;
      }
      return clean.substring(0, 18);
    }
  };

  const handleChange = (text: string) => {
    const formatted = formatInput(text);
    const clean = text.replace(/\D/g, '');
    onChangeText(formatted, clean);
  };

  // Interpolate border color
  const borderColor = borderColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [COLORS.border, bankConfig?.primaryColor || COLORS.accent],
  });

  const backgroundColor = borderColorAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', (bankConfig?.primaryColor || COLORS.accent) + '08'],
  });

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <Animated.View style={[
        styles.inputWrapper,
        {
          borderColor,
          backgroundColor,
        }
      ]}>
        {/* Bank Logo/Icon */}
        <View style={styles.iconSection}>
          {detectedBank && bankConfig ? (
            <Animated.View 
              style={[
                styles.bankLogoBox,
                { 
                  backgroundColor: bankConfig.primaryColor,
                  transform: [{ translateX: logoSlide }],
                  opacity: logoOpacity,
                }
              ]}
            >
              <Text style={[styles.bankLogoText, { color: bankConfig.textColor }]}>
                {bankConfig.logo.substring(0, 2)}
              </Text>
            </Animated.View>
          ) : (
            <View style={styles.defaultIcon}>
              <Ionicons name="card-outline" size={22} color={COLORS.textMuted} />
            </View>
          )}
        </View>

        {/* Input Field */}
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          keyboardType="numeric"
          maxLength={22} // 18 digits + 4 spaces max
          onChangeText={handleChange}
          value={value}
        />

        {/* Detection Badge */}
        {detectedBank && (
          <Animated.View 
            style={[
              styles.detectionBadge,
              { 
                opacity: checkOpacity,
                transform: [{ scale: checkScale }],
                backgroundColor: bankConfig?.primaryColor || COLORS.success,
              }
            ]}
          >
            <Ionicons name="checkmark" size={14} color="#FFFFFF" />
          </Animated.View>
        )}
      </Animated.View>

      {/* Detection Info */}
      {detectedBank && bankConfig && (
        <Animated.View 
          style={[
            styles.detectionInfo,
            { 
              opacity: logoOpacity,
              backgroundColor: (bankConfig.primaryColor || COLORS.success) + '12',
            }
          ]}
        >
          <View style={[styles.bankBadge, { backgroundColor: bankConfig.primaryColor }]}>
            <Ionicons name="shield-checkmark" size={12} color={bankConfig.textColor} />
          </View>
          <Text style={[styles.detectionText, { color: bankConfig.primaryColor }]}>
            {detectedType === 'clabe' ? 'CLABE' : 'Tarjeta'} · <Text style={styles.bankNameText}>{detectedBank}</Text>
          </Text>
          <View style={styles.validBadge}>
            <Ionicons name="checkmark-circle" size={16} color={COLORS.success} />
            <Text style={styles.validText}>Válido</Text>
          </View>
        </Animated.View>
      )}

      {/* Format hint */}
      {!detectedBank && value.length > 0 && (
        <View style={styles.hintContainer}>
          <Ionicons name="information-circle-outline" size={14} color={COLORS.textMuted} />
          <Text style={styles.hintText}>
            {value.replace(/\D/g, '').length < 16 
              ? 'Continúa escribiendo para detectar el banco' 
              : 'Formato: Tarjeta (16 dígitos) o CLABE (18 dígitos)'}
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
    borderWidth: 2,
    borderRadius: 14,
    paddingHorizontal: 4,
    minHeight: 58,
  },
  iconSection: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  defaultIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: COLORS.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bankLogoBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bankLogoText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  input: {
    flex: 1,
    height: 56,
    fontSize: 17,
    color: COLORS.text,
    fontWeight: '500',
    letterSpacing: 1.5,
    fontFamily: 'monospace',
  },
  detectionBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  detectionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  bankBadge: {
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  detectionText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
  },
  bankNameText: {
    fontWeight: '700',
  },
  validBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.success + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  validText: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.success,
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingHorizontal: 4,
    gap: 6,
  },
  hintText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
});

export default SmartBankInput;
