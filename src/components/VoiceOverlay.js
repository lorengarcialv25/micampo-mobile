import React, { useEffect, useRef, useState } from "react";
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, Easing, Alert, ActivityIndicator, ScrollView, Platform } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system";
import { dypai, callEndpoint } from "../lib/dypai";

export default function VoiceOverlay({ visible, onClose }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.5)).current;
  const recordingRef = useRef(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [schemaResult, setSchemaResult] = useState(null);

  // Solicitar permisos de audio al montar
  useEffect(() => {
    if (visible) {
      requestPermissions();
      setSchemaResult(null);
      setTranscription("");
    } else {
      // Limpiar cuando se cierra
      stopRecording();
      setSchemaResult(null);
      setTranscription("");
    }
  }, [visible]);

  const requestPermissions = async () => {
    console.log("Solicitando permisos de audio...");
    try {
      const { status } = await Audio.requestPermissionsAsync();
      console.log("Resultado solicitud permisos:", status);
      if (status !== 'granted') {
        Alert.alert("Permisos requeridos", "Necesitamos acceso al micrófono para grabar el audio.");
        return false;
      }
      return true;
    } catch (error) {
      console.error("Error solicitando permisos:", error);
      Alert.alert("Error", "No se pudieron solicitar permisos de audio");
      return false;
    }
  };

  // Animación de "respiración" para simular escucha
  useEffect(() => {
    if (visible && !isRecording && !isProcessing) {
      Animated.loop(
        Animated.parallel([
          Animated.sequence([
            Animated.timing(scaleAnim, { toValue: 1.2, duration: 1000, useNativeDriver: true }),
            Animated.timing(scaleAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
          ]),
          Animated.sequence([
            Animated.timing(opacityAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
            Animated.timing(opacityAnim, { toValue: 0.5, duration: 1000, useNativeDriver: true }),
          ])
        ])
      ).start();
    } else {
      scaleAnim.setValue(1);
    }
  }, [visible, isRecording, isProcessing]);

  const startRecording = async () => {
    console.log("🎙️ Iniciando startRecording...");
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      console.log("Audio mode configurado. Creando grabación...");
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      console.log("Grabación creada exitosamente");
      recordingRef.current = recording;
      setIsRecording(true);
      setTranscription("Grabando...");

    } catch (error) {
      console.error("Error iniciando grabación:", error);
      Alert.alert("Error de grabación", "No se pudo iniciar la grabación: " + error.message);
    }
  };

  const stopRecording = async () => {
    if (!recordingRef.current) {
      console.log("⚠️ stopRecording llamado pero no hay grabación activa");
      return;
    }
    
    try {
      console.log("🛑 Deteniendo grabación...");
      await recordingRef.current.stopAndUnloadAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: false,
      });
      
      const uri = recordingRef.current.getURI();
      recordingRef.current = null;
      setIsRecording(false);
      
      if (uri) {
        console.log("✅ Grabación detenida, URI obtenido:", uri.substring(0, 50) + "...");
        await processAudio(uri);
      } else {
        console.warn("⚠️ No se obtuvo URI de la grabación");
        setTranscription("No se pudo obtener el archivo de audio");
      }
    } catch (error) {
      console.error("Error deteniendo grabación:", error);
      setIsRecording(false);
      Alert.alert("Error", "No se pudo detener la grabación: " + error.message);
    }
  };

  const fileToBase64 = async (uri) => {
    try {
      if (Platform.OS === 'web') {
        // En Web, usamos fetch + FileReader para convertir el Blob URL a base64
        const response = await fetch(uri);
        const blob = await response.blob();
        
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64String = reader.result;
            // El resultado viene como "data:audio/mp4;base64,AAAA..."
            // Necesitamos extraer solo la parte base64 después de la coma
            const base64 = base64String.split(',')[1];
            resolve(base64);
          };
          reader.onerror = (error) => {
            console.error("Error en FileReader:", error);
            reject(error);
          };
          reader.readAsDataURL(blob);
        });
      } else {
        // En iOS/Android, usamos FileSystem
        const base64 = await FileSystem.readAsStringAsync(uri, {
          encoding: 'base64',
        });
        return base64;
      }
    } catch (error) {
      console.error("Error convirtiendo a base64:", error);
      throw error;
    }
  };

  const processAudio = async (audioUri) => {
    try {
      setIsProcessing(true);
      setTranscription("Procesando audio...");

      // Convertir audio a base64
      const base64 = await fileToBase64(audioUri);

      // Detectar el tipo MIME
      let contentType = "audio/m4a"; // Por defecto para nativo

      if (Platform.OS === 'web') {
        // En web, intentamos obtener el tipo del blob
        try {
          const response = await fetch(audioUri);
          const blob = await response.blob();
          if (blob.type) {
            contentType = blob.type;
            console.log("Tipo MIME detectado en web:", contentType);
          }
        } catch (e) {
          console.warn("No se pudo detectar tipo MIME en web, usando default", e);
        }
      } else {
        // Lógica existente para nativo
        if (audioUri.includes(".3gp")) {
          contentType = "audio/3gp";
        } else if (audioUri.includes(".m4a")) {
          contentType = "audio/m4a";
        } else if (audioUri.includes(".mp4")) {
          contentType = "audio/mp4";
        }
      }

      // Schema vacío para el audio agent
      const emptySchema = {
        tipo: null, // trabajo, gasto, ingreso, etc.
        concepto: null,
        descripcion: null,
        cantidad: null,
        trabajador: null,
        parcela: null,
        tarea: null,
        horas: null,
        fecha: null,
      };

      console.log("Enviando audio al endpoint procesar_audio...", {
        contentType,
        schemaSize: Object.keys(emptySchema).length,
      });

      // Enviar audio al workflow de audio agent usando callEndpoint
      // El endpoint "procesar_audio" debe estar configurado en DYPAI con el workflow de audio_agent
      console.log("📤 Llamando endpoint procesar_audio...");
      const result = await callEndpoint("procesar_audio", {
        file_bytes: base64,
        content_type: contentType,
        instruction: "Extrae los datos del audio. Identifica el tipo de acción (trabajo, gasto, ingreso) y completa el schema con la información mencionada.",
        empty_schema: emptySchema,
      }, "POST");

      console.log("Resultado completo del audio:", JSON.stringify(result, null, 2));

      // El resultado puede venir en diferentes formatos según la estructura del workflow
      // Intentar múltiples rutas posibles para encontrar los datos
      const schemaData = 
        result?.result?.data || 
        result?.data || 
        result?.result ||
        (result?.success && result) ||
        null;
      
      const success = 
        result?.result?.success === true || 
        result?.result?.success === "true" ||
        result?.success === true ||
        result?.success === "true" ||
        (schemaData && !result?.error);

      if (success && schemaData) {
        setSchemaResult(schemaData);
        setTranscription("✓ Audio procesado correctamente");
      } else {
        // Si hay algún dato aunque no tenga success=true, mostrarlo igual
        if (schemaData) {
          setSchemaResult(schemaData);
          setTranscription("Audio procesado (revisar resultado)");
        } else {
          setTranscription("No se pudo procesar el audio correctamente");
          Alert.alert("Error", "No se pudo procesar el audio. Verifica que el endpoint 'procesar_audio' esté configurado correctamente.");
        }
      }
    } catch (error) {
      console.error("Error procesando audio:", error);
      setTranscription("Error al procesar el audio");
      
      // Mostrar error más detallado
      const errorMessage = error.message || "No se pudo procesar el audio";
      console.error("Detalles del error:", {
        message: errorMessage,
        stack: error.stack,
        response: error.response,
      });
      
      Alert.alert(
        "Error", 
        errorMessage + "\n\nVerifica que el endpoint 'procesar_audio' esté configurado en DYPAI."
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const isPressingRef = useRef(false);

  const handlePressIn = async () => {
    console.log("👆 handlePressIn disparado");
    isPressingRef.current = true;

    if (isProcessing) {
      console.log("⚠️ Ignorando toque: procesando");
      return;
    }
    if (isRecording) {
      console.log("⚠️ Ya se está grabando");
      return;
    }
    
    // Verificar permisos antes de intentar grabar
    const { status } = await Audio.getPermissionsAsync();
    console.log("🎤 Estado de permisos:", status);
    
    if (status !== 'granted') {
      console.log("❌ Permisos no concedidos, solicitando...");
      const newStatus = await requestPermissions();
      if (!newStatus) return;
    }

    await startRecording();
  };

  const handlePressOut = async () => {
    console.log("👆 handlePressOut disparado");
    isPressingRef.current = false;
    
    // Solo detener si realmente está grabando
    if (isRecording && recordingRef.current) {
      console.log("🛑 Deteniendo grabación...");
      await stopRecording();
    } else {
      console.log("⚠️ Se soltó pero no había grabación activa");
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Botón de cerrar arriba */}
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
            <Text style={styles.hintText}>
              {isRecording ? "Grabando..." : isProcessing ? "Procesando..." : "Mantén presionado para grabar"}
            </Text>
            
            {/* Círculo animado central con botón de grabación */}
            <TouchableOpacity
              style={styles.micWrapper}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              disabled={isProcessing}
              activeOpacity={0.8}
            >
              <Animated.View 
                style={[
                  styles.pulseCircle, 
                  { 
                    transform: [{ scale: scaleAnim }],
                    opacity: opacityAnim,
                    backgroundColor: isRecording ? '#f44336' : '#4caf50',
                  }
                ]} 
              />
              <View style={[
                styles.micCircle,
                { backgroundColor: isRecording ? '#d32f2f' : '#2e7d32' }
              ]}>
                {isProcessing ? (
                  <ActivityIndicator size="large" color="#fff" />
                ) : (
                  <MaterialCommunityIcons name="microphone" size={40} color="#fff" />
                )}
              </View>
            </TouchableOpacity>

            {/* Transcripción o estado */}
            <Text style={styles.transcription}>
              {transcription || (isRecording ? "Grabando..." : "Mantén presionado el micrófono para grabar")}
            </Text>

            {!isRecording && !isProcessing && (
              <Text style={styles.tips}>
                Suelta para terminar
              </Text>
            )}

            {/* Mostrar resultado del schema */}
            {schemaResult && (
              <View style={styles.resultContainer}>
                <Text style={styles.resultTitle}>Datos extraídos del audio:</Text>
                <View style={styles.resultBox}>
                  <Text style={styles.resultText}>
                    {JSON.stringify(schemaResult, null, 2)}
                  </Text>
                </View>
              </View>
            )}
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(20, 30, 20, 0.95)', // Fondo verde muy oscuro, casi negro
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 100,
    paddingHorizontal: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 30,
    padding: 10,
    zIndex: 10,
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  micWrapper: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 40,
  },
  pulseCircle: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#4caf50',
  },
  micCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2e7d32',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  hintText: {
    color: '#a5d6a7',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
  },
  transcription: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    paddingHorizontal: 40,
    marginTop: 20,
    minHeight: 50,
  },
  tips: {
    color: '#8898aa',
    fontSize: 14,
    marginTop: 40,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  resultContainer: {
    marginTop: 40,
    width: '100%',
    paddingHorizontal: 20,
  },
  resultTitle: {
    color: '#a5d6a7',
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 15,
    textAlign: 'center',
  },
  resultBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  resultText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'monospace',
    lineHeight: 20,
  },
});
