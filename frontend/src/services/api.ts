// API Configuration - Versión simplificada y confiable
import Constants from 'expo-constants';

// URL del servidor
const API_URL = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL 
  || process.env.EXPO_PUBLIC_BACKEND_URL 
  || 'https://credifacil-api-cr8u.onrender.com';

console.log('[API] Backend URL:', API_URL);

export const apiCall = async (
  endpoint: string, 
  method: string = 'GET', 
  body?: any, 
  token?: string | null
) => {
  const url = `${API_URL}/api${endpoint}`;
  console.log(`[API] ${method} ${url}`);
  
  const headers: any = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const config: RequestInit = { method, headers };
  if (body) config.body = JSON.stringify(body);

  try {
    const response = await fetch(url, config);
    const data = await response.json();
    
    console.log(`[API] Response status: ${response.status}`);

    if (!response.ok) {
      throw new Error(data.detail || data.message || 'Error del servidor');
    }
    
    return data;
  } catch (error: any) {
    console.error('[API] Error:', error.message);
    if (error.message === 'Network request failed') {
      throw new Error('Sin conexión a internet. Verifica tu conexión.');
    }
    throw error;
  }
};

// Función simple para verificar servidor
export const warmUpServer = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${API_URL}/api/health`, { method: 'GET' });
    return response.ok;
  } catch {
    return false;
  }
};

// Keep alive simplificado
let keepAliveInterval: ReturnType<typeof setInterval> | null = null;

export const startKeepAlive = () => {
  if (keepAliveInterval) return;
  keepAliveInterval = setInterval(() => {
    fetch(`${API_URL}/api/health`, { method: 'GET' }).catch(() => {});
  }, 30000);
};

export const stopKeepAlive = () => {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
  }
};

export { API_URL };
