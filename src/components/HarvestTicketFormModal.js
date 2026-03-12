import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import BottomSheet from "./BottomSheet";
import { dypai } from "../lib/dypai";
import { useCampaign } from "../context/CampaignContext";
import SearchableSelector from "./SearchableSelector";

const CROP_TYPES = [
  { id: 'uva', name: 'Uva', icon: 'flower' },
  { id: 'aceituna_aderezo', name: 'Aceituna (Ad.)', icon: 'leaf' },
  { id: 'aceituna_almazara', name: 'Aceituna (Alm.)', icon: 'leaf' },
  { id: 'cereales', name: 'Cereales', icon: 'wheat' },
  { id: 'frutas', name: 'Frutas', icon: 'food-apple' },
  { id: 'frutos_secos', name: 'F. Secos', icon: 'nut' },
  { id: 'otros', name: 'Otros', icon: 'plus' },
];

export default function HarvestTicketFormModal({ visible, onClose, onSave, initialData }) {
  const { currentCampaignId } = useCampaign();
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    if (visible) {
      loadData();
      if (initialData) {
        setCropType(initialData.crop_type || "uva");
        setTicketNumber(initialData.ticket_number || "");
        setKilograms(initialData.kilograms?.toString() || "");
        setGrossWeight(initialData.gross_weight?.toString() || "");
        setTareWeight(initialData.tare_weight?.toString() || "");
        setDegrees(initialData.degrees?.toString() || "");
        setCaliber(initialData.caliber || "");
        setUnitPrice(initialData.unit_price?.toString() || "");
        setTotalAmount(initialData.total_amount?.toString() || "");
        setNotes(initialData.notes || "");
        if (initialData.date) {
          try {
            const d = new Date(initialData.date);
            if (!isNaN(d.getTime())) setDate(d.toISOString().split('T')[0]);
          } catch (e) {}
        }
        setParcelId(initialData.parcel_id || "");
        setClientId(initialData.client_id || "");
        setPaymentStatus(initialData.payment_status || "pending");
      } else {
        // Reset form for new entry
        setCropType('uva');
        setTicketNumber("");
        setKilograms("");
        setGrossWeight("");
        setTareWeight("");
        setDegrees("");
        setCaliber("");
        setUnitPrice("");
        setTotalAmount("");
        setNotes("");
        setDate(new Date().toISOString().split('T')[0]);
        setParcelId("");
        setClientId("");
        setPaymentStatus("pending");
      }
    }
  }, [visible, initialData]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [parcelsRes, clientsRes] = await Promise.all([
        dypai.api.get("obtener_parcels", {
          params: { sort_by: "name", order: "ASC", limit: 1000 },
        }),
        dypai.api.get("obtener_clientes")
      ]);
      
      setParcels(Array.isArray(parcelsRes) ? parcelsRes : (parcelsRes?.data || []));
      setClients(Array.isArray(clientsRes) ? clientsRes : (clientsRes?.data || []));
    } catch (error) {
      console.error("Error cargando datos para albarán:", error);
    } finally {
      setLoading(false);
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

  const handleSave = () => {
    if (!kilograms || !parcelId || !clientId) {
      Alert.alert("Error", "Por favor completa los campos obligatorios (Kilos, Parcela y Cliente)");
      return;
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
    };

    onSave(payload);
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={initialData ? "Editar Albarán" : "Nuevo Albarán"}
      snapPoints={["90%"]}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        {loading && <ActivityIndicator color="#2e7d32" style={{ marginBottom: 10 }} />}

        {/* Tipo de Cultivo */}
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

        <View style={styles.footer}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>
              {initialData ? "Actualizar Albarán" : "Registrar Entrada"}
            </Text>
          </TouchableOpacity>
        </View>
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
          iconType: 'material', // Indicar que es MaterialCommunityIcons
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
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, paddingBottom: 40 },
  label: { fontSize: 13, fontWeight: "700", color: "#607463", marginBottom: 8, marginTop: 12, textTransform: 'uppercase' },
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
  cropGrid: { flexDirection: "row", marginBottom: 10 },
  cropItem: {
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#f7f9f5",
    marginRight: 10,
    width: 90,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  cropItemActive: {
    backgroundColor: "#2e7d32",
    borderColor: "#2e7d32",
  },
  cropText: { fontSize: 10, fontWeight: "700", color: "#607463", marginTop: 4 },
  cropTextActive: { color: "#fff" },
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
  divider: { height: 1, backgroundColor: "#e0e0e0", marginVertical: 16 },
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
  footer: { marginTop: 24 },
  saveButton: {
    backgroundColor: "#2e7d32",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#2e7d32",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 4,
  },
  saveButtonText: { color: "#fff", fontWeight: "800", fontSize: 16 },
});

