import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
  StatusBar
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
import { formatDateFull, formatEuro } from "../../utils/formatters";
import SearchableSelector from "../../components/SearchableSelector";

let DateTimePicker;
if (Platform.OS !== "web") {
  try {
    DateTimePicker = require("@react-native-community/datetimepicker").default;
  } catch (e) {
    console.warn("DateTimePicker no disponible:", e);
    DateTimePicker = null;
  }
}

const EXPENSE_CATEGORIES = [
  "Gasóleo",
  "Reparaciones",
  "Maquinaria",
  "Semillas",
  "Fertilizantes",
  "Fitosanitarios",
  "Riego",
  "Mano de obra",
  "Seguros",
  "Arrendamientos",
  "Suministros",
  "Impuestos",
  "Otros",
];

const INCOME_CATEGORIES = [
  "Venta de cosecha",
  "Recolección",
  "Subvenciones",
  "Otros ingresos",
];

const CATEGORY_ICONS = {
  "gasóleo": "speedometer-outline",
  "gasoil": "speedometer-outline",
  "reparaciones": "construct-outline",
  "semillas": "leaf-outline",
  "fertilizantes": "flask-outline",
  "riego": "water-outline",
  "mano de obra": "people-outline",
  "maquinaria": "bus-outline",
  "fitosanitarios": "leaf-outline",
  "seguros": "shield-checkmark-outline",
  "recolección": "nutrition-outline",
  "arrendamientos": "business-outline",
  "suministros": "bulb-outline",
  "impuestos": "file-tray-full-outline",
  "venta de cosecha": "cash-outline",
  "subvenciones": "file-tray-full-outline",
  "otros": "receipt-outline",
};

const CATEGORY_COLORS = {
  "gasóleo": "#2563eb",
  "gasoil": "#2563eb",
  "reparaciones": "#ea580c",
  "semillas": "#059669",
  "fertilizantes": "#9333ea",
  "riego": "#0891b2",
  "mano de obra": "#dc2626",
  "maquinaria": "#d97706",
  "fitosanitarios": "#65a30d",
  "seguros": "#4f46e5",
  "recolección": "#b45309",
  "arrendamientos": "#475569",
  "suministros": "#ca8a04",
  "impuestos": "#e11d48",
  "venta de cosecha": "#059669",
  "subvenciones": "#2563eb",
  "otros": "#475569",
};

