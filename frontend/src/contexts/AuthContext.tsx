import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
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
  isAuthenticated: boolean;
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
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Función para guardar credenciales en storage
  const saveAuthToStorage = useCallback(async (authToken: string, authUser: User) => {
    try {
      await AsyncStorage.setItem(AUTH_TOKEN_KEY, authToken);
      await AsyncStorage.setItem(AUTH_USER_KEY, JSON.stringify(authUser));
      console.log('[Auth] Credenciales guardadas en storage');
    } catch (error) {
      console.error('[Auth] Error guardando credenciales:', error);
    }
  }, []);

  // Función para limpiar credenciales del storage
  const clearAuthFromStorage = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(AUTH_TOKEN_KEY);
      await AsyncStorage.removeItem(AUTH_USER_KEY);
      console.log('[Auth] Credenciales eliminadas del storage');
    } catch (error) {
      console.error('[Auth] Error eliminando credenciales:', error);
    }
  }, []);

  // Función para cargar credenciales guardadas
  const loadStoredAuth = useCallback(async () => {
    try {
      const storedToken = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
      const storedUser = await AsyncStorage.getItem(AUTH_USER_KEY);
      
      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser) as User;
        console.log('[Auth] Credenciales recuperadas del storage:', parsedUser.email);
        setToken(storedToken);
        setUser(parsedUser);
        setIsAuthenticated(true);
        return true;
      }
    } catch (error) {
      console.error('[Auth] Error cargando credenciales:', error);
    }
    return false;
  }, []);

  // Inicializar servidor y mantenerlo activo
  useEffect(() => {
    let mounted = true;
    
    const initServer = async () => {
      try {
        // Primero cargar credenciales guardadas
        await loadStoredAuth();
        
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
  }, [loadStoredAuth]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Asegurar servidor despierto antes de login
      await warmUpServer();
      const data = await apiCall('/auth/login', 'POST', { email, password });
      console.log('[Auth] Login exitoso:', data.user?.email);
      
      // Guardar en storage primero
      await saveAuthToStorage(data.token, data.user);
      
      // Luego actualizar estado (esto disparará el re-render)
      setToken(data.token);
      setUser(data.user);
      setIsAuthenticated(true);
      
      console.log('[Auth] Estado actualizado - usuario autenticado');
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
      console.log('[Auth] Registro exitoso:', data.user?.email, '- Token recibido:', !!data.token);
      
      if (!data.token || !data.user) {
        throw new Error('Respuesta inválida del servidor');
      }
      
      // Guardar en storage primero
      await saveAuthToStorage(data.token, data.user);
      
      // Luego actualizar estado (esto disparará el re-render y navegará automáticamente)
      setToken(data.token);
      setUser(data.user);
      setIsAuthenticated(true);
      
      console.log('[Auth] Estado actualizado después de registro - usuario:', data.user.email, '- autenticado:', true);
    } catch (error: any) {
      console.error('[Auth] Error en registro:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    console.log('[Auth] Cerrando sesión');
    clearAuthFromStorage();
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoading, serverReady, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
