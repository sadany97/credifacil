// Bank configurations with colors, styles and logo URLs
// Logos are displayed as text-based stylized names for reliability
export interface BankConfig {
  primaryColor: string;
  secondaryColor: string;
  textColor: string;
  logo: string;
  logoIcon?: string; // Icon name from Ionicons
  accentColor?: string; // Extra accent color for some banks
}

export const BANK_CONFIGS: { [key: string]: BankConfig } = {
  'BBVA': {
    primaryColor: '#004481',
    secondaryColor: '#1973B8',
    textColor: '#FFFFFF',
    logo: 'BBVA',
    accentColor: '#FFFFFF',
  },
  'BANORTE': {
    primaryColor: '#CB0C24',
    secondaryColor: '#8B0000',
    textColor: '#FFFFFF',
    logo: 'BANORTE',
    accentColor: '#FFFFFF',
  },
  'CITIBANAMEX': {
    primaryColor: '#003D7A',
    secondaryColor: '#0D2E5C',
    textColor: '#FFFFFF',
    logo: 'CITIBANAMEX',
    accentColor: '#FF6200',
  },
  'SANTANDER': {
    primaryColor: '#EC0000',
    secondaryColor: '#B30000',
    textColor: '#FFFFFF',
    logo: 'SANTANDER',
    accentColor: '#FFFFFF',
  },
  'SCOTIABANK': {
    primaryColor: '#EC1C24',
    secondaryColor: '#8B0000',
    textColor: '#FFFFFF',
    logo: 'SCOTIABANK',
    accentColor: '#FFFFFF',
  },
  'HSBC': {
    primaryColor: '#DB0011',
    secondaryColor: '#8B0000',
    textColor: '#FFFFFF',
    logo: 'HSBC',
    accentColor: '#FFFFFF',
  },
  'INBURSA': {
    primaryColor: '#003399',
    secondaryColor: '#001A66',
    textColor: '#FFFFFF',
    logo: 'INBURSA',
    accentColor: '#FFD700',
  },
  'BANREGIO': {
    primaryColor: '#FF6600',
    secondaryColor: '#CC5200',
    textColor: '#FFFFFF',
    logo: 'BANREGIO',
    accentColor: '#FFFFFF',
  },
  'BANCOPPEL': {
    primaryColor: '#FFD700',
    secondaryColor: '#DAA520',
    textColor: '#1a1a2e',
    logo: 'BANCOPPEL',
    accentColor: '#1a1a2e',
  },
  'STORI': {
    primaryColor: '#00D4AA',
    secondaryColor: '#00A080',
    textColor: '#FFFFFF',
    logo: 'STORI',
    accentColor: '#FFFFFF',
  },
  'KLAR': {
    primaryColor: '#6B4EFF',
    secondaryColor: '#4B2EDF',
    textColor: '#FFFFFF',
    logo: 'KLAR',
    accentColor: '#00E5FF',
  },
  'ALBO': {
    primaryColor: '#00C2FF',
    secondaryColor: '#0090CC',
    textColor: '#FFFFFF',
    logo: 'ALBO',
    accentColor: '#FFFFFF',
  },
  'SPIN BY OXXO': {
    primaryColor: '#CC0000',
    secondaryColor: '#990000',
    textColor: '#FFFFFF',
    logo: 'SPIN',
    accentColor: '#FFD700',
  },
  'MERCADO PAGO': {
    primaryColor: '#009EE3',
    secondaryColor: '#007BB3',
    textColor: '#FFFFFF',
    logo: 'MERCADO PAGO',
    accentColor: '#FFE600',
  },
  'DIDI': {
    primaryColor: '#FF7A00',
    secondaryColor: '#CC6200',
    textColor: '#FFFFFF',
    logo: 'DiDi',
    accentColor: '#FFFFFF',
  },
  'BANBAJIO': {
    primaryColor: '#003366',
    secondaryColor: '#002244',
    textColor: '#FFFFFF',
    logo: 'BANBAJÍO',
    accentColor: '#00A5E3',
  },
  'BANCO AZTECA': {
    primaryColor: '#00A650',
    secondaryColor: '#007A3D',
    textColor: '#FFFFFF',
    logo: 'AZTECA',
    accentColor: '#FFD700',
  },
  'UALA': {
    primaryColor: '#7B68EE',
    secondaryColor: '#5B48CE',
    textColor: '#FFFFFF',
    logo: 'UALÁ',
    accentColor: '#00E5FF',
  },
  'STP': {
    primaryColor: '#1E3A5F',
    secondaryColor: '#0F1F33',
    textColor: '#FFFFFF',
    logo: 'STP',
    accentColor: '#00A5E3',
  },
  'NU': {
    primaryColor: '#820AD1',
    secondaryColor: '#5A0094',
    textColor: '#FFFFFF',
    logo: 'Nu',
    accentColor: '#FFFFFF',
  },
  'HEY BANCO': {
    primaryColor: '#00C389',
    secondaryColor: '#009969',
    textColor: '#FFFFFF',
    logo: 'HEY BANCO',
    accentColor: '#FFFFFF',
  },
  'RAPPI': {
    primaryColor: '#FF441F',
    secondaryColor: '#CC3319',
    textColor: '#FFFFFF',
    logo: 'RAPPI',
    accentColor: '#FFFFFF',
  },
  'INVEX': {
    primaryColor: '#1A237E',
    secondaryColor: '#0D1642',
    textColor: '#FFFFFF',
    logo: 'INVEX',
    accentColor: '#00A5E3',
  },
  'AFIRME': {
    primaryColor: '#003D79',
    secondaryColor: '#002952',
    textColor: '#FFFFFF',
    logo: 'AFIRME',
    accentColor: '#FFD700',
  },
  'BAJÍO': {
    primaryColor: '#003366',
    secondaryColor: '#002244',
    textColor: '#FFFFFF',
    logo: 'BAJÍO',
    accentColor: '#00A5E3',
  },
  'RECUPERACIÓN DE CAPITAL': {
    primaryColor: '#0d2137',
    secondaryColor: '#1a5276',
    textColor: '#FFFFFF',
    logo: 'RC',
    accentColor: '#FFD700',
  },
};

