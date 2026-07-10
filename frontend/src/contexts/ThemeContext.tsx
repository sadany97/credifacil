import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useColorScheme, Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemeMode = 'light' | 'dark' | 'system';

interface ThemeColors {
  primary: string;
  primaryLight: string;
  secondary: string;
  accent: string;
  accentLight: string;
  success: string;
  successLight: string;
  warning: string;
  warningLight: string;
  danger: string;
  background: string;
  card: string;
  text: string;
  textLight: string;
  textMuted: string;
  border: string;
  gold: string;
  goldLight: string;
  platinum: string;
  gradientStart: string;
  gradientEnd: string;
  inputBg: string;
}

export const lightColors: ThemeColors = {
  primary: '#1B5E20',
  primaryLight: '#2E7D32',
  secondary: '#4CAF50',
  accent: '#1976D2',
  accentLight: '#42A5F5',
  success: '#4CAF50',
  successLight: '#81C784',
  warning: '#FF9800',
  warningLight: '#FFB74D',
  danger: '#F44336',
  background: '#F5F5F5',
  card: '#FFFFFF',
  text: '#212121',
  textLight: '#616161',
  textMuted: '#9E9E9E',
  border: '#E0E0E0',
  gold: '#FFC107',
  goldLight: '#FFD54F',
  platinum: '#E8E8E8',
  gradientStart: '#1B5E20',
  gradientEnd: '#4CAF50',
  inputBg: '#F5F5F5',
};

export const darkColors: ThemeColors = {
  primary: '#2E7D32',
  primaryLight: '#4CAF50',
  secondary: '#66BB6A',
  accent: '#42A5F5',
  accentLight: '#64B5F6',
  success: '#66BB6A',
  successLight: '#81C784',
  warning: '#FFB74D',
  warningLight: '#FFCC80',
  danger: '#EF5350',
  background: '#121212',
  card: '#1E1E1E',
  text: '#FAFAFA',
  textLight: '#BDBDBD',
  textMuted: '#757575',
  border: '#424242',
  gold: '#FFD54F',
  goldLight: '#FFE082',
  platinum: '#424242',
  gradientStart: '#1B5E20',
  gradientEnd: '#2E7D32',
  inputBg: '#2C2C2C',
};

interface ThemeContextType {
  isDark: boolean;
  colors: ThemeColors;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@credifacil_theme_mode';

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>('light');
  const [isLoaded, setIsLoaded] = useState(false);

  // Cargar tema guardado al inicio
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
          setThemeModeState(savedTheme as ThemeMode);
        }
      } catch (e) {
        console.log('Error loading theme:', e);
      } finally {
        setIsLoaded(true);
      }
    };
    loadTheme();
  }, []);

  // Escuchar cambios del sistema
  useEffect(() => {
    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (themeMode === 'system') {
        // Forzar re-render cuando cambia el tema del sistema
      }
    });
    return () => subscription.remove();
  }, [themeMode]);

  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (e) {
      console.log('Error saving theme:', e);
    }
  };

  const toggleTheme = () => {
    const newMode = themeMode === 'light' ? 'dark' : 'light';
    setThemeMode(newMode);
  };

  const isDark = themeMode === 'system' 
    ? systemColorScheme === 'dark' 
    : themeMode === 'dark';

  const colors = isDark ? darkColors : lightColors;

  if (!isLoaded) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ isDark, colors, themeMode, setThemeMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export default ThemeContext;
