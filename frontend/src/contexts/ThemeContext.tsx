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
}

export const lightColors: ThemeColors = {
  primary: '#0d2137',
  primaryLight: '#1a3a5c',
  secondary: '#0f4c75',
  accent: '#3282b8',
  accentLight: '#5da4d9',
  success: '#00a878',
  successLight: '#00c896',
  warning: '#f59e0b',
  warningLight: '#fbbf24',
  danger: '#ef4444',
  background: '#f0f4f8',
  card: '#ffffff',
  text: '#1e293b',
  textLight: '#64748b',
  textMuted: '#94a3b8',
  border: '#e2e8f0',
  gold: '#c9a227',
  goldLight: '#dbb42c',
  platinum: '#e5e7eb',
  gradientStart: '#0d2137',
  gradientEnd: '#1a5276',
};

export const darkColors: ThemeColors = {
  primary: '#1a3a5c',
  primaryLight: '#2a5a8c',
  secondary: '#1a6aa5',
  accent: '#4da8e8',
  accentLight: '#7dc4f9',
  success: '#00c896',
  successLight: '#00e8b6',
  warning: '#fbbf24',
  warningLight: '#fcd34d',
  danger: '#f87171',
  background: '#0a0f14',
  card: '#141e28',
  text: '#f1f5f9',
  textLight: '#94a3b8',
  textMuted: '#64748b',
  border: '#1e293b',
  gold: '#dbb42c',
  goldLight: '#edc346',
  platinum: '#374151',
  gradientStart: '#0a1929',
  gradientEnd: '#0d2137',
};

interface ThemeContextType {
  isDark: boolean;
  colors: ThemeColors;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = '@recuperacion_theme_mode';

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
