import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Platform,
  Linking,
  KeyboardAvoidingView,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { dypai } from "../lib/dypai";
import { formatDateFull, formatEuro } from "../utils/formatters";
import SearchableSelector from "../components/SearchableSelector";

let DateTimePicker;
if (Platform.OS !== "web") {
  try {
    DateTimePicker = require("@react-native-community/datetimepicker").default;
  } catch (e) {
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

export default function TransactionDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { transaction: initialTransaction } = route.params || {};
  
  const [transaction, setTransaction] = useState(initialTransaction);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingFile, setLoadingFile] = useState(false);
  const [parcels, setParcels] = useState([]);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showFiscalData, setShowFiscalData] = useState(false);
  const [categorySelectorVisible, setCategorySelectorVisible] = useState(false);
  const [parcelSelectorVisible, setParcelSelectorVisible] = useState(false);

  // Form states
  const [concept, setConcept] = useState(initialTransaction?.concept || "");
  const [amount, setAmount] = useState(initialTransaction?.amount?.toString() || "");
  const [date, setDate] = useState(initialTransaction?.date ? new Date(initialTransaction.date) : new Date());
  const [category, setCategory] = useState(initialTransaction?.category || "");
  const [isDeductible, setIsDeductible] = useState(initialTransaction?.is_deductible || false);
  const [description, setDescription] = useState(initialTransaction?.descripcion || "");
  const [parcelId, setParcelId] = useState(initialTransaction?.parcel_id || null);
  const [numeroFactura, setNumeroFactura] = useState(initialTransaction?.numero_factura || "");
  const [proveedor, setProveedor] = useState(initialTransaction?.proveedor || initialTransaction?.cliente || "");
  const [baseImponible, setBaseImponible] = useState(initialTransaction?.base_imponible?.toString() || "");
  const [iva, setIva] = useState(initialTransaction?.iva?.toString() || "");

  useEffect(() => {
    loadParcels();
    if (!!(initialTransaction?.base_imponible || initialTransaction?.iva || initialTransaction?.numero_factura || initialTransaction?.proveedor)) {
      setShowFiscalData(true);
    }
  }, []);

  const loadParcels = async () => {
    try {
      const res = await dypai.api.get("obtener_parcels");
      const data = Array.isArray(res) ? res : (res?.data || []);
      setParcels(data);
    } catch (error) {
      console.error("Error cargando parcelas:", error);
    }
  };

  const handleDownload = async () => {
    const fileId = transaction?.archivo_adjunto_id || transaction?.receipt_image_url;
    if (!fileId) return;
    
    setLoadingFile(true);
    try {
      const { data, error } = await dypai.storage
        .from('files')
        .createSignedUrl(fileId, 60);

      if (error) throw error;

      if (data?.signedUrl) {
        await Linking.openURL(data.signedUrl);
      }
    } catch (error) {
      console.error("Error descargando archivo:", error);
      Alert.alert("Error", "No se pudo abrir el archivo");
    } finally {
      setLoadingFile(false);
    }
  };

  const handleSave = async () => {
    if (!concept.trim() || !amount || !category) {
      Alert.alert("Error", "Por favor rellena los campos obligatorios");
      return;
    }

    setLoading(true);
    try {
      const updatedData = {
        id: transaction.id,
        type: transaction.type,
        amount: parseFloat(amount),
        date: date.toISOString().split('T')[0],
        concept: concept.trim(),
        category: category,
        is_deductible: transaction.type === 'expense' ? isDeductible : false,
        numero_factura: numeroFactura || null,
        proveedor: proveedor || null,
        iva: iva ? parseFloat(iva) : null,
        base_imponible: baseImponible ? parseFloat(baseImponible) : null,
        parcel_id: parcelId === "none" ? null : parcelId,
        descripcion: description || null,
      };

      await dypai.api.put("actualizar_transaccion", updatedData);
      
      setTransaction({ ...transaction, ...updatedData });
      setIsEditing(false);
      Alert.alert("Éxito", "Transacción actualizada correctamente");
    } catch (error) {
      console.error("Error actualizando transacción:", error);
      Alert.alert("Error", "No se pudo actualizar la transacción");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      "Eliminar Transacción",
      "¿Estás seguro de que deseas eliminar esta transacción? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              if (transaction.archivo_adjunto_id) {
                await dypai.storage.from('files').remove([transaction.archivo_adjunto_id]);
              }
              await dypai.api.delete("eliminar_transaccion", { params: { id: transaction.id } });
              navigation.goBack();
            } catch (error) {
              console.error("Error eliminando:", error);
              Alert.alert("Error", "No se pudo eliminar la transacción");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const isIncome = transaction?.type === 'income';
  const categories = isIncome ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const hasFile = !!(transaction?.archivo_adjunto_id || transaction?.receipt_image_url);
  const catColor = CATEGORY_COLORS[transaction?.category?.toLowerCase()] || "#475569";

  return (
    <View style={styles.container}>
      {/* Header Estilo App */}
      <View style={[styles.headerContainer, { paddingTop: insets.top + 8 }]}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonInner}>
            <Ionicons name="chevron-back" size={24} color="#1b1f23" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEditing ? "Editar" : "Detalle"} de {isIncome ? "Ingreso" : "Gasto"}</Text>
          {!isEditing ? (
            <TouchableOpacity onPress={() => setIsEditing(true)} style={styles.editButtonInner}>
              <Ionicons name="create-outline" size={22} color="#2e7d32" />
            </TouchableOpacity>
          ) : <View style={{ width: 44 }} />}
        </View>
      </View>

      <KeyboardAvoidingView 
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
      >
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header Minimalista Estilo Banco */}
        <View style={styles.minimalHeader}>
          {isEditing ? (
            <View style={styles.editForm}>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>CONCEPTO *</Text>
                <TextInput 
                  style={styles.input} 
                  value={concept} 
                  onChangeText={setConcept} 
                  placeholder="Ej: Semillas de Maíz"
                />
              </View>
              <View style={styles.row}>
                <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>IMPORTE (€) *</Text>
                  <TextInput 
                    style={styles.input} 
                    value={amount} 
                    onChangeText={setAmount} 
                    keyboardType="decimal-pad"
                    placeholder="0.00"
                  />
                </View>
                <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={styles.label}>FECHA *</Text>
                  <TouchableOpacity style={styles.inputDate} onPress={() => setShowDatePicker(true)}>
                    <Text style={styles.dateInputText}>{date.toLocaleDateString('es-ES')}</Text>
                    <Ionicons name="calendar-outline" size={18} color="#607463" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.amountContainer}>
              <Text style={[styles.mainAmountText, { color: isIncome ? "#2e7d32" : "#1b1f23" }]}>
                {isIncome ? "+" : "-"}{formatEuro(transaction.amount)}
              </Text>
              <Text style={styles.mainConceptText}>{transaction.concept}</Text>
            </View>
          )}
        </View>

        {/* Card de Documento */}
        {hasFile && !isEditing && (
          <TouchableOpacity 
            style={styles.fileCard} 
            onPress={handleDownload}
            disabled={loadingFile}
            activeOpacity={0.7}
          >
            <View style={styles.fileIconBox}>
              <MaterialCommunityIcons name="file-pdf-box" size={32} color="#c62828" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.fileTitle}>Documento Adjunto</Text>
              <Text style={styles.fileSubtitle}>Toca para descargar o ver</Text>
            </View>
            <View style={styles.downloadCircle}>
              {loadingFile ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="download" size={18} color="#fff" />
              )}
            </View>
          </TouchableOpacity>
        )}

        {/* Sección de Detalles */}
        <View style={styles.detailsSection}>
          <View style={styles.sectionHeader}>
            <MaterialCommunityIcons name="information-variant" size={20} color="#1b1f23" />
            <Text style={styles.sectionTitle}>DETALLES GENERALES</Text>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>CATEGORÍA</Text>
              {isEditing ? (
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
              ) : (
                <View style={styles.valueWithIcon}>
                  <View style={[styles.smallIconBox, { backgroundColor: `${catColor}15` }]}>
                    <Ionicons name={CATEGORY_ICONS[transaction.category?.toLowerCase()] || "receipt-outline"} size={14} color={catColor} />
                  </View>
                  <Text style={styles.detailValue}>{transaction.category || "Sin categoría"}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.infoRow}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>PARCELA</Text>
              {isEditing ? (
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
                      <Text style={styles.selectorPlaceholder}>Ninguna (opcional)</Text>
                    )}
                  </View>
                  <Ionicons name="chevron-down" size={20} color="#94a3b8" />
                </TouchableOpacity>
              ) : (
                <View style={styles.valueWithIcon}>
                  <View style={styles.smallIconBox}>
                    <Ionicons name="location-outline" size={14} color="#2e7d32" />
                  </View>
                  <Text style={styles.detailValue}>
                    {parcels.find(p => p.id === transaction.parcel_id)?.name || "Sin parcela"}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {!isIncome && (
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>DEDUCIBLE</Text>
                {isEditing ? (
                  <TouchableOpacity 
                    style={styles.deductibleToggle}
                    onPress={() => setIsDeductible(!isDeductible)}
                  >
                    <Ionicons name={isDeductible ? "checkbox" : "square-outline"} size={24} color="#2e7d32" />
                    <Text style={styles.toggleText}>{isDeductible ? "Sí, marcar como deducible" : "No es deducible"}</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.valueWithIcon}>
                    <Ionicons 
                      name={transaction.is_deductible ? "checkmark-circle" : "close-circle"} 
                      size={18} 
                      color={transaction.is_deductible ? "#2e7d32" : "#64748b"} 
                    />
                    <Text style={[styles.detailValue, { color: transaction.is_deductible ? "#2e7d32" : "#64748b" }]}>
                      {transaction.is_deductible ? "Sí, incluido en deducciones" : "No deducible"}
                    </Text>
                  </View>
                )}
              </View>
            </View>
          )}

          {/* Datos Fiscales Accordion */}
          <TouchableOpacity 
            style={[styles.fiscalToggle, showFiscalData && styles.fiscalToggleActive]} 
            onPress={() => setShowFiscalData(!showFiscalData)}
            activeOpacity={0.7}
          >
            <View style={styles.fiscalToggleTitle}>
              <MaterialCommunityIcons name="file-percent" size={20} color={showFiscalData ? "#fff" : "#1b1f23"} />
              <Text style={[styles.fiscalToggleText, showFiscalData && { color: "#fff" }]}>DATOS FISCALES</Text>
            </View>
            <Ionicons name={showFiscalData ? "chevron-up" : "chevron-down"} size={20} color={showFiscalData ? "#fff" : "#607463"} />
          </TouchableOpacity>

          {showFiscalData && (
            <View style={styles.fiscalContent}>
              <View style={styles.editForm}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{isIncome ? "CLIENTE" : "PROVEEDOR"}</Text>
                  {isEditing ? (
                    <TextInput style={styles.input} value={proveedor} onChangeText={setProveedor} placeholder="Nombre de empresa" />
                  ) : <Text style={styles.detailValue}>{proveedor || "No especificado"}</Text>}
                </View>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Nº FACTURA / TICKET</Text>
                  {isEditing ? (
                    <TextInput style={styles.input} value={numeroFactura} onChangeText={setNumeroFactura} placeholder="Ej: 2024/001" />
                  ) : <Text style={styles.detailValue}>{numeroFactura || "No especificado"}</Text>}
                </View>

                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.label}>BASE IMPONIBLE</Text>
                    {isEditing ? (
                      <TextInput style={styles.input} value={baseImponible} onChangeText={setBaseImponible} keyboardType="decimal-pad" placeholder="0.00" />
                    ) : <Text style={styles.detailValue}>{baseImponible ? formatEuro(baseImponible) : "-"}</Text>}
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.label}>IVA (€)</Text>
                    {isEditing ? (
                      <TextInput style={styles.input} value={iva} onChangeText={setIva} keyboardType="decimal-pad" placeholder="0.00" />
                    ) : <Text style={styles.detailValue}>{iva ? formatEuro(iva) : "-"}</Text>}
                  </View>
                </View>
              </View>
            </View>
          )}

          <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>OBSERVACIONES</Text>
              {isEditing ? (
                <TextInput 
                  style={[styles.input, styles.textArea]} 
                  value={description} 
                  onChangeText={setDescription} 
                  multiline 
                  placeholder="Notas adicionales sobre este movimiento..."
                />
              ) : (
                <Text style={styles.descriptionValue}>{transaction.descripcion || "No hay notas adicionales."}</Text>
              )}
            </View>
          </View>
        </View>

        {/* Botones de Acción Finales */}
        <View style={styles.actionsContainer}>
          {isEditing ? (
            <View style={styles.row}>
              <TouchableOpacity 
                style={[styles.actionBtn, styles.cancelBtn]} 
                onPress={() => setIsEditing(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.actionBtn, styles.saveBtn]} 
                onPress={handleSave} 
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Guardar Cambios</Text>}
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity 
              style={styles.deleteBtn} 
              onPress={handleDelete} 
              disabled={loading}
              activeOpacity={0.7}
            >
              <View style={styles.deleteIconCircle}>
                <Ionicons name="trash-outline" size={20} color="#c62828" />
              </View>
              <Text style={styles.deleteBtnText}>Eliminar este movimiento</Text>
            </TouchableOpacity>
          )}
        </View>
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
        selectedId={parcelId}
        items={[
          { id: null, name: "Ninguna", icon: "close-circle-outline", color: "#94a3b8" },
          ...parcels.map(p => ({
            id: p.id,
            name: p.name,
            icon: "location-outline",
            color: "#2e7d32"
          }))
        ]}
        onSelect={(item) => setParcelId(item.id)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#f7f9f5" 
  },
  headerContainer: { 
    backgroundColor: "#fff", 
    paddingBottom: 16, 
    paddingHorizontal: 20, 
    borderBottomWidth: StyleSheet.hairlineWidth, 
    borderBottomColor: "#eef2ee",
    zIndex: 10,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8
  },
  topBar: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "space-between" 
  },
  backButtonInner: { 
    width: 44, 
    height: 44, 
    borderRadius: 14, 
    backgroundColor: "#f5f7fa", 
    justifyContent: "center", 
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e0e0e0"
  },
  editButtonInner: {
    width: 44, 
    height: 44, 
    borderRadius: 14, 
    backgroundColor: "#e8f5e9", 
    justifyContent: "center", 
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#c8e6c9"
  },
  headerTitle: { 
    fontSize: 17, 
    fontWeight: "800", 
    color: "#1b1f23",
    letterSpacing: -0.5
  },
  content: { 
    padding: 0,
    paddingBottom: 120 
  },
  minimalHeader: {
    backgroundColor: "#fff",
    paddingTop: 32,
    paddingBottom: 40,
    paddingHorizontal: 24,
    alignItems: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#f1f5f9"
  },
  amountContainer: {
    alignItems: "center",
    width: "100%"
  },
  mainAmountText: {
    fontSize: 48,
    fontWeight: "300",
    letterSpacing: -2,
    marginBottom: 12,
    textAlign: "center"
  },
  mainConceptText: {
    fontSize: 17,
    fontWeight: "500",
    color: "#64748b",
    marginBottom: 16,
    textAlign: "center"
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: "#f8fafc",
    borderRadius: 20
  },
  statusText: {
    fontSize: 12,
    fontWeight: "600"
  },
  amountCard: { 
    backgroundColor: "#fff", 
    borderRadius: 20, 
    padding: 24, 
    marginBottom: 20, 
    borderLeftWidth: 8, 
    elevation: 3, 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 4 }, 
    shadowOpacity: 0.08, 
    shadowRadius: 12 
  },
  mainInfoRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 16, 
    marginBottom: 16 
  },
  iconCircle: { 
    width: 60, 
    height: 60, 
    borderRadius: 20, 
    justifyContent: "center", 
    alignItems: "center" 
  },
  conceptContainer: { 
    flex: 1 
  },
  conceptText: { 
    fontSize: 20, 
    fontWeight: "900", 
    color: "#1b1f23",
    lineHeight: 24
  },
  dateSubtitle: { 
    fontSize: 14, 
    color: "#64748b", 
    marginTop: 4,
    fontWeight: "500"
  },
  amountDivider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginVertical: 16
  },
  amountText: { 
    fontSize: 36, 
    fontWeight: "900", 
    textAlign: "right",
    letterSpacing: -1
  },
  fileCard: { 
    flexDirection: "row", 
    alignItems: "center", 
    backgroundColor: "#fff", 
    padding: 16, 
    marginBottom: 20,
    width: "100%",
    gap: 16, 
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#e2e8f0"
  },
  fileIconBox: { 
    width: 52, 
    height: 52, 
    borderRadius: 12, 
    backgroundColor: "#fff1f2", 
    justifyContent: "center", 
    alignItems: "center" 
  },
  fileTitle: { 
    fontSize: 16, 
    fontWeight: "800", 
    color: "#1b1f23" 
  },
  fileSubtitle: { 
    fontSize: 13, 
    color: "#64748b", 
    fontWeight: "500",
    marginTop: 2
  },
  downloadCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#2e7d32",
    justifyContent: "center",
    alignItems: "center"
  },
  detailsSection: { 
    backgroundColor: "#fff", 
    padding: 24, 
    marginBottom: 24,
    width: "100%"
  },
  sectionHeader: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 8, 
    marginBottom: 24 
  },
  sectionTitle: { 
    fontSize: 13, 
    fontWeight: "900", 
    color: "#64748b", 
    letterSpacing: 1.5 
  },
  infoRow: { 
    paddingBottom: 20,
    marginBottom: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#f1f5f9"
  },
  infoItem: { 
    gap: 8 
  },
  infoLabel: { 
    fontSize: 11, 
    fontWeight: "800", 
    color: "#94a3b8", 
    textTransform: "uppercase", 
    letterSpacing: 1 
  },
  valueWithIcon: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  smallIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center"
  },
  detailValue: { 
    fontSize: 17, 
    fontWeight: "700", 
    color: "#1e293b" 
  },
  descriptionValue: {
    fontSize: 15,
    fontWeight: "500",
    color: "#475569",
    lineHeight: 22,
    backgroundColor: "#f8fafc",
    padding: 16,
    borderRadius: 12,
    marginTop: 4
  },
  deductibleToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 12
  },
  toggleText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1e293b"
  },
  fiscalToggle: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    padding: 16, 
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    marginBottom: 20
  },
  fiscalToggleActive: {
    backgroundColor: "#1e293b",
  },
  fiscalToggleTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10
  },
  fiscalToggleText: { 
    fontSize: 14, 
    fontWeight: "800", 
    color: "#1e293b",
    letterSpacing: 0.5
  },
  fiscalContent: { 
    padding: 16,
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    marginTop: -10,
    marginBottom: 20,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0"
  },
  editForm: { 
    gap: 16,
    width: "100%"
  },
  inputGroup: { gap: 6 },
  label: { fontSize: 11, fontWeight: "800", color: "#64748b", marginBottom: 2 },
  input: { 
    backgroundColor: "#ffffff", 
    borderRadius: 12, 
    padding: 14, 
    fontSize: 16, 
    color: "#1b1f23", 
    borderWidth: 1, 
    borderColor: "#e2e8f0",
    fontWeight: "600",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top'
  },
  inputDate: { 
    backgroundColor: "#fff", 
    borderRadius: 12, 
    padding: 14, 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    borderWidth: 1, 
    borderColor: "#e2e8f0" 
  },
  dateInputText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1b1f23"
  },
  row: { flexDirection: "row", justifyContent: "space-between" },
  chipScroll: { marginTop: 4 },
  chip: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 24, backgroundColor: "#f1f5f9", marginRight: 10, borderWidth: 1, borderColor: "#e2e8f0" },
  chipActive: { backgroundColor: "#2e7d32", borderColor: "#2e7d32" },
  chipText: { fontSize: 13, fontWeight: "700", color: "#64748b" },
  chipTextActive: { color: "#fff" },
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
  actionsContainer: { 
    gap: 16,
    paddingHorizontal: 20,
    width: "100%"
  },
  actionBtn: { flex: 1, paddingVertical: 16, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  cancelBtn: { backgroundColor: "#f1f5f9", marginRight: 8 },
  cancelBtnText: { color: "#64748b", fontWeight: "800", fontSize: 15 },
  saveBtn: { backgroundColor: "#2e7d32", marginLeft: 8, elevation: 4, shadowColor: "#2e7d32", shadowOpacity: 0.3, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  saveBtnText: { color: "#fff", fontWeight: "900", fontSize: 15 },
  deleteBtn: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "center", 
    paddingVertical: 16, 
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#fee2e2"
  },
  deleteIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#fef2f2",
    justifyContent: "center",
    alignItems: "center"
  },
  deleteBtnText: { color: "#c62828", fontWeight: "800", fontSize: 15 },
});

