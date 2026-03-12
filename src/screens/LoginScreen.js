import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';

export default function LoginScreen() {
  const navigation = useNavigation();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(0); // 0: Input phone, 1: Input OTP
  const [loading, setLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const {
    signInWithOtp,
    verifyOtp,
    loginWithBiometric,
    biometricAvailable,
    biometricEnabled,
  } = useAuth();

  // Intentar login biométrico automático al cargar si está habilitado
  useEffect(() => {
    const tryBiometricLogin = async () => {
      if (biometricEnabled && biometricAvailable?.available && !loading) {
        // Esperar un momento antes de mostrar el prompt biométrico
        setTimeout(async () => {
          try {
            setBiometricLoading(true);
            await loginWithBiometric();
            // El login exitoso navegará automáticamente
          } catch (error) {
            // Si el usuario cancela o falla, no mostramos error
            // Solo si es un error real lo mostramos
            if (error.message && !error.message.includes('cancelada')) {
              console.log('Login biométrico fallido:', error.message);
            }
          } finally {
            setBiometricLoading(false);
          }
        }, 500);
      }
    };

    tryBiometricLogin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [biometricEnabled, biometricAvailable?.available]);

  const handleSendOtp = async () => {
    if (!phone.trim()) {
      Alert.alert('Error', 'Por favor introduce tu número de teléfono');
      return;
    }

    // Asegurar formato internacional si no lo tiene (ejemplo para España +34)
    let formattedPhone = phone.trim();
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = `+34${formattedPhone}`;
    }

    setLoading(true);
    try {
      await signInWithOtp(formattedPhone);
      setStep(1);
      Alert.alert('Código enviado', 'Introduce el código que has recibido por SMS');
    } catch (error) {
      Alert.alert(
        'Error',
        error.message || 'No se pudo enviar el código. Verifica el número.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp.trim()) {
      Alert.alert('Error', 'Por favor introduce el código OTP');
      return;
    }

    let formattedPhone = phone.trim();
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = `+34${formattedPhone}`;
    }

    setLoading(true);
    try {
      await verifyOtp(formattedPhone, otp.trim());
      // La navegación se manejará automáticamente por el AuthContext
    } catch (error) {
      Alert.alert(
        'Error',
        error.message || 'Código incorrecto. Inténtalo de nuevo.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleBiometricLogin = async () => {
    setBiometricLoading(true);
    try {
      await loginWithBiometric();
      // La navegación se manejará automáticamente por el AuthContext
    } catch (error) {
      if (!error.message.includes('cancelada')) {
        Alert.alert(
          'Error',
          error.message || 'No se pudo autenticar con biometría'
        );
      }
    } finally {
      setBiometricLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          {/* Logo/Icono */}
          <View style={styles.logoContainer}>
            <View style={styles.logoWrapper}>
              <Image 
                source={require('../../agroapp-logo.png')} 
                style={styles.logo}
                resizeMode="cover"
              />
            </View>
            <Text style={styles.title}>AgroApp</Text>
            <Text style={styles.subtitle}>
              {step === 0 ? 'Inicia sesión con tu teléfono' : 'Introduce el código recibido'}
            </Text>
          </View>

          {/* Formulario */}
          <View style={styles.form}>
            {step === 0 ? (
              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Teléfono (ej: 600000000)"
                  placeholderTextColor="#9CA3AF"
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  autoComplete="tel"
                  editable={!loading}
                />
              </View>
            ) : (
              <View style={styles.inputContainer}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#6B7280" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Código de verificación"
                  placeholderTextColor="#9CA3AF"
                  value={otp}
                  onChangeText={setOtp}
                  keyboardType="number-pad"
                  maxLength={6}
                  editable={!loading}
                />
              </View>
            )}

            {step === 0 ? (
              <TouchableOpacity
                style={[styles.loginButton, (loading || biometricLoading) && styles.loginButtonDisabled]}
                onPress={handleSendOtp}
                disabled={loading || biometricLoading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.loginButtonText}>Enviar código</Text>
                )}
              </TouchableOpacity>
            ) : (
              <>
                <TouchableOpacity
                  style={[styles.loginButton, loading && styles.loginButtonDisabled]}
                  onPress={handleVerifyOtp}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.loginButtonText}>Verificar y entrar</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setStep(0)}
                  disabled={loading}
                  style={styles.recoverButton}
                >
                  <Text style={styles.recoverButtonText}>Cambiar número de teléfono</Text>
                </TouchableOpacity>
              </>
            )}

            {/* Botón de login biométrico */}
            {step === 0 && biometricEnabled && biometricAvailable?.available && (
              <>
                <View style={styles.separator}>
                  <View style={styles.separatorLine} />
                  <Text style={styles.separatorText}>o</Text>
                  <View style={styles.separatorLine} />
                </View>

                <TouchableOpacity
                  style={[styles.biometricButton, (loading || biometricLoading) && styles.buttonDisabled]}
                  onPress={handleBiometricLogin}
                  disabled={loading || biometricLoading}
                >
                  {biometricLoading ? (
                    <ActivityIndicator color="#2e7d32" />
                  ) : (
                    <>
                      <Ionicons
                        name={
                          biometricAvailable.typeName === 'Face ID'
                            ? 'face-recognition-outline'
                            : 'finger-print-outline'
                        }
                        size={24}
                        color="#2e7d32"
                        style={styles.biometricIcon}
                      />
                      <Text style={styles.biometricButtonText}>
                        Iniciar con {biometricAvailable.typeName}
                      </Text>
                    </>
                  )}
                </TouchableOpacity>
              </>
            )}

            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>¿No tienes cuenta?</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.registerLink}> Regístrate</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9F5',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  content: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoWrapper: {
    width: 120,
    height: 120,
    borderRadius: 24, // Bordes redondeados modernos
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    // Sombra suave y profesional
    shadowColor: "#2e7d32",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(46, 125, 50, 0.1)',
    overflow: 'hidden',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1B1F23',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D6E2D1',
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 52,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1B1F23',
  },
  passwordInput: {
    paddingRight: 40,
  },
  eyeIcon: {
    padding: 4,
  },
  loginButton: {
    backgroundColor: '#2e7d32',
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    shadowColor: '#2e7d32',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    height: 52,
    borderWidth: 2,
    borderColor: '#2e7d32',
    marginBottom: 16,
  },
  biometricIcon: {
    marginRight: 8,
  },
  biometricButtonText: {
    color: '#2e7d32',
    fontSize: 16,
    fontWeight: '600',
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 16,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#D6E2D1',
  },
  separatorText: {
    marginHorizontal: 16,
    color: '#6B7280',
    fontSize: 14,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  recoverButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  recoverButtonText: {
    color: '#2e7d32',
    fontSize: 14,
    fontWeight: '500',
  },
  footerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: '#6B7280',
    fontSize: 14,
  },
  registerLink: {
    color: '#2e7d32',
    fontSize: 14,
    fontWeight: '600',
  },
});
