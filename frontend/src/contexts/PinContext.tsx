import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PinContextType {
  isPinEnabled: boolean;
  isPinLocked: boolean;
  setPin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  enablePin: () => void;
  disablePin: () => Promise<void>;
  unlockApp: () => void;
  lockApp: () => void;
}

const PinContext = createContext<PinContextType | undefined>(undefined);

export const PinProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isPinEnabled, setIsPinEnabled] = useState(false);
  const [isPinLocked, setIsPinLocked] = useState(false);
  const [storedPin, setStoredPin] = useState<string | null>(null);

  useEffect(() => {
    loadPinSettings();
  }, []);

  const loadPinSettings = async () => {
    try {
      const pin = await AsyncStorage.getItem('app_pin');
      const enabled = await AsyncStorage.getItem('pin_enabled');
      if (pin && enabled === 'true') {
        setStoredPin(pin);
        setIsPinEnabled(true);
        setIsPinLocked(true);
      }
    } catch (error) {
      console.log('Error loading PIN settings:', error);
    }
  };

  const setPin = async (pin: string) => {
    try {
      await AsyncStorage.setItem('app_pin', pin);
      await AsyncStorage.setItem('pin_enabled', 'true');
      setStoredPin(pin);
      setIsPinEnabled(true);
    } catch (error) {
      console.log('Error setting PIN:', error);
    }
  };

  const verifyPin = async (pin: string): Promise<boolean> => {
    return pin === storedPin;
  };

  const enablePin = () => {
    setIsPinEnabled(true);
  };

  const disablePin = async () => {
    try {
      await AsyncStorage.removeItem('app_pin');
      await AsyncStorage.setItem('pin_enabled', 'false');
      setStoredPin(null);
      setIsPinEnabled(false);
      setIsPinLocked(false);
    } catch (error) {
      console.log('Error disabling PIN:', error);
    }
  };

  const unlockApp = () => {
    setIsPinLocked(false);
  };

  const lockApp = () => {
    if (isPinEnabled) {
      setIsPinLocked(true);
    }
  };

  return (
    <PinContext.Provider value={{
      isPinEnabled,
      isPinLocked,
      setPin,
      verifyPin,
      enablePin,
      disablePin,
      unlockApp,
      lockApp,
    }}>
      {children}
    </PinContext.Provider>
  );
};

export const usePin = () => {
  const context = useContext(PinContext);
  if (!context) {
    throw new Error('usePin must be used within a PinProvider');
  }
  return context;
};