// Get bank config with fallback to default
export const getBankConfig = (bankName: string): BankConfig => {
  const upperBankName = bankName?.toUpperCase() || '';
  return BANK_CONFIGS[upperBankName] || BANK_CONFIGS['RECUPERACIÓN DE CAPITAL'];
};

// Detect card type based on card number (first digit)
export const detectCardType = (cardNumber: string): 'visa' | 'mastercard' => {
  if (!cardNumber) return 'visa';
  const firstDigit = cardNumber.charAt(0);
  // Visa starts with 4
  // MasterCard starts with 5 or 2
  if (firstDigit === '5' || firstDigit === '2') {
    return 'mastercard';
  }
  return 'visa';
};

// List of all available banks (sorted alphabetically, most popular first)
export const AVAILABLE_BANKS = [
  'BBVA',
  'BANORTE',
  'CITIBANAMEX',
  'SANTANDER',
  'HSBC',
  'SCOTIABANK',
  'INBURSA',
  'BANREGIO',
  'BANCO AZTECA',
  'BANCOPPEL',
  'BANBAJIO',
  'AFIRME',
  'HEY BANCO',
  'INVEX',
  'NU',
  'STORI',
  'KLAR',
  'ALBO',
  'UALA',
  'RAPPI',
  'MERCADO PAGO',
  'SPIN BY OXXO',
  'DIDI',
  'STP',
];

// Get bank icon (for displaying in lists)
export const getBankIcon = (bankName: string): string => {
  const config = getBankConfig(bankName);
  return config.logo;
};
