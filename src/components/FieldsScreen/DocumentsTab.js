import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Linking,
  ScrollView,
} from "react-native";
import { Ionicons, FontAwesome5 } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
// Forzar el uso de legacy para readAsStringAsync en Expo 54
let readAsStringAsync;
try {
  readAsStringAsync = require("expo-file-system/legacy").readAsStringAsync;
} catch (e) {
  readAsStringAsync = FileSystem?.readAsStringAsync;
}
import { dypai } from "../../lib/dypai";

export default function DocumentsTab({ fieldId }) {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    if (fieldId) {
      loadDocuments();
    }
  }, [fieldId]);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const { data, error } = await dypai.api.get("obtener_parcel_documents", {
        params: {
          parcel_id: fieldId,
          sort_by: "created_at",
          order: "DESC"
        },
      });
      if (error) throw error;

      setDocuments(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando documentos:", error);
    } finally {
      setLoading(false);
    }
  };

  const fileToBase64 = async (uri) => {
    try {
      if (!readAsStringAsync) return null;
      const base64 = await readAsStringAsync(uri, {
        encoding: "base64",
      });
      return base64;
    } catch (error) {
      console.error("Error convirtiendo a base64:", error);
      return null;
    }
  };

  const formatFileSize = (bytes) => {
    if (!bytes) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  const getFileType = (mimeType, fileName) => {
    if (mimeType?.includes("pdf") || fileName?.toLowerCase().endsWith(".pdf")) {
      return "pdf";
    }
    if (mimeType?.includes("image") || /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName || "")) {
      return "image";
    }
    return "other";
  };

  const uploadFile = async (uri, fileName, mimeType, size) => {
    try {
      setUploading(true);
      const base64 = await fileToBase64(uri);
      if (!base64) throw new Error("No se pudo leer el archivo");

      // Usamos el mismo patrón que en mobile para subir archivos: procesar_documento_gasto
      // ya que maneja la conversión de base64 a archivo en el servidor de forma segura.
      const { data: uploadResult, error: uploadError } = await dypai.api.post("procesar_documento_gasto", {
        file_bytes: base64,
        content_type: mimeType,
        schema: {},
        save_file: true,
        file_name: fileName,
        subfolder_name: "parcelas",
      });
      if (uploadError) throw uploadError;

      const uploadData = Array.isArray(uploadResult) ? uploadResult[0] : uploadResult;
      const fileId = uploadData?.result?.file_id || uploadData?.file_id || uploadData?.id;
      if (!fileId) throw new Error("No se recibió el ID del archivo");

      const fileInfo = uploadData?.result?.file || uploadData?.file || {};
      const fileUrl = fileInfo.file_url || fileInfo.file_name || null;

      // El endpoint de creación de documento de parcela (igual que en web)
      const { error: createDocError } = await dypai.api.post("crear_parcel_document", {
        parcel_id: fieldId,
        file_id: fileId, // Es el path en el bucket
        file_name: fileName,
        file_size: size || fileInfo.file_size || 0,
        mime_type: mimeType,
        file_url: fileUrl,
      });
      if (createDocError) throw createDocError;

      Alert.alert("Éxito", "Documento subido correctamente");
      loadDocuments();
    } catch (error) {
      console.error("Error subiendo archivo:", error);
      Alert.alert("Error", error.message || "No se pudo subir el documento");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (docId, filePath) => {
    Alert.alert(
      "Eliminar documento",
      "¿Estás seguro de que deseas eliminar este documento?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              // 1. Eliminar del storage (si dypai.storage está disponible)
              if (dypai.storage) {
                await dypai.storage.from('parcelas').remove([filePath]);
              }

              // 2. Eliminar registro de la base de datos (igual que en web)
              const { error: deleteError } = await dypai.api.delete("eliminar_parcel_document", {
                params: { id: docId }
              });
              if (deleteError) throw deleteError;
              
              Alert.alert("Éxito", "Documento eliminado");
              loadDocuments();
            } catch (error) {
              console.error("Error eliminando documento:", error);
              Alert.alert("Error", "No se pudo eliminar el documento");
            }
          }
        }
      ]
    );
  };

  const handleDownload = async (docId, filePath) => {
    try {
      setDownloadingId(docId);
      // Usar createSignedUrl igual que en la versión web
      const { data, error } = await dypai.storage
        .from('parcelas')
        .createSignedUrl(filePath, 60); // 60 segundos de validez

      if (error) throw error;

      if (data?.signedUrl) {
        await Linking.openURL(data.signedUrl);
      }
    } catch (error) {
      console.error("Error descargando archivo:", error);
      Alert.alert("Error", "No se pudo abrir el archivo");
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      await uploadFile(asset.uri, asset.fileName || `img_${Date.now()}.jpg`, asset.mimeType || "image/jpeg", asset.fileSize);
    }
  };

  const handlePickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({ type: "*/*" });
    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      await uploadFile(asset.uri, asset.name, asset.mimeType || "application/octet-stream", asset.size);
    }
  };

  const showUploadOptions = () => {
    Alert.alert("Subir documento", "Selecciona una fuente", [
      { text: "Cancelar", style: "cancel" },
      { text: "Galería", onPress: handlePickImage },
      { text: "Archivo", onPress: handlePickDocument },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="small" color="#2e7d32" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Documentación técnica</Text>

      {documents.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="document-outline" size={48} color="#cbd5e1" />
          <Text style={styles.emptyText}>Sin documentos</Text>
          <Text style={styles.emptySubtext}>Fotos, contratos o informes</Text>
        </View>
      ) : (
        documents.map((doc) => {
          const fileType = getFileType(doc.mime_type, doc.file_name);
          return (
            <View key={doc.id} style={styles.docCard}>
              <View style={[styles.docIcon, { backgroundColor: fileType === "pdf" ? "#fef2f2" : "#eff6ff" }]}>
                <FontAwesome5 
                  name={fileType === "pdf" ? "file-pdf" : fileType === "image" ? "file-image" : "file"} 
                  size={20} 
                  color={fileType === "pdf" ? "#ef4444" : "#3b82f6"} 
                />
              </View>
              <View style={styles.docInfo}>
                <Text style={styles.docName} numberOfLines={1}>{doc.file_name}</Text>
                <Text style={styles.docMeta}>
                  {doc.created_at ? new Date(doc.created_at).toLocaleDateString('es-ES') : ""} · {formatFileSize(doc.file_size)}
                </Text>
              </View>
              <View style={styles.actions}>
                <TouchableOpacity 
                  onPress={() => handleDownload(doc.id, doc.file_id || doc.file_url)} 
                  style={styles.actionBtn}
                  disabled={!!downloadingId}
                >
                  {downloadingId === doc.id ? (
                    <ActivityIndicator size="small" color="#64748b" />
                  ) : (
                    <Ionicons name="cloud-download-outline" size={20} color="#64748b" />
                  )}
                </TouchableOpacity>
                <TouchableOpacity 
                  onPress={() => handleDeleteDocument(doc.id, doc.file_id || doc.file_url)} 
                  style={[styles.actionBtn, styles.deleteBtn]}
                >
                  <Ionicons name="trash-outline" size={18} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          );
        })
      )}

      <TouchableOpacity 
        style={[styles.uploadButton, uploading && styles.disabled]} 
        onPress={showUploadOptions}
        disabled={uploading}
      >
        {uploading ? <ActivityIndicator size="small" color="#fff" /> : (
          <>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.uploadButtonText}>Subir Documento</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { paddingVertical: 40, alignItems: "center" },
  sectionTitle: { fontSize: 13, fontWeight: "900", color: "#94a3b8", letterSpacing: 1, marginBottom: 16, paddingLeft: 4 },
  docCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  docIcon: { width: 44, height: 44, borderRadius: 12, justifyContent: "center", alignItems: "center", marginRight: 12 },
  docInfo: { flex: 1 },
  docName: { fontSize: 14, fontWeight: "700", color: "#1e293b" },
  docMeta: { fontSize: 12, color: "#94a3b8", marginTop: 2, fontWeight: "500" },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: { width: 36, height: 36, borderRadius: 10, backgroundColor: "#f8fafc", justifyContent: "center", alignItems: "center" },
  deleteBtn: { backgroundColor: '#fef2f2' },
  uploadButton: {
    flexDirection: "row",
    backgroundColor: "#2e7d32",
    paddingVertical: 14,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    shadowColor: "#2e7d32",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  uploadButtonText: { color: "#fff", fontWeight: "800", fontSize: 15 },
  disabled: { opacity: 0.7 },
  emptyState: { padding: 40, alignItems: "center", backgroundColor: "#fff", borderRadius: 20, borderWidth: 1, borderColor: "#f1f5f9" },
  emptyText: { fontSize: 16, fontWeight: "700", color: "#1e293b", marginTop: 16 },
  emptySubtext: { fontSize: 13, color: "#64748b", marginTop: 4, fontWeight: "500" },
});
