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
import { formatEuro } from "../utils/formatters";

const CROP_TYPES = [
  { id: 'uva', name: 'Uva', icon: 'flower', color: '#9333ea' },
  { id: 'aceituna_aderezo', name: 'Aceituna (Ad.)', icon: 'leaf', color: '#059669' },
  { id: 'aceituna_almazara', name: 'Aceituna (Alm.)', icon: 'leaf', color: '#059669' },
  { id: 'cereales', name: 'Cereales', icon: 'wheat', color: '#d97706' },
  { id: 'frutas', name: 'Frutas', icon: 'food-apple', color: '#dc2626' },
  { id: 'frutos_secos', name: 'F. Secos', icon: 'nut', color: '#ea580c' },
  { id: 'otros', name: 'Otros', icon: 'plus', color: '#475569' },
];

export default function HarvestTicketDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { ticket: initialTicket } = route.params || {};
  
  const [ticket, setTicket] = useState(initialTicket);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingFile, setLoadingFile] = useState(false);
  const [parcels, setParcels] = useState([]);
  const [clients, setClients] = useState([]);

  // Form states
  const [cropType, setCropType] = useState(initialTicket?.crop_type || 'uva');
  const [ticketNumber, setTicketNumber] = useState(initialTicket?.ticket_number || "");
  const [kilograms, setKilograms] = useState(initialTicket?.kilograms?.toString() || "");
  const [grossWeight, setGrossWeight] = useState(initialTicket?.gross_weight?.toString() || "");
  const [tareWeight, setTareWeight] = useState(initialTicket?.tare_weight?.toString() || "");
  const [degrees, setDegrees] = useState(initialTicket?.degrees?.toString() || "");
  const [caliber, setCaliber] = useState(initialTicket?.caliber || "");
  const [unitPrice, setUnitPrice] = useState(initialTicket?.unit_price?.toString() || "");
  const [totalAmount, setTotalAmount] = useState(initialTicket?.total_amount?.toString() || "");
  const [notes, setNotes] = useState(initialTicket?.notes || "");
  const [date, setDate] = useState(initialTicket?.date ? new Date(initialTicket.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0]);
  const [parcelId, setParcelId] = useState(initialTicket?.parcel_id || "");
  const [clientId, setClientId] = useState(initialTicket?.client_id || "");
  const [paymentStatus, setPaymentStatus] = useState(initialTicket?.payment_status || "pending");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [parcelsRes, clientsRes] = await Promise.all([
        dypai.api.get("obtener_parcels"),
        dypai.api.get("obtener_clientes")
      ]);

      if (parcelsRes.error) throw parcelsRes.error;
      if (clientsRes.error) throw clientsRes.error;

      setParcels(Array.isArray(parcelsRes.data) ? parcelsRes.data : []);
      setClients(Array.isArray(clientsRes.data) ? clientsRes.data : []);
    } catch (error) {
      console.error("Error cargando datos:", error);
    }
  };

  const handleDownload = async () => {
    if (!ticket?.photo_url && !ticket?.id) return;
    
    setLoadingFile(true);
    try {
      const { data, error } = await dypai.api.post('descargar_documento_albaran', {
        entity_id: ticket.id,
        file_path: ticket.photo_url
      });
      if (error) throw error;

      const signedUrl = data?.signedUrl || data?.signed_url;
      
      if (signedUrl) {
        const canOpen = await Linking.canOpenURL(signedUrl);
        if (canOpen) {
          await Linking.openURL(signedUrl);
        } else {
          Alert.alert("Información", "El documento se abrirá en tu navegador");
        }
      } else {
        throw new Error("No se pudo generar el enlace de descarga");
      }
    } catch (error) {
      console.error("Error descargando archivo:", error);
      Alert.alert("Error", error.message || "No se pudo descargar el documento");
    } finally {
      setLoadingFile(false);
    }
  };

  const handleSave = async () => {
    if (!kilograms || !parcelId || !clientId) {
      Alert.alert("Error", "Por favor completa los campos obligatorios (Kilos, Parcela y Cliente)");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        id: ticket.id,
        campaign_id: ticket.campaign_id,
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
      };

      const { error } = await dypai.api.put("actualizar_harvest_ticket", payload);
      if (error) throw error;

      setTicket({ ...ticket, ...payload });
      setIsEditing(false);
      Alert.alert("Éxito", "Albarán actualizado correctamente");
    } catch (error) {
      console.error("Error actualizando albarán:", error);
      Alert.alert("Error", "No se pudo actualizar el albarán");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    Alert.alert(
      "Eliminar Albarán",
      "¿Estás seguro de que deseas eliminar este albarán? Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive",
          onPress: async () => {
            setLoading(true);
            try {
              const { error } = await dypai.api.delete("eliminar_harvest_ticket", { params: { id: ticket.id } });
              if (error) throw error;
              navigation.goBack();
            } catch (error) {
              console.error("Error eliminando:", error);
              Alert.alert("Error", "No se pudo eliminar el albarán");
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
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

  const cropInfo = CROP_TYPES.find(c => c.id === cropType) || CROP_TYPES[CROP_TYPES.length - 1];
  const hasFile = !!(ticket?.photo_url);
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.headerContainer, { paddingTop: insets.top + 4 }]}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButtonInner}>
            <Ionicons name="chevron-back" size={24} color="#1b1f23" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{isEditing ? "Editar" : "Detalle"} de Albarán</Text>
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
          {/* Header Minimalista */}
          <View style={styles.minimalHeader}>
            {isEditing ? (
              <View style={styles.editForm}>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>CONCEPTO / Nº ALBARÁN</Text>
                  <TextInput 
                    style={styles.input} 
                    value={ticketNumber} 
                    onChangeText={setTicketNumber} 
                    placeholder="Ej: AL-2024-001"
                  />
                </View>
                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.label}>KILOS NETOS (kg) *</Text>
                    <TextInput 
                      style={styles.input} 
                      value={kilograms} 
                      onChangeText={setKilograms} 
                      keyboardType="decimal-pad"
                      placeholder="0"
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.label}>FECHA *</Text>
                    <TextInput
                      style={styles.input}
                      value={date}
                      onChangeText={setDate}
                      placeholder="YYYY-MM-DD"
                    />
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.amountContainer}>
                <Text style={styles.mainAmountText}>
                  {parseFloat(ticket.kilograms || 0).toLocaleString()} <Text style={styles.mainAmountUnit}>kg</Text>
                </Text>
                <Text style={styles.mainConceptText}>
                  #{ticket.ticket_number || 'S/N'} • {cropInfo.name}
                </Text>
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
                <Text style={styles.infoLabel}>TIPO DE CULTIVO</Text>
                {isEditing ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.cropGrid}>
                    {CROP_TYPES.map((crop) => (
                      <TouchableOpacity
                        key={crop.id}
                        style={[styles.cropChip, cropType === crop.id && styles.cropChipActive]}
                        onPress={() => setCropType(crop.id)}
                      >
                        <MaterialCommunityIcons 
                          name={crop.icon} 
                          size={18} 
                          color={cropType === crop.id ? "#fff" : crop.color} 
                        />
                        <Text style={[styles.cropChipText, cropType === crop.id && styles.cropChipTextActive]}>
                          {crop.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                ) : (
                  <View style={styles.valueWithIcon}>
                    <View style={[styles.smallIconBox, { backgroundColor: `${cropInfo.color}15` }]}>
                      <MaterialCommunityIcons name={cropInfo.icon} size={14} color={cropInfo.color} />
                    </View>
                    <Text style={styles.detailValue}>{cropInfo.name}</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>PARCELA</Text>
                {isEditing ? (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {parcels.map((p) => (
                      <TouchableOpacity
                        key={p.id}
                        style={[styles.chip, parcelId === p.id && styles.chipActive]}
                        onPress={() => setParcelId(p.id)}
                      >
                        <Text style={[styles.chipText, parcelId === p.id && styles.chipTextActive]}>
                          {p.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                ) : (
                  <View style={styles.valueWithIcon}>
                    <View style={styles.smallIconBox}>
                      <Ionicons name="location-outline" size={14} color="#2e7d32" />
                    </View>
                    <Text style={styles.detailValue}>{ticket.parcel_name || "Sin parcela"}</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>CLIENTE / COOPERATIVA</Text>
                {isEditing ? (
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
                ) : (
                  <View style={styles.valueWithIcon}>
                    <View style={styles.smallIconBox}>
                      <MaterialCommunityIcons name="office-building" size={14} color="#2e7d32" />
                    </View>
                    <Text style={styles.detailValue}>{ticket.client_name || "Sin cliente"}</Text>
                  </View>
                )}
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>ESTADO DEL COBRO</Text>
                {isEditing ? (
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
                ) : (
                  <View style={styles.valueWithIcon}>
                    <Ionicons 
                      name={ticket.payment_status === 'paid' ? "checkmark-circle" : "time-outline"} 
                      size={18} 
                      color={ticket.payment_status === 'paid' ? "#2e7d32" : "#ffb300"} 
                    />
                    <Text style={[styles.detailValue, { color: ticket.payment_status === 'paid' ? "#2e7d32" : "#ffb300" }]}>
                      {ticket.payment_status === 'paid' ? "Cobrado" : "Pendiente de cobro"}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Datos de Pesaje */}
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="scale" size={20} color="#1b1f23" />
              <Text style={styles.sectionTitle}>DATOS DE PESAJE</Text>
            </View>

            {isEditing ? (
              <View style={styles.editForm}>
                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.label}>PESO BRUTO (kg)</Text>
                    <TextInput 
                      style={styles.input} 
                      value={grossWeight} 
                      onChangeText={setGrossWeight} 
                      keyboardType="decimal-pad"
                      placeholder="0"
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.label}>TARA (kg)</Text>
                    <TextInput 
                      style={styles.input} 
                      value={tareWeight} 
                      onChangeText={setTareWeight} 
                      keyboardType="decimal-pad"
                      placeholder="0"
                    />
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>PESO BRUTO</Text>
                  <Text style={styles.detailValue}>{ticket.gross_weight ? `${parseFloat(ticket.gross_weight).toLocaleString()} kg` : "-"}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>TARA</Text>
                  <Text style={styles.detailValue}>{ticket.tare_weight ? `${parseFloat(ticket.tare_weight).toLocaleString()} kg` : "-"}</Text>
                </View>
              </View>
            )}

            {/* Datos Técnicos */}
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="chart-line" size={20} color="#1b1f23" />
              <Text style={styles.sectionTitle}>DATOS TÉCNICOS</Text>
            </View>

            {isEditing ? (
              <View style={styles.editForm}>
                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.label}>
                      {cropType === 'uva' ? 'GRADOS (%)' : 'RENDIMIENTO (%)'}
                    </Text>
                    <TextInput 
                      style={styles.input} 
                      value={degrees} 
                      onChangeText={setDegrees} 
                      keyboardType="decimal-pad"
                      placeholder="0.0"
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.label}>CALIBRE / VARIEDAD</Text>
                    <TextInput 
                      style={styles.input} 
                      value={caliber} 
                      onChangeText={setCaliber} 
                      placeholder="Ej: Picual"
                    />
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.infoRow}>
                {(ticket.crop_type === 'uva' || ticket.crop_type === 'aceituna_almazara') && (
                  <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>
                      {ticket.crop_type === 'uva' ? 'GRADOS' : 'RENDIMIENTO'}
                    </Text>
                    <Text style={styles.detailValue}>{ticket.degrees ? `${ticket.degrees}%` : "-"}</Text>
                  </View>
                )}
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>CALIBRE / VARIEDAD</Text>
                  <Text style={styles.detailValue}>{ticket.caliber || "-"}</Text>
                </View>
              </View>
            )}

            {/* Datos Económicos */}
            <View style={styles.sectionHeader}>
              <MaterialCommunityIcons name="currency-eur" size={20} color="#1b1f23" />
              <Text style={styles.sectionTitle}>DATOS ECONÓMICOS</Text>
            </View>

            {isEditing ? (
              <View style={styles.editForm}>
                <View style={styles.row}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.label}>PRECIO UNITARIO (€/kg)</Text>
                    <TextInput 
                      style={styles.input} 
                      value={unitPrice} 
                      onChangeText={setUnitPrice} 
                      keyboardType="decimal-pad"
                      placeholder="0.00"
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                    <Text style={styles.label}>IMPORTE TOTAL (€)</Text>
                    <TextInput 
                      style={[styles.input, { color: '#2e7d32', fontWeight: '800' }]} 
                      value={totalAmount} 
                      onChangeText={setTotalAmount} 
                      keyboardType="decimal-pad"
                      placeholder="0.00"
                    />
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.infoRow}>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>PRECIO UNITARIO</Text>
                  <Text style={styles.detailValue}>{ticket.unit_price ? `${ticket.unit_price} €/kg` : "-"}</Text>
                </View>
                <View style={styles.infoItem}>
                  <Text style={styles.infoLabel}>IMPORTE TOTAL</Text>
                  <Text style={[styles.detailValue, { color: ticket.total_amount ? "#2e7d32" : "#64748b" }]}>
                    {ticket.total_amount ? formatEuro(parseFloat(ticket.total_amount)) : "Pendiente liquidar"}
                  </Text>
                </View>
              </View>
            )}

            {/* Observaciones */}
            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>OBSERVACIONES</Text>
                {isEditing ? (
                  <TextInput 
                    style={[styles.input, styles.textArea]} 
                    value={notes} 
                    onChangeText={setNotes} 
                    multiline 
                    placeholder="Notas adicionales sobre este albarán..."
                  />
                ) : (
                  <Text style={styles.descriptionValue}>{ticket.notes || "No hay notas adicionales."}</Text>
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
                <Text style={styles.deleteBtnText}>Eliminar este albarán</Text>
              </TouchableOpacity>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
    paddingBottom: 10, 
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
    width: 40, 
    height: 40, 
    borderRadius: 12, 
    backgroundColor: "#f5f7fa", 
    justifyContent: "center", 
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#e0e0e0"
  },
  editButtonInner: {
    width: 40, 
    height: 40, 
    borderRadius: 14, 
    backgroundColor: "#e8f5e9", 
    justifyContent: "center", 
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#c8e6c9"
  },
  headerTitle: { 
    fontSize: 16, 
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
    textAlign: "center",
    color: "#1b1f23"
  },
  mainAmountUnit: {
    fontSize: 24,
    fontWeight: "300",
    color: "#64748b"
  },
  mainConceptText: {
    fontSize: 17,
    fontWeight: "500",
    color: "#64748b",
    marginBottom: 16,
    textAlign: "center"
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
    marginBottom: 24,
    marginTop: 8
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
    borderBottomColor: "#f1f5f9",
    flexDirection: "row",
    gap: 16
  },
  infoItem: { 
    flex: 1,
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
  row: { flexDirection: "row", justifyContent: "space-between" },
  cropGrid: { flexDirection: "row", marginTop: 8 },
  cropChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0"
  },
  cropChipActive: {
    backgroundColor: "#2e7d32",
    borderColor: "#2e7d32"
  },
  cropChipText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748b"
  },
  cropChipTextActive: {
    color: "#fff"
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0"
  },
  chipActive: {
    backgroundColor: "#2e7d32",
    borderColor: "#2e7d32"
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#64748b"
  },
  chipTextActive: {
    color: "#fff",
    fontWeight: "700"
  },
  statusBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0"
  },
  statusBtnPending: {
    backgroundColor: "#fff8e1",
    borderColor: "#ffb300"
  },
  statusBtnPaid: {
    backgroundColor: "#e8f5e9",
    borderColor: "#2e7d32"
  },
  statusBtnText: {
    fontWeight: "700",
    color: "#64748b"
  },
  statusBtnTextActive: {
    color: "#1b1f23"
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

