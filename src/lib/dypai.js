/**
 * Cliente DYPAI para React Native
 * Usa el paquete oficial @dypai-ai/client-sdk
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@dypai-ai/client-sdk';

// Polyfill para window.addEventListener en React Native
if (typeof window === 'undefined') {
  global.window = global;
}

if (!window.addEventListener) {
  window.addEventListener = () => {};
  window.removeEventListener = () => {};
}

// Configuración por defecto
const API_URL = process.env.EXPO_PUBLIC_DYPAI_API_URL || 'https://api.dypai.ai';
const API_KEY = process.env.EXPO_PUBLIC_DYPAI_API_KEY || '';

const finalApiUrl = String(API_URL).trim();
const finalApiKey = String(API_KEY).trim();

// Definir objeto dummy por defecto
const dummyClient = {
  auth: {
    session: null,
    user: null,
    logout: async () => {},
    login: async () => ({ user: null, token: null }),
    register: async () => ({ user: null, token: null }),
    signInWithOtp: async () => ({ success: true, data: { message: 'OTP enviado (Simulado)' } }),
    verifyOtp: async () => ({ data: { user: { id: 'dummy-user', email: 'test@example.com' }, access_token: 'dummy-token' }, error: null }),
    recoverPassword: async () => ({ success: true }),
    me: async () => ({ id: 'dummy-user', email: 'test@example.com' }),
    onAuthStateChange: (callback) => {
      if (callback) {
        callback('INITIAL_SESSION', null);
      }
      return { 
        data: { subscription: { unsubscribe: () => {} } } 
      };
    },
    getSession: async () => ({ data: { session: null }, error: null }),
    getUser: async () => ({ data: { user: null }, error: null }),
  },
  api: {
    get: async () => ({ data: [] }),
    post: async () => ({ success: true }),
    put: async () => ({ success: true }),
    delete: async () => ({ success: true }),
  },
};

let dypaiInstance = dummyClient;

if (finalApiUrl && finalApiKey) {
  try {
    dypaiInstance = createClient(
      finalApiUrl,
      finalApiKey,
      {
        auth: {
          storage: AsyncStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      }
    );
    
    // Asegurar que api siempre existe incluso en el real
    if (!dypaiInstance.api) {
      dypaiInstance.api = dummyClient.api;
    }
  } catch (error) {
    console.error('Error creando cliente DYPAI:', error);
    dypaiInstance = dummyClient;
  }
}

export const dypai = dypaiInstance;

/**
 * Función helper para llamar a endpoints de la aplicación
 */
export const callEndpoint = async (endpointName, params = {}, method = 'GET') => {
  if (finalApiKey && dypaiInstance.auth?.session) {
    try {
      const session = dypaiInstance.auth.session;
      const token = session?.access_token;
      const user = dypaiInstance.auth.user;
      let appId = user?.app_id || process.env.EXPO_PUBLIC_DYPAI_APP_ID || '';
      
      let endpointUrl = appId 
        ? `${finalApiUrl}/api/apps/${appId}/endpoints/${endpointName}/call`
        : `${finalApiUrl}/api/endpoints/${endpointName}/call`;

      const response = await fetch(endpointUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ method, ...(method === 'GET' ? { query: params } : { body: params }) }),
      });

      if (!response.ok) throw new Error(`Error ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error(`Error calling ${endpointName}:`, error);
      throw error;
    }
  } else {
    return { data: [] };
  }
};

export default dypai;
