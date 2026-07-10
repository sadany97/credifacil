import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { apiCall, warmUpServer, startKeepAlive, stopKeepAlive } from '../services/api';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string, phone: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  serverReady: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [serverReady, setServerReady] = useState(false);

  // Inicializar servidor y mantenerlo activo
  useEffect(() => {
    let mounted = true;
    
    const initServer = async () => {
      try {
        const ready = await warmUpServer();
        if (mounted) {
          setServerReady(ready);
          if (ready) {
            startKeepAlive();
          }
        }
      } catch {
        // Reintentar
        if (mounted) {
          setTimeout(initServer, 3000);
        }
      }
    };
    
    initServer();
    
    // Manejar cuando la app vuelve al primer plano
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        // App volvió al primer plano - despertar servidor inmediatamente
        warmUpServer().then(ready => {
          if (mounted) setServerReady(ready);
        });
        startKeepAlive();
      } else if (nextAppState === 'background') {
        stopKeepAlive();
      }
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      mounted = false;
      stopKeepAlive();
      subscription?.remove();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Asegurar servidor despierto antes de login
      await warmUpServer();
      const data = await apiCall('/auth/login', 'POST', { email, password });
      console.log('[Auth] Login exitoso:', data.user?.email);
      setUser(data.user);
      setToken(data.token);
    } catch (error: any) {
      console.error('[Auth] Error en login:', error);
      throw error; // Re-lanzar para que el componente de login maneje el error
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string, phone: string) => {
    setIsLoading(true);
    try {
      // Asegurar servidor despierto antes de registro
      await warmUpServer();
      const data = await apiCall('/auth/register', 'POST', { email, password, name, phone });
      console.log('[Auth] Registro exitoso:', data.user?.email);
      setUser(data.user);
      setToken(data.token);
    } catch (error: any) {
      console.error('[Auth] Error en registro:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoading, serverReady }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
