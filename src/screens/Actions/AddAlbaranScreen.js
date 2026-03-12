import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system";
// Forzar el uso de legacy para readAsStringAsync en Expo 54
let readAsStringAsync;
try {
  readAsStringAsync = require("expo-file-system/legacy").readAsStringAsync;
} catch (e) {
  readAsStringAsync = FileSystem.readAsStringAsync;
}
import { dypai } from "../../lib/dypai";
import { useCampaign } from "../../context/CampaignContext";
import SearchableSelector from "../../components/SearchableSelector";

const CROP_TYPES = [
  { id: 'uva', name: 'Uva', icon: 'flower' },
  { id: 'aceituna_aderezo', name: 'Aceituna (Ad.)', icon: 'leaf' },
  { id: 'aceituna_almazara', name: 'Aceituna (Alm.)', icon: 'leaf' },
  { id: 'cereales', name: 'Cereales', icon: 'wheat' },
  { id: 'frutas', name: 'Frutas', icon: 'food-apple' },
  { id: 'frutos_secos', name: 'F. Secos', icon: 'nut' },
  { id: 'otros', name: 'Otros', icon: 'plus' },
];

export default function AddAlbaranScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { currentCampaignId } = useCampaign();
  
  const [loading, setLoading] = useState(false);
  const [processingOCR, setProcessingOCR] = useState(false);
  const [parcels, setParcels] = useState([]);
  const [clients, setClients] = useState([]);
  
  // Selector states
  const [parcelSelectorVisible, setParcelSelectorVisible] = useState(false);
  const [cropTypeSelectorVisible, setCropTypeSelectorVisible] = useState(false);
  
  // Form state
  const [cropType, setCropType] = useState('uva');
  const [ticketNumber, setTicketNumber] = useState("");
  const [kilograms, setKilograms] = useState("");
  const [grossWeight, setGrossWeight] = useState("");
  const [tareWeight, setTareWeight] = useState("");
  const [degrees, setDegrees] = useState("");
  const [caliber, setCaliber] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [totalAmount, setTotalAmount] = useState("");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [parcelId, setParcelId] = useState("");
  const [clientId, setClientId] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("pending");

  // Archivo
  const [fileUri, setFileUri] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [fileType, setFileType] = useState(null); // "image" o "pdf"
  const [photoUrl, setPhotoUrl] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [parcelsResult, clientsResult] = await Promise.all([
        dypai.api.get("obtener_parcels", {
          params: { sort_by: "name", order: "ASC", limit: 1000 },
        }),
        dypai.api.get("obtener_clientes")
      ]);
      if (parcelsResult.error) throw parcelsResult.error;
      if (clientsResult.error) throw clientsResult.error;

      setParcels(Array.isArray(parcelsResult.data) ? parcelsResult.data : []);
      setClients(Array.isArray(clientsResult.data) ? clientsResult.data : []);
    } catch (error) {
      console.error("Error cargando datos para albarán:", error);
    } finally {
      setLoading(false);
    }
  };

  const fileToBase64 = async (uri) => {
    const base64 = await readAsStringAsync(uri, { encoding: 'base64' });
    return base64;
  };

  const handleFileSelection = async (uri, name, type, mimeType) => {
    setFileUri(uri);
    setFileName(name);
    setFileType(type);
    setPhotoUrl(null);
    await processDocumentWithOCR(uri, type, mimeType, name);
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permisos", "Necesitamos acceso a tus fotos para subir documentos");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        handleFileSelection(
          result.assets[0].uri, 
          result.assets[0].fileName || `imagen_${Date.now()}.jpg`, 
          "image", 
          result.assets[0].mimeType || "image/jpeg"
        );
      }
    } catch (error) {
      console.error("Error seleccionando imagen:", error);
      Alert.alert("Error", "No se pudo seleccionar la imagen");
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permisos", "Necesitamos acceso a tu cámara para tomar fotos");
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        handleFileSelection(
          result.assets[0].uri, 
          `foto_${Date.now()}.jpg`, 
          "image", 
          result.assets[0].mimeType || "image/jpeg"
        );
      }
    } catch (error) {
      console.error("Error tomando foto:", error);
      Alert.alert("Error", "No se pudo tomar la foto");
    }
  };

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/pdf", "image/*"],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        handleFileSelection(
          result.assets[0].uri, 
          result.assets[0].name, 
          result.assets[0].mimeType?.includes("pdf") ? "pdf" : "image", 
          result.assets[0].mimeType || "application/pdf"
        );
      }
    } catch (error) {
      console.error("Error seleccionando documento:", error);
      Alert.alert("Error", "No se pudo seleccionar el documento");
    }
  };

  const processDocumentWithOCR = async (uri, type, mimeType, name) => {
    try {
      setProcessingOCR(true);
      const base64 = await fileToBase64(uri);
      
      const baseSchema = {
        ticket_number: null,
        fecha: null,
        peso_bruto: null,
        peso_tara: null,
        kilogramos_netos: null,
        variedad: null,
        precio_unitario: null,
        importe_total: null,
        otros_datos_relevantes: null,
      };

      if (cropType === 'uva') {
        baseSchema.rendimiento_grados = null;
      } else if (cropType === 'aceituna_aderezo') {
        baseSchema.calibre = null;
        baseSchema.molesta = null;
        baseSchema.suciedad = null;
      } else if (cropType === 'aceituna_almazara') {
        baseSchema.rendimiento_aceite = null;
      }

      const { data: ocrResult, error: ocrError } = await dypai.api.post("procesar_albaran_cosecha", {
        file_bytes: base64,
        content_type: mimeType,
        schema: baseSchema,
        file_name: name,
        save_file: true,
        subfolder_name: "albaranes",
      });
      if (ocrError) throw ocrError;

      const ocrData = ocrResult?.result?.data || ocrResult?.data;
      const fileId = ocrResult?.result?.file_id || ocrResult?.file_id;

      if (fileId) setPhotoUrl(fileId);

      if (ocrData) {
        if (ocrData.ticket_number) setTicketNumber(String(ocrData.ticket_number));
        if (ocrData.peso_bruto) setGrossWeight(String(ocrData.peso_bruto));
        if (ocrData.peso_tara) setTareWeight(String(ocrData.peso_tara));
        if (ocrData.kilogramos_netos) setKilograms(String(ocrData.kilogramos_netos));

        // Mapeo inteligente de calidad/rendimiento
        if (cropType === 'uva' && ocrData.rendimiento_grados) setDegrees(String(ocrData.rendimiento_grados));
        if (cropType === 'aceituna_almazara' && ocrData.rendimiento_aceite) setDegrees(String(ocrData.rendimiento_aceite));

        // Mapeo de aceituna aderezo
        if (cropType === 'aceituna_aderezo') {
          if (ocrData.calibre) setCaliber(String(ocrData.calibre));
        } else {
          if (ocrData.variedad) setCaliber(String(ocrData.variedad));
        }

        if (ocrData.precio_unitario) setUnitPrice(String(ocrData.precio_unitario));
        if (ocrData.importe_total) setTotalAmount(String(ocrData.importe_total));

        if (ocrData.fecha) {
          try {
            const d = new Date(ocrData.fecha);
            if (!isNaN(d.getTime())) setDate(d.toISOString().split('T')[0]);
          } catch (e) {}
        }

        Alert.alert("OCR Completado", "Se han extraído los datos del albarán automáticamente");
      }
    } catch (error) {
      console.error("OCR Error:", error);
      Alert.alert("Error OCR", "No se pudo procesar el documento automáticamente");
    } finally {
      setProcessingOCR(false);
    }
  };

  // Auto-calculate net kilograms
  useEffect(() => {
    if (grossWeight && tareWeight) {
      const net = (parseFloat(grossWeight) || 0) - (parseFloat(tareWeight) || 0);
      if (net >= 0) setKilograms(net.toString());
    }
  }, [grossWeight, tareWeight]);

  // Auto-calculate total amount
  useEffect(() => {
    if (kilograms && unitPrice) {
      const total = (parseFloat(kilograms) || 0) * (parseFloat(unitPrice) || 0);
      setTotalAmount(total.toFixed(2));
    }
  }, [kilograms, unitPrice]);

  const handleSave = async () => {
    if (!kilograms || !parcelId || !clientId) {
      Alert.alert("Error", "Por favor completa los campos obligatorios (Kilos, Parcela y Cliente)");
      return;
    }

    setLoading(true);
    try {
      let finalPhotoUrl = photoUrl;

      // Si hay archivo pero no se ha subido (raro si pasó por OCR, pero por seguridad)
      if (fileUri && !finalPhotoUrl) {
        const base64 = await fileToBase64(fileUri);
        const { data: uploadData, error: uploadError } = await dypai.api.post("procesar_albaran_cosecha", {
          file_bytes: base64,
          content_type: fileType === "pdf" ? "application/pdf" : "image/jpeg",
          schema: {},
          save_file: true,
          file_name: fileName,
          subfolder_name: "albaranes",
        });
        if (uploadError) throw uploadError;
        finalPhotoUrl = uploadData?.result?.file_id || uploadData?.file_id;
      }

      const payload = {
        campaign_id: currentCampaignId,
        crop_type: cropType,
        parcel_id: parcelId,
        client_id: clientId,
        date: date,
        ticket_number: ticketNumber || null,
        kilograms: parseFloat(kilograms),
        gross_weight: grossWeight ? parseFloat(grossWeight) : null,
        tare_weight: tareWeight ? parseFloat(tareWeight) : null,
        degrees: degrees ? parseFloat(degrees) : null,
        caliber: caliber || null,
        unit_price: unitPrice ? parseFloat(unitPrice) : null,
        total_amount: totalAmount ? parseFloat(totalAmount) : null,
        payment_status: paymentStatus,
        notes: notes || null,
        photo_url: finalPhotoUrl,
      };

      const { error: createError } = await dypai.api.post("crear_harvest_ticket", payload);
      if (createError) throw createError;
      Alert.alert("Éxito", "Albarán registrado correctamente");
      navigation.goBack();
    } catch (error) {
      console.error("Error guardando albarán:", error);
      Alert.alert("Error", "No se pudo guardar el albarán");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="close" size={24} color="#1b1f23" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Registrar Albarán</Text>
          <Text style={styles.headerSubtitle}>Entrada de cosecha</Text>
        </View>
        <TouchableOpacity style={styles.saveHeaderBtn} onPress={handleSave} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color="#2e7d32" />
          ) : (
            <Text style={styles.saveHeaderText}>Guardar</Text>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* OCR / Document Section */}
        <View style={styles.ocrSection}>
          <Text style={styles.label}>Justificante / Documento</Text>
          {fileUri ? (
            <View style={styles.filePreviewCard}>
              {fileType === "image" ? (
                <Image source={{ uri: fileUri }} style={styles.previewImg} />
              ) : (
                <View style={styles.pdfPlaceholder}>
                  <MaterialCommunityIcons name="file-pdf-box" size={40} color="#c62828" />
                  <Text style={styles.pdfName} numberOfLines={1}>{fileName}</Text>
                </View>
              )}
              {processingOCR && (
                <View style={styles.ocrOverlay}>
                  <ActivityIndicator color="#fff" />
                  <Text style={styles.ocrOverlayText}>Procesando...</Text>
                </View>
              )}
              <TouchableOpacity style={styles.removeFile} onPress={() => { setFileUri(null); setPhotoUrl(null); }}>
                <Ionicons name="close-circle" size={24} color="#dc2626" />
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.docActions}>
              <TouchableOpacity style={styles.docBtn} onPress={takePhoto}>
                <Ionicons name="camera-outline" size={22} color="#2e7d32" />
                <Text style={styles.docBtnText}>Cámara</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.docBtn} onPress={pickImage}>
                <Ionicons name="image-outline" size={22} color="#2e7d32" />
                <Text style={styles.docBtnText}>Galería</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.docBtn} onPress={pickDocument}>
                <Ionicons name="document-outline" size={22} color="#2e7d32" />
                <Text style={styles.docBtnText}>PDF</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <Text style={styles.label}>Tipo de Cultivo</Text>
        <TouchableOpacity 
          style={styles.selectorTrigger} 
          onPress={() => setCropTypeSelectorVisible(true)}
        >
          <View style={styles.selectorTriggerLeft}>
            {cropType ? (
              <>
                <View style={[styles.miniIconBox, { backgroundColor: "#e8f5e9" }]}>
          <MaterialCommunityIcons
                    name={CROP_TYPES.find(c => c.id === cropType)?.icon || 'flower'} 
                    size={18} 
                    color="#2e7d32" 
                  />
                </View>
                <Text style={styles.selectorTriggerText}>
                  {CROP_TYPES.find(c => c.id === cropType)?.name || "Seleccionar cultivo"}
                </Text>
              </>
            ) : (
              <Text style={styles.selectorPlaceholder}>Seleccionar tipo de cultivo...</Text>
            )}
          </View>
          <Ionicons name="chevron-down" size={20} color="#94a3b8" />
        </TouchableOpacity>

        <View style={styles.row}>
          <View style={styles.flex1}>
            <Text style={styles.label}>Fecha</Text>
            <TextInput
              style={styles.input}
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
            />
          </View>
          <View style={styles.flex1}>
            <Text style={styles.label}>Nº Albarán</Text>
            <TextInput
              style={styles.input}
              value={ticketNumber}
              onChangeText={setTicketNumber}
              placeholder="Ej: 12345"
            />
          </View>
        </View>

        <Text style={styles.label}>Parcela *</Text>
        <TouchableOpacity 
          style={styles.selectorTrigger} 
          onPress={() => setParcelSelectorVisible(true)}
        >
          <View style={styles.selectorTriggerLeft}>
            {parcelId ? (
              <>
                <View style={[styles.miniIconBox, { backgroundColor: "#e8f5e9" }]}>
                  <Ionicons name="location-outline" size={18} color="#2e7d32" />
                </View>
                <Text style={styles.selectorTriggerText}>
                  {parcels.find(p => p.id === parcelId)?.name || "Parcela seleccionada"}
                </Text>
              </>
            ) : (
              <Text style={styles.selectorPlaceholder}>Seleccionar parcela...</Text>
            )}
          </View>
          <Ionicons name="chevron-down" size={20} color="#94a3b8" />
        </TouchableOpacity>

        <Text style={styles.label}>Cliente / Cooperativa *</Text>
        <View style={styles.pickerContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {clients.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[styles.chip, clientId === c.id && styles.chipActive]}
                onPress={() => setClientId(c.id)}
              >
                <Text style={[styles.chipText, clientId === c.id && styles.chipTextActive]}>
                  {c.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.divider} />

        <View style={styles.row}>
          <View style={styles.flex1}>
            <Text style={styles.label}>Bruto (kg)</Text>
            <TextInput
              style={styles.input}
              value={grossWeight}
              onChangeText={setGrossWeight}
              keyboardType="numeric"
              placeholder="0"
            />
          </View>
          <View style={styles.flex1}>
            <Text style={styles.label}>Tara (kg)</Text>
            <TextInput
              style={styles.input}
              value={tareWeight}
              onChangeText={setTareWeight}
              keyboardType="numeric"
              placeholder="0"
            />
          </View>
          <View style={styles.flex1}>
            <Text style={styles.label}>Neto (kg) *</Text>
            <TextInput
              style={[styles.input, styles.inputHighlight]}
              value={kilograms}
              onChangeText={setKilograms}
              keyboardType="numeric"
              placeholder="0"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.flex1}>
            <Text style={styles.label}>
              {cropType === 'uva' ? 'Grados (º)' : 'Rendimiento (%)'}
            </Text>
            <TextInput
              style={styles.input}
              value={degrees}
              onChangeText={setDegrees}
              keyboardType="numeric"
              placeholder="0.0"
            />
          </View>
          <View style={styles.flex1}>
            <Text style={styles.label}>Calibre / Variedad</Text>
            <TextInput
              style={styles.input}
              value={caliber}
              onChangeText={setCaliber}
              placeholder="Ej: Picual"
            />
          </View>
        </View>

        <View style={styles.row}>
          <View style={styles.flex1}>
            <Text style={styles.label}>Precio (€/kg)</Text>
            <TextInput
              style={styles.input}
              value={unitPrice}
              onChangeText={setUnitPrice}
              keyboardType="numeric"
              placeholder="0.00"
            />
          </View>
          <View style={styles.flex1}>
            <Text style={styles.label}>Total (€)</Text>
            <TextInput
              style={[styles.input, { color: '#2e7d32', fontWeight: '800' }]}
              value={totalAmount}
              onChangeText={setTotalAmount}
              keyboardType="numeric"
              placeholder="0.00"
            />
          </View>
        </View>

        <Text style={styles.label}>Estado del Cobro</Text>
        <View style={styles.row}>
          <TouchableOpacity 
            style={[styles.statusBtn, paymentStatus === 'pending' && styles.statusBtnPending]}
            onPress={() => setPaymentStatus('pending')}
          >
            <Text style={[styles.statusBtnText, paymentStatus === 'pending' && styles.statusBtnTextActive]}>
              Pendiente
          </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.statusBtn, paymentStatus === 'paid' && styles.statusBtnPaid]}
            onPress={() => setPaymentStatus('paid')}
          >
            <Text style={[styles.statusBtnText, paymentStatus === 'paid' && styles.statusBtnTextActive]}>
              Cobrado
          </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Notas</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={notes}
          onChangeText={setNotes}
          placeholder="Observaciones..."
          multiline
          numberOfLines={3}
        />
        
        <TouchableOpacity style={styles.mainSaveBtn} onPress={handleSave} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.mainSaveBtnText}>Registrar Albarán</Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* Selector de Tipo de Cultivo */}
      <SearchableSelector
        visible={cropTypeSelectorVisible}
        onClose={() => setCropTypeSelectorVisible(false)}
        title="Tipo de Cultivo"
        placeholder="Buscar cultivo..."
        selectedId={cropType}
        items={CROP_TYPES.map(crop => ({
          id: crop.id,
          name: crop.name,
          icon: crop.icon,
          iconType: 'material',
          color: "#2e7d32"
        }))}
        onSelect={(item) => setCropType(item.id)}
        renderItem={({ item }) => {
          const isSelected = cropType === item.id;
          return (
            <TouchableOpacity
              style={[styles.selectorItem, isSelected && styles.selectorItemSelected]}
              onPress={() => {
                setCropType(item.id);
                setCropTypeSelectorVisible(false);
              }}
            >
              <View style={styles.selectorItemContent}>
                <View style={[styles.selectorIconBox, { backgroundColor: isSelected ? "#2e7d32" : "#f1f5f9" }]}>
                  <MaterialCommunityIcons 
                    name={item.icon} 
                    size={20} 
                    color={isSelected ? "#fff" : "#607463"} 
                  />
                </View>
                <Text style={[styles.selectorItemText, isSelected && styles.selectorItemTextSelected]}>
                  {item.name}
                </Text>
              </View>
              {isSelected && (
                <Ionicons name="checkmark-circle" size={22} color="#2e7d32" />
              )}
            </TouchableOpacity>
          );
        }}
      />

      {/* Selector de Parcelas */}
      <SearchableSelector
        visible={parcelSelectorVisible}
        onClose={() => setParcelSelectorVisible(false)}
        title="Parcelas"
        placeholder="Buscar parcela..."
        selectedId={parcelId}
        items={parcels.map(p => ({
          id: p.id,
          name: p.name,
          icon: "location-outline",
          color: "#2e7d32"
        }))}
        onSelect={(item) => setParcelId(item.id)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1b1f23",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#607463",
    marginTop: 2,
  },
  saveHeaderBtn: {
    width: 60,
    alignItems: "flex-end",
  },
  saveHeaderText: {
    color: "#2e7d32",
    fontWeight: "700",
    fontSize: 15,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  ocrSection: {
    marginBottom: 10,
  },
  docActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  docBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderStyle: "dashed",
    gap: 6,
  },
  docBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#2e7d32",
  },
  filePreviewCard: {
    height: 120,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#f1f5f9",
    marginTop: 4,
  },
  previewImg: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  pdfPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
  pdfName: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 4,
    fontWeight: "600",
  },
  removeFile: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#fff",
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  ocrOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  ocrOverlayText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 6,
  },
  label: { fontSize: 12, fontWeight: "700", color: "#607463", marginBottom: 8, marginTop: 16, textTransform: 'uppercase' },
  input: {
    backgroundColor: "#f7f9f5",
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    color: "#1b1f23",
  },
  inputHighlight: {
    borderColor: "#2e7d32",
    backgroundColor: "#f0f7f0",
    fontWeight: "700",
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
  row: { flexDirection: "row", gap: 12, marginBottom: 8 },
  flex1: { flex: 1 },
  selectorTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    marginBottom: 16,
  },
  selectorTriggerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  selectorTriggerText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
  },
  selectorPlaceholder: {
    fontSize: 16,
    color: "#94a3b8",
    fontWeight: "500",
  },
  miniIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  selectorItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#f1f5f9",
  },
  selectorItemSelected: {
    backgroundColor: "#f8fafc",
  },
  selectorItemContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  selectorIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  selectorItemText: {
    fontSize: 16,
    color: "#1e293b",
    fontWeight: "500",
  },
  selectorItemTextSelected: {
    color: "#2e7d32",
    fontWeight: "700",
  },
  pickerContainer: { marginBottom: 8 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f7f9f5",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  chipActive: {
    backgroundColor: "#e3f2e4",
    borderColor: "#2e7d32",
  },
  chipText: { fontSize: 13, color: "#607463", fontWeight: "600" },
  chipTextActive: { color: "#2e7d32", fontWeight: "700" },
  divider: { height: 1, backgroundColor: "#e0e0e0", marginVertical: 20 },
  statusBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#f7f9f5",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  statusBtnPending: { backgroundColor: "#fff8e1", borderColor: "#ffb300" },
  statusBtnPaid: { backgroundColor: "#e8f5e9", borderColor: "#2e7d32" },
  statusBtnText: { fontWeight: "700", color: "#607463" },
  statusBtnTextActive: { color: "#1b1f23" },
  mainSaveBtn: {
    backgroundColor: "#2e7d32",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 30,
    shadowColor: "#2e7d32",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  mainSaveBtnText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});