export default function AddExpenseScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { currentCampaignId } = useCampaign();

  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [processingOCR, setProcessingOCR] = useState(false);

  // Formulario
  const [transactionType, setTransactionType] = useState("expense"); // "expense" o "income"
  const [concept, setConcept] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [category, setCategory] = useState("");
  const [isDeductible, setIsDeductible] = useState(true);
  const [parcels, setParcels] = useState([]);
  const [selectedParcelaId, setSelectedParcelaId] = useState(null);
  
  // Selector states
  const [categorySelectorVisible, setCategorySelectorVisible] = useState(false);
  const [parcelSelectorVisible, setParcelSelectorVisible] = useState(false);

  // Campos fiscales
  const [showFiscalData, setShowFiscalData] = useState(false);
  const [baseImponible, setBaseImponible] = useState("");
  const [iva, setIva] = useState("");
  const [numeroFactura, setNumeroFactura] = useState("");
  const [proveedor, setProveedor] = useState("");
  const [establecimiento, setEstablecimiento] = useState("");

  // Archivo
  const [fileUri, setFileUri] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [fileType, setFileType] = useState(null); // "image" o "pdf"
  const [ocrData, setOcrData] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoadingData(true);
      const parcelsRes = await dypai.api.get("obtener_parcels", {
        params: { sort_by: "name", order: "ASC", limit: 1000 },
      });

      let parcelsData = [];
      if (parcelsRes?.data && Array.isArray(parcelsRes.data)) {
        parcelsData = parcelsRes.data;
      } else if (Array.isArray(parcelsRes)) {
        parcelsData = parcelsRes;
      }

      setParcels(parcelsData);
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleFileSelection = async (uri, name, type, mimeType) => {
    setFileUri(uri);
    setFileName(name);
    setFileType(type);
    setOcrData(null);
    await processDocumentWithOCR(uri, type, mimeType);
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
        handleFileSelection(result.assets[0].uri, result.assets[0].fileName || `imagen_${Date.now()}.jpg`, "image", result.assets[0].mimeType || "image/jpeg");
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
        handleFileSelection(result.assets[0].uri, `foto_${Date.now()}.jpg`, "image", result.assets[0].mimeType || "image/jpeg");
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
        handleFileSelection(result.assets[0].uri, result.assets[0].name, result.assets[0].mimeType?.includes("pdf") ? "pdf" : "image", result.assets[0].mimeType || "application/pdf");
      }
    } catch (error) {
      console.error("Error seleccionando documento:", error);
      Alert.alert("Error", "No se pudo seleccionar el documento");
    }
  };

  const processDocumentWithOCR = async (uri, type, mimeType) => {
    try {
      setProcessingOCR(true);
      const base64 = await fileToBase64(uri);
      const schema = {
        numero_factura: null,
        fecha: null,
        proveedor: null,
        establecimiento: null,
        concepto: null,
        total: null,
        iva: null,
        base_imponible: null,
        categoria: null,
      };

      const ocrResult = await dypai.api.post("procesar_documento_gasto", {
        file_bytes: base64,
        content_type: mimeType,
        schema: schema,
        document_type: "auto",
        save_file: true,
        file_name: fileName || `documento_${Date.now()}.${type === "pdf" ? "pdf" : "jpg"}`,
        subfolder_name: "gastos",
      });

      const data = ocrResult?.result?.data || ocrResult?.data;
      const ocrSuccess = ocrResult?.result?.success === true || ocrResult?.success === true;

      if (ocrSuccess && data) {
        setOcrData(data);
        if (data.concepto) setConcept(data.concepto);
        else if (data.establecimiento) setConcept(data.establecimiento);
        else if (data.proveedor) setConcept(data.proveedor);

        const monto = data.total || data.importe_total;
        if (monto) {
          const montoNum = typeof monto === "string" ? parseFloat(monto.replace(/[^\d.,]/g, "").replace(",", ".")) : monto;
          if (!isNaN(montoNum)) setAmount(String(montoNum.toFixed(2)));
        }

        if (data.base_imponible) setBaseImponible(String(data.base_imponible));
        if (data.iva) setIva(String(data.iva));
        if (data.numero_factura) setNumeroFactura(data.numero_factura);
        if (data.proveedor) setProveedor(data.proveedor);
        if (data.establecimiento) setEstablecimiento(data.establecimiento);
        
        if (data.base_imponible || data.iva || data.numero_factura) setShowFiscalData(true);

        if (data.fecha) {
          const parsed = new Date(data.fecha);
          if (!isNaN(parsed.getTime())) setDate(parsed);
        }

        // Detección de categoría simple
        const searchPool = (data.concepto + " " + (data.categoria || "")).toLowerCase();
        const cats = transactionType === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
        const found = cats.find(c => searchPool.includes(c.toLowerCase()));
        if (found) setCategory(found);

        const fileId = ocrResult?.result?.file_id || ocrResult?.file_id;
        if (fileId) setOcrData(prev => ({ ...prev, file_id: fileId }));

        Alert.alert("OCR Completado", "Se han extraído los datos del documento automáticamente");
      }
    } catch (error) {
      console.error("OCR Error:", error);
    } finally {
      setProcessingOCR(false);
    }
  };

  const fileToBase64 = async (uri) => {
    const base64 = await readAsStringAsync(uri, { encoding: 'base64' });
    return base64;
  };

  const handleSave = async () => {
    if (!currentCampaignId || !concept.trim() || !amount || !category) {
      Alert.alert("Error", "Por favor rellena todos los campos obligatorios (*)");
      return;
    }

    try {
      setLoading(true);
      let receiptImageUrl = ocrData?.file_id || null;

      if (fileUri && !receiptImageUrl) {
        const base64 = await fileToBase64(fileUri);
        const uploadRes = await dypai.api.post("procesar_documento_gasto", {
          file_bytes: base64,
          content_type: fileType === "pdf" ? "application/pdf" : "image/jpeg",
          schema: {},
          save_file: true,
          file_name: fileName,
          subfolder_name: "gastos",
        });
        receiptImageUrl = uploadRes?.result?.file_id || uploadRes?.file_id;
      }

      const transactionData = {
        campaign_id: currentCampaignId,
        type: transactionType,
        amount: parseFloat(amount),
        date: date.toISOString().split("T")[0],
        concept: concept.trim(),
        category: category,
        is_deductible: transactionType === "expense" ? isDeductible : false,
        parcel_id: selectedParcelaId,
        receipt_image_url: receiptImageUrl,
        numero_factura: numeroFactura || null,
        proveedor: proveedor || null,
        establecimiento: establecimiento || null,
        iva: iva ? parseFloat(iva) : null,
        base_imponible: baseImponible ? parseFloat(baseImponible) : null,
      };

      await dypai.api.post("crear_transaccion", transactionData);
      navigation.navigate("MainTabs", { screen: "Cuentas" });
      setTimeout(() => Alert.alert("Éxito", "Transacción registrada"), 300);
    } catch (error) {
      Alert.alert("Error", "No se pudo guardar");
    } finally {
      setLoading(false);
    }
  };

  const categories = transactionType === "expense" ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header Premium */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color="#1b1f23" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nuevo Movimiento</Text>
        <View style={{ width: 44 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView 
          style={styles.scrollView} 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
        {/* OCR / Document Section - MOVED TO TOP */}
        <View style={styles.ocrFirstSection}>
          <Text style={styles.fieldLabel}>JUSTIFICANTE / DOCUMENTO</Text>
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
              <TouchableOpacity style={styles.removeFile} onPress={() => { setFileUri(null); setOcrData(null); }}>
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

        {/* Amount Input Large - Banking Style - COMPACTED */}
        <View style={styles.amountHeader}>
          <Text style={styles.amountLabel}>IMPORTE</Text>
          <View style={styles.amountInputRow}>
            <TextInput
              style={[styles.mainAmountInput, { color: transactionType === 'income' ? "#2e7d32" : "#1b1f23" }]}
              placeholder="0.00"
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
            <Text style={[styles.currencyText, { color: transactionType === 'income' ? "#2e7d32" : "#1b1f23" }]}>€</Text>
          </View>
        </View>

        {/* Transaction Type Selector */}
        <View style={styles.typeSelectorWrapper}>
          <View style={styles.typeSelector}>
            <TouchableOpacity
              style={[styles.typeBtn, transactionType === "expense" && styles.typeBtnActiveExpense]}
              onPress={() => setTransactionType("expense")}
            >
              <Text style={[styles.typeBtnText, transactionType === "expense" && styles.typeBtnTextActive]}>Gasto</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeBtn, transactionType === "income" && styles.typeBtnActiveIncome]}
              onPress={() => setTransactionType("income")}
            >
              <Text style={[styles.typeBtnText, transactionType === "income" && styles.typeBtnTextActive]}>Ingreso</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Form Section */}
        <View style={styles.formSection}>
          {/* Concept */}
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>CONCEPTO *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="¿En qué has gastado?"
              value={concept}
              onChangeText={setConcept}
            />
          </View>

          {/* Date and Category Row */}
          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.fieldLabel}>FECHA *</Text>
              <TouchableOpacity style={styles.dateSelector} onPress={() => setShowDatePicker(true)}>
                <Text style={styles.dateSelectorText}>{date.toLocaleDateString('es-ES')}</Text>
                <Ionicons name="calendar-outline" size={18} color="#64748b" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Category Selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>CATEGORÍA *</Text>
            <TouchableOpacity 
              style={styles.selectorTrigger} 
              onPress={() => setCategorySelectorVisible(true)}
            >
              <View style={styles.selectorTriggerLeft}>
                {category ? (
                  <>
                    <View style={[styles.miniIconBox, { backgroundColor: `${CATEGORY_COLORS[category.toLowerCase()] || "#2e7d32"}15` }]}>
                      <Ionicons 
                        name={CATEGORY_ICONS[category.toLowerCase()] || "receipt-outline"} 
                        size={18} 
                        color={CATEGORY_COLORS[category.toLowerCase()] || "#2e7d32"} 
                      />
                    </View>
                    <Text style={styles.selectorTriggerText}>{category}</Text>
                  </>
                ) : (
                  <Text style={styles.selectorPlaceholder}>Seleccionar categoría...</Text>
                )}
              </View>
              <Ionicons name="chevron-down" size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Parcel Selector */}
          <View style={styles.inputGroup}>
            <Text style={styles.fieldLabel}>VINCULAR A PARCELA</Text>
            <TouchableOpacity 
              style={styles.selectorTrigger} 
              onPress={() => setParcelSelectorVisible(true)}
            >
              <View style={styles.selectorTriggerLeft}>
                {selectedParcelaId ? (
                  <>
                    <View style={[styles.miniIconBox, { backgroundColor: "#e8f5e9" }]}>
                      <Ionicons name="location-outline" size={18} color="#2e7d32" />
                    </View>
                    <Text style={styles.selectorTriggerText}>
                      {parcels.find(p => p.id === selectedParcelaId)?.name || "Parcela seleccionada"}
                    </Text>
                  </>
                ) : (
                  <Text style={styles.selectorPlaceholder}>Ninguna (opcional)</Text>
                )}
              </View>
              <Ionicons name="chevron-down" size={20} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Fiscal Data Accordion */}
          {transactionType === 'expense' && (
            <View style={styles.fiscalSection}>
              <TouchableOpacity 
                style={styles.fiscalToggle} 
                onPress={() => setShowFiscalData(!showFiscalData)}
              >
                <View style={styles.fiscalToggleLeft}>
                  <MaterialCommunityIcons name="file-percent-outline" size={20} color="#64748b" />
                  <Text style={styles.fiscalToggleText}>Datos fiscales y facturación</Text>
                </View>
                <Ionicons name={showFiscalData ? "chevron-up" : "chevron-down"} size={18} color="#64748b" />
              </TouchableOpacity>

              {showFiscalData && (
                <View style={styles.fiscalContent}>
                  <View style={styles.row}>
                    <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                      <Text style={styles.fieldLabel}>BASE IMPONIBLE</Text>
                      <TextInput
                        style={[styles.textInput, styles.fiscalInput]}
                        placeholder="0.00"
                        value={baseImponible}
                        onChangeText={setBaseImponible}
                        keyboardType="decimal-pad"
                      />
                    </View>
                    <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                      <Text style={styles.fieldLabel}>IVA (€)</Text>
                      <TextInput
                        style={[styles.textInput, styles.fiscalInput]}
                        placeholder="0.00"
                        value={iva}
                        onChangeText={setIva}
                        keyboardType="decimal-pad"
                      />
                    </View>
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.fieldLabel}>Nº FACTURA</Text>
                    <TextInput
                      style={[styles.textInput, styles.fiscalInput]}
                      placeholder="Ej: 2024/001"
                      value={numeroFactura}
                      onChangeText={setNumeroFactura}
                    />
                  </View>
                  <View style={styles.inputGroup}>
                    <Text style={styles.fieldLabel}>PROVEEDOR</Text>
                    <TextInput
                      style={[styles.textInput, styles.fiscalInput]}
                      placeholder="Nombre de la empresa"
                      value={proveedor}
                      onChangeText={setProveedor}
                    />
                  </View>
                  
                  <TouchableOpacity
                    style={styles.deductibleRow}
                    onPress={() => setIsDeductible(!isDeductible)}
                  >
                    <Ionicons name={isDeductible ? "checkbox" : "square-outline"} size={22} color="#2e7d32" />
                    <Text style={styles.deductibleLabel}>Marcar como gasto deducible</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Save Button Premium */}
        <TouchableOpacity
          style={[styles.saveBtn, loading && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveBtnText}>Registrar {transactionType === 'expense' ? 'Gasto' : 'Ingreso'}</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
      </KeyboardAvoidingView>

      {showDatePicker && DateTimePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) setDate(selectedDate);
          }}
          maximumDate={new Date()}
        />
      )}

      {/* Selectores Searchable */}
      <SearchableSelector
        visible={categorySelectorVisible}
        onClose={() => setCategorySelectorVisible(false)}
        title="Categoría"
        placeholder="Buscar categoría..."
        selectedId={category}
        items={categories.map(cat => ({
          id: cat,
          name: cat,
          icon: CATEGORY_ICONS[cat.toLowerCase()] || "receipt-outline",
          color: CATEGORY_COLORS[cat.toLowerCase()] || "#2e7d32"
        }))}
        onSelect={(item) => setCategory(item.id)}
      />

      <SearchableSelector
        visible={parcelSelectorVisible}
        onClose={() => setParcelSelectorVisible(false)}
        title="Parcelas"
        placeholder="Buscar parcela..."
        selectedId={selectedParcelaId}
        items={[
          { id: null, name: "Ninguna", icon: "close-circle-outline", color: "#94a3b8" },
          ...parcels.map(p => ({
            id: p.id,
            name: p.name,
            icon: "location-outline",
            color: "#2e7d32"
          }))
        ]}
        onSelect={(item) => setSelectedParcelaId(item.id)}
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
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#f1f5f9",
    backgroundColor: "#fff",
    zIndex: 10,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#f8fafc",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1b1f23",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  ocrFirstSection: {
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 10,
  },
  amountHeader: {
    alignItems: "center",
    paddingVertical: 16,
    backgroundColor: "#fff",
  },
  amountLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#94a3b8",
    letterSpacing: 1,
    marginBottom: 4,
  },
  amountInputRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  mainAmountInput: {
    fontSize: 48,
    fontWeight: "300",
    textAlign: "right",
    minWidth: 80,
    letterSpacing: -2,
  },
  currencyText: {
    fontSize: 24,
    fontWeight: "400",
    marginLeft: 6,
    marginTop: 8,
  },
  typeSelectorWrapper: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  typeSelector: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderRadius: 16,
    padding: 4,
  },
  typeBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  typeBtnActiveExpense: {
    backgroundColor: "#1e293b",
  },
  typeBtnActiveIncome: {
    backgroundColor: "#2e7d32",
  },
  typeBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#64748b",
  },
  typeBtnTextActive: {
    color: "#fff",
  },
  formSection: {
    paddingHorizontal: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#94a3b8",
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  textInput: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  fiscalInput: {
    backgroundColor: "#ffffff",
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  row: {
    flexDirection: "row",
    marginBottom: 20,
  },
  dateSelector: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8fafc",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  dateSelectorText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
  },
  chipScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  catChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  catChipActiveGreen: {
    backgroundColor: "#2e7d32",
    borderColor: "#2e7d32",
  },
  catChipText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748b",
  },
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
  docActions: {
    flexDirection: "row",
    gap: 10,
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
    height: 100,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  previewImg: {
    width: "100%",
    height: "100%",
  },
  pdfPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
  },
  pdfName: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 4,
  },
  removeFile: {
    position: "absolute",
    top: 6,
    right: 6,
    backgroundColor: "#fff",
    borderRadius: 12,
  },
  ocrOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  ocrOverlayText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
    marginTop: 4,
  },
  fiscalSection: {
    marginTop: 4,
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  fiscalToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
  },
  fiscalToggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  fiscalToggleText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748b",
  },
  fiscalContent: {
    padding: 14,
    paddingTop: 0,
  },
  deductibleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 10,
  },
  deductibleLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1e293b",
  },
  saveBtn: {
    margin: 20,
    backgroundColor: "#2e7d32",
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
    shadowColor: "#2e7d32",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  saveBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },
});
