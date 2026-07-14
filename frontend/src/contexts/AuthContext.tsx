import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiCall, warmUpServer, startKeepAlive, stopKeepAlive } from '../services/api';

const AUTH_TOKEN_KEY = '@credifacil_auth_token';
const AUTH_USER_KEY = '@credifacil_auth_user';

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
  const [isLoading, setIsLoading] = useState(true); // Empieza en true para cargar credenciales
  const [serverReady, setServerReady] = useState(false);

  // Cargar credenciales guardadas al inicio
  useEffect(() => {
    let mounted = true;
    
    const initialize = async () => {
      try {
        // Cargar credenciales guardadas
        const storedToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
        const storedUser = await AsyncStorage.getItem(AUTH_USER_KEY);
        
        if (storedToken && storedUser && mounted) {
          const parsedUser = JSON.parse(storedUser) as User;
          console.log('[Auth] Credenciales recuperadas:', parsedUser.email);
          setToken(storedToken);
          setUser(parsedUser);
        }
      } catch (error) {
        console.error('[Auth] Error cargando credenciales:', error);
      } finally {
        // IMPORTANTE: Quitar loading INMEDIATAMENTE para mostrar la app
        if (mounted) setIsLoading(false);
      }
      
      // Despertar servidor EN SEGUNDO PLANO (no bloquea la app)
      try {
        const ready = await warmUpServer();
        if (mounted) {
          setServerReady(ready);
          if (ready) startKeepAlive();
        }
      } catch (error) {
        console.error('[Auth] Error conectando servidor:', error);
      }
    };
    
    initialize();
    
    // Manejar cuando la app vuelve al primer plano
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
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
    try {
      await warmUpServer();
      const data = await apiCall('/auth/login', 'POST', { email, password });
      console.log('[Auth] Login exitoso:', data.user?.email);
      
      // Guardar en storage
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, data.token);
      await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
      
      // Actualizar estado - ESTO DISPARA EL RE-RENDER
      setToken(data.token);
      setUser(data.user);
    } catch (error: any) {
      console.error('[Auth] Error en login:', error);
      throw error;
    }
  };

  const register = async (email: string, password: string, name: string, phone: string) => {
    try {
      await warmUpServer();
      const data = await apiCall('/auth/register', 'POST', { email, password, name, phone });
      console.log('[Auth] Registro exitoso:', data.user?.email);
      
      if (!data.token || !data.user) {
        throw new Error('Respuesta inválida del servidor');
      }
      
      // Guardar en storage PRIMERO
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, data.token);
      await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));
      console.log('[Auth] Credenciales guardadas en storage');
      
      // Actualizar estado - ESTO DISPARA EL RE-RENDER Y NAVEGA AL DASHBOARD
      setToken(data.token);
      setUser(data.user);
      console.log('[Auth] Estado actualizado, usuario debería ver Dashboard ahora');
    } catch (error: any) {
      console.error('[Auth] Error en registro:', error);
      throw error;
    }
  };

  const logout = async () => {
    console.log('[Auth] Cerrando sesión');
    try {
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      await AsyncStorage.removeItem(AUTH_USER_KEY);
    } catch (error) {
      console.error('[Auth] Error al limpiar storage:', error);
    }
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
