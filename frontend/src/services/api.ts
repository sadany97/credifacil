// API Configuration - Sistema de conexión ultra-robusto
import Constants from 'expo-constants';

// URL del servidor - Usar variable de entorno
const getApiUrl = (): string => {
  // Prioridad: 1) Constants.expoConfig, 2) process.env, 3) fallback a Render.com
  const backendUrl = Constants.expoConfig?.extra?.EXPO_PUBLIC_BACKEND_URL 
    || process.env.EXPO_PUBLIC_BACKEND_URL 
    || 'https://recuperacion-capital-1.onrender.com';
  
  console.log('[API] Using backend URL:', backendUrl);
  return backendUrl;
};

const API_URL = getApiUrl();

// Estado global del servidor
let serverAwake = false;
let lastWakeCheck = 0;
let isWakingUp = false;
let wakeUpPromise: Promise<boolean> | null = null;

// Despertar el servidor con múltiples llamadas en PARALELO
const wakeUpServerParallel = async (): Promise<boolean> => {
  const attempts = 5;
  const promises: Promise<boolean>[] = [];
  
  for (let i = 0; i < attempts; i++) {
    promises.push(
      (async () => {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 10000);
          
          const response = await fetch(`${API_URL}/api/health`, {
            method: 'GET',
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          return response.ok;
        } catch {
          return false;
        }
      })()
    );
    // Pequeño delay entre cada llamada paralela
    await new Promise(r => setTimeout(r, 200));
  }
  
  const results = await Promise.all(promises);
  return results.some(r => r === true);
};

// Despertar el servidor - sistema principal
const wakeUpServer = async (): Promise<boolean> => {
  const now = Date.now();
  
  // Si ya verificamos recientemente, asumir que está despierto
  if (serverAwake && (now - lastWakeCheck) < 15000) {
    return true;
  }
  
  // Si ya hay un proceso de wake-up en curso, esperar a que termine
  if (isWakingUp && wakeUpPromise) {
    return wakeUpPromise;
  }
  
  isWakingUp = true;
  
  wakeUpPromise = (async () => {
    // Fase 1: Intentos rápidos en paralelo
    for (let round = 0; round < 3; round++) {
      const success = await wakeUpServerParallel();
      if (success) {
        serverAwake = true;
        lastWakeCheck = Date.now();
        isWakingUp = false;
        return true;
      }
      // Esperar entre rondas
      await new Promise(r => setTimeout(r, 2000));
    }
    
    // Fase 2: Intentos secuenciales más largos
    const maxAttempts = 20;
    for (let i = 0; i < maxAttempts; i++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000);
        
        const response = await fetch(`${API_URL}/api/health`, {
          method: 'GET',
          signal: controller.signal,
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
          serverAwake = true;
          lastWakeCheck = Date.now();
          isWakingUp = false;
          return true;
        }
      } catch {
        // Continuar intentando
      }
      
      // Esperar antes del siguiente intento
      const delay = Math.min(1000 + (i * 500), 5000);
      await new Promise(r => setTimeout(r, delay));
    }
    
    isWakingUp = false;
    return false;
  })();
  
  return wakeUpPromise;
};

// Ejecutar request con sistema de retry ultra-robusto
const executeRequest = async (
  url: string,
  config: RequestInit,
  maxRetries: number = 10
): Promise<Response> => {
  let lastError: any = null;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      // Si el servidor responde, marcarlo como despierto
      serverAwake = true;
      lastWakeCheck = Date.now();
      
      return response;
    } catch (error: any) {
      lastError = error;
      serverAwake = false;
      
      if (attempt < maxRetries - 1) {
        // Despertar el servidor antes del siguiente intento
        await wakeUpServer();
        // Pequeña pausa adicional
        await new Promise(r => setTimeout(r, 500));
      }
    }
  }
  
  throw lastError;
};

export const apiCall = async (
  endpoint: string, 
  method: string = 'GET', 
  body?: any, 
  token?: string | null
) => {
  // Siempre asegurar que el servidor esté despierto antes de cualquier operación
  await wakeUpServer();
  
  const headers: any = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const config: RequestInit = { method, headers };
  if (body) config.body = JSON.stringify(body);

  const response = await executeRequest(`${API_URL}/api${endpoint}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.detail || 'Error');
  }
  
  return data;
};

// Función para pre-calentar el servidor
export const warmUpServer = async (): Promise<boolean> => {
  return await wakeUpServer();
};

// Mantener el servidor activo con pings frecuentes
let keepAliveInterval: ReturnType<typeof setInterval> | null = null;

export const startKeepAlive = () => {
  if (keepAliveInterval) return;
  
  // Ping cada 15 segundos para mantener servidor SIEMPRE activo
  keepAliveInterval = setInterval(async () => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      await fetch(`${API_URL}/api/health`, {
        method: 'GET',
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      serverAwake = true;
      lastWakeCheck = Date.now();
    } catch {
      serverAwake = false;
      // Si falla, intentar despertar inmediatamente
      wakeUpServer();
    }
  }, 15000);
  
  // También hacer ping inmediato al iniciar
  fetch(`${API_URL}/api/health`, { method: 'GET' }).catch(() => {});
};

export const stopKeepAlive = () => {
  if (keepAliveInterval) {
    clearInterval(keepAliveInterval);
    keepAliveInterval = null;
  }
};

export { API_URL };
