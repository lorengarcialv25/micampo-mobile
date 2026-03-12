/**
 * Servicio de Autenticación Biométrica
 * Maneja la autenticación con huella dactilar, Face ID, etc.
 */

import { Platform } from 'react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

// SecureStore no está disponible en web
const isSecureStoreAvailable = Platform.OS !== 'web' && SecureStore.getItemAsync;

const CREDENTIALS_KEY = 'biometric_credentials';
const BIOMETRIC_ENABLED_KEY = 'biometric_enabled';

class BiometricService {
  /**
   * Verifica si el dispositivo soporta autenticación biométrica
   */
  async isAvailable() {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      if (!compatible) {
        return { available: false, reason: 'El dispositivo no soporta autenticación biométrica' };
      }

      const enrolled = await LocalAuthentication.isEnrolledAsync();
      if (!enrolled) {
        return { available: false, reason: 'No hay biometría configurada en el dispositivo' };
      }

      const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
      return {
        available: true,
        types,
        typeName: this.getBiometricTypeName(types),
      };
    } catch (error) {
      console.error('Error verificando disponibilidad biométrica:', error);
      return { available: false, reason: 'Error al verificar biometría' };
    }
  }

  /**
   * Obtiene el nombre legible del tipo de biometría
   */
  getBiometricTypeName(types) {
    if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      return 'Face ID';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      return 'Huella dactilar';
    }
    if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      return 'Iris';
    }
    return 'Biometría';
  }

  /**
   * Autentica al usuario usando biometría
   */
  async authenticate(options = {}) {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: options.promptMessage || 'Autentícate para continuar',
        cancelLabel: options.cancelLabel || 'Cancelar',
        disableDeviceFallback: false,
        fallbackLabel: options.fallbackLabel || 'Usar contraseña',
      });

      return {
        success: result.success,
        error: result.error,
      };
    } catch (error) {
      console.error('Error en autenticación biométrica:', error);
      return {
        success: false,
        error: error.message || 'Error al autenticar',
      };
    }
  }

  /**
   * Guarda las credenciales de forma segura
   */
  async saveCredentials(email, password) {
    try {
      // SecureStore no está disponible en web
      if (!isSecureStoreAvailable) {
        console.warn('SecureStore no disponible en esta plataforma');
        return false;
      }
      const credentials = JSON.stringify({ email, password });
      await SecureStore.setItemAsync(CREDENTIALS_KEY, credentials);
      await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');
      return true;
    } catch (error) {
      console.error('Error guardando credenciales:', error);
      return false;
    }
  }

  /**
   * Obtiene las credenciales guardadas
   */
  async getCredentials() {
    try {
      // SecureStore no está disponible en web
      if (!isSecureStoreAvailable) {
        return null;
      }
      const credentials = await SecureStore.getItemAsync(CREDENTIALS_KEY);
      if (!credentials) {
        return null;
      }
      return JSON.parse(credentials);
    } catch (error) {
      console.error('Error obteniendo credenciales:', error);
      return null;
    }
  }

  /**
   * Elimina las credenciales guardadas
   */
  async deleteCredentials() {
    try {
      // SecureStore no está disponible en web
      if (!isSecureStoreAvailable) {
        return false;
      }
      await SecureStore.deleteItemAsync(CREDENTIALS_KEY);
      await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
      return true;
    } catch (error) {
      console.error('Error eliminando credenciales:', error);
      return false;
    }
  }

  /**
   * Verifica si la autenticación biométrica está habilitada
   */
  async isBiometricEnabled() {
    try {
      // SecureStore no está disponible en web
      if (!isSecureStoreAvailable) {
        return false;
      }
      const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
      return enabled === 'true';
    } catch (error) {
      console.error('Error verificando estado biométrico:', error);
      return false;
    }
  }

  /**
   * Habilita la autenticación biométrica
   */
  async enableBiometric(email, password) {
    const available = await this.isAvailable();
    if (!available.available) {
      throw new Error(available.reason || 'Biometría no disponible');
    }

    // Primero autenticamos con biometría para confirmar
    const authResult = await this.authenticate({
      promptMessage: 'Confirma tu identidad para habilitar el inicio de sesión biométrico',
    });

    if (!authResult.success) {
      throw new Error('Autenticación biométrica cancelada o fallida');
    }

    // Si la autenticación fue exitosa, guardamos las credenciales
    const saved = await this.saveCredentials(email, password);
    if (!saved) {
      throw new Error('Error al guardar las credenciales');
    }

    return true;
  }

  /**
   * Deshabilita la autenticación biométrica
   */
  async disableBiometric() {
    return await this.deleteCredentials();
  }
}

export default new BiometricService();
