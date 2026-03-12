import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import { dypai } from '../lib/dypai';
import BiometricService from '../services/BiometricService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [biometricAvailable, setBiometricAvailable] = useState(null);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const mountedRef = useRef(true);

  // Función helper para verificar token y hacer logout si es necesario
  const checkTokenAndLogout = async () => {
    if (loading) return false;

    // Solo loguear si encontramos una inconsistencia para no llenar la consola
    if (user && !token) {
      console.log('🚨 ALERTA: Usuario presente pero TOKEN FALTANTE. Estado inconsistente.');
      console.log('User ID:', user.id);
      console.log('Token value:', token);
      
      if (mountedRef.current) {
        setUser(null);
        setToken(null);
      }
      try {
        await dypai.auth.logout();
      } catch (error) {
        console.warn('Error al hacer logout automático:', error);
      }
      return true;
    }
    return false;
  };

  useEffect(() => {
    mountedRef.current = true;

    const initAuth = async () => {
      try {
        const biometricStatus = await BiometricService.isAvailable();
        const enabled = await BiometricService.isBiometricEnabled();
        
        if (mountedRef.current) {
          setBiometricAvailable(biometricStatus);
          setBiometricEnabled(enabled);
        }
      } catch (error) {
        console.error('Error inicializando autenticación:', error);
        if (mountedRef.current) {
          setUser(null);
          setToken(null);
        }
      }
    };

    initAuth();

    const authResult = dypai.auth.onAuthStateChange(async (event, session) => {
      if (!mountedRef.current) return;

      if (session && session.user && session.access_token) {
        setUser(session.user);
        setToken(session.access_token);
        setLoading(false);
      } else if (event === 'SIGNED_OUT' || (event === 'INITIAL_SESSION' && !session)) {
        setUser(null);
        setToken(null);
        setLoading(false);
      }
    });

    const subscription = authResult?.data?.subscription || authResult?.subscription;

    return () => {
      mountedRef.current = false;
      if (subscription && subscription.unsubscribe) {
        subscription.unsubscribe();
      }
    };
  }, []);

  // Efecto de seguridad con debounce
  useEffect(() => {
    if (!loading && user && !token) {
        const timer = setTimeout(() => {
            checkTokenAndLogout();
        }, 1500);
        return () => clearTimeout(timer);
    }
  }, [user, token, loading]);

  const login = async ({ email, password, saveBiometric = false }) => {
    try {
      const response = await dypai.auth.login({ email, password });
      
      // El SDK retorna { token, refreshToken, user }
      const newUser = response.user;
      const newToken = response.token;
      
      // El SDK guarda automáticamente en storage
      // onAuthStateChange se disparará con la sesión completa
      // Por ahora establecemos el estado directamente para respuesta inmediata
      if (mountedRef.current && newUser && newToken) {
        setUser(newUser);
        setToken(newToken);
      }
      
      if (saveBiometric && newToken) {
        try {
          await BiometricService.enableBiometric(email, password);
          setBiometricEnabled(true);
        } catch (biometricError) {
          console.warn('No se pudo habilitar biometría:', biometricError);
        }
      }
      
      return {
        token: newToken,
        user: newUser,
      };
    } catch (error) {
      console.error('Error en login:', error);
      throw error;
    }
  };

  const signInWithOtp = async (phone) => {
    try {
      return await dypai.auth.signInWithOtp({ phone });
    } catch (error) {
      console.error('Error solicitando OTP:', error);
      throw error;
    }
  };

  const verifyOtp = async (phone, token) => {
    try {
      const { data, error } = await dypai.auth.verifyOtp({
        phone,
        token,
        type: 'sms'
      });

      if (error) throw error;

      // El SDK gestiona la sesión automáticamente tras verifyOtp
      if (mountedRef.current && data?.user && data?.access_token) {
        setUser(data.user);
        setToken(data.access_token);
      }

      return data;
    } catch (error) {
      console.error('Error verificando OTP:', error);
      throw error;
    }
  };

  const loginWithBiometric = async () => {
    try {
      const enabled = await BiometricService.isBiometricEnabled();
      if (!enabled) throw new Error('Autenticación biométrica no habilitada');

      const credentials = await BiometricService.getCredentials();
      if (!credentials) throw new Error('No hay credenciales guardadas');

      const authResult = await BiometricService.authenticate({
        promptMessage: 'Autentícate para iniciar sesión',
      });

      if (!authResult.success) throw new Error('Autenticación biométrica cancelada');

      return await login({
        email: credentials.email,
        password: credentials.password,
        saveBiometric: false,
      });
    } catch (error) {
      console.error('Error en login biométrico:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      await dypai.auth.logout();
      // El SDK limpia storage automáticamente
      // onAuthStateChange se disparará con session = null
      if (mountedRef.current) {
        setUser(null);
        setToken(null);
      }
    } catch (error) {
      console.error('Error en logout:', error);
      throw error;
    }
  };

  const register = async ({ email, password, username }) => {
    try {
      const response = await dypai.auth.register({
        email,
        password,
        user_data: { username },
      });
      
      const registerToken = response.token;
      
      // El SDK guarda automáticamente
      // onAuthStateChange se disparará con la sesión completa
      if (mountedRef.current && response.user && registerToken) {
        setUser(response.user);
        setToken(registerToken);
      }
      
      return {
        token: registerToken,
        user: response.user,
      };
    } catch (error) {
      console.error('Error en registro:', error);
      throw error;
    }
  };

  const recoverPassword = async ({ email }) => {
    try {
      return await dypai.auth.recoverPassword({ email });
    } catch (error) {
      console.error('Error recuperando contraseña:', error);
      throw error;
    }
  };

  const getAppUser = async () => {
    try {
      return await dypai.auth.me();
    } catch (error) {
      console.error('Error obteniendo usuario:', error);
      throw error;
    }
  };

  const enableBiometric = async (email, password) => {
    try {
      await BiometricService.enableBiometric(email, password);
      setBiometricEnabled(true);
      return true;
    } catch (error) {
      console.error('Error habilitando biometría:', error);
      throw error;
    }
  };

  const disableBiometric = async () => {
    try {
      await BiometricService.disableBiometric();
      setBiometricEnabled(false);
      return true;
    } catch (error) {
      console.error('Error deshabilitando biometría:', error);
      throw error;
    }
  };

  // isAuthenticated requiere ambos
  const isAuthenticated = !!(user && token);

  const value = {
    user,
    token,
    loading,
    isAuthenticated,
    login,
    signInWithOtp,
    verifyOtp,
    loginWithBiometric,
    logout,
    register,
    recoverPassword,
    getAppUser,
    biometricAvailable,
    biometricEnabled,
    enableBiometric,
    disableBiometric,
    checkTokenAndLogout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
