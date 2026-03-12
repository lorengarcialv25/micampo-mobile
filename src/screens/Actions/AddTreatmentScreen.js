import React, { useState, useEffect } from "react";
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
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { dypai } from "../../lib/dypai";
import { useCampaign } from "../../context/CampaignContext";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function AddTreatmentScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { currentCampaignId } = useCampaign();
  
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [parcels, setParcels] = useState([]);
  const [showParcelPicker, setShowParcelPicker] = useState(false);

  // Form State
  const [selectedParcel, setSelectedParcel] = useState(null);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [name, setName] = useState("");
  const [activeIngredient, setActiveIngredient] = useState("");
  const [category, setCategory] = useState("");
  const [dose, setDose] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    loadParcels();
  }, []);

  const loadParcels = async () => {
    try {
      setLoadingData(true);
      const { data, error } = await dypai.api.get("obtener_parcels", {
        params: { sort_by: "name", order: "ASC", limit: 1000 },
      });
      if (error) throw error;
      setParcels(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error cargando parcelas:", error);
      Alert.alert("Error", "No se pudieron cargar las parcelas");
    } finally {
      setLoadingData(false);
    }
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const handleSave = async () => {
    if (!selectedParcel) {
      Alert.alert("Error", "Por favor selecciona una parcela");
      return;
    }
    if (!name.trim()) {
      Alert.alert("Error", "Por favor introduce el nombre del producto");
      return;
    }
    if (!currentCampaignId) {
      Alert.alert("Error", "No hay una campaña activa seleccionada");
      return;
    }

    try {
      setLoading(true);
      const treatmentData = {
        campaign_id: currentCampaignId,
        parcel_id: selectedParcel.id,
        application_date: date.toISOString().split("T")[0],
        name: name.trim(),
        active_ingredient: activeIngredient.trim(),
        category_name: category.trim(),
        dose: dose.trim(),
        notes: notes.trim(),
      };

      const { data, error } = await dypai.api.post("crear_treatment", treatmentData);
      if (error) throw error;

      Alert.alert("Éxito", "Tratamiento registrado correctamente");
      navigation.goBack();
    } catch (error) {
      console.error("Error guardando tratamiento:", error);
      Alert.alert("Error", error.message || "No se pudo registrar el tratamiento");
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#2e7d32" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="close" size={28} color="#1b1f23" />
          </TouchableOpacity>
          <Text style={styles.title}>Nuevo Tratamiento</Text>
          <View style={{ width: 28 }} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Parcela */}
          <Text style={styles.label}>Parcela</Text>
          <TouchableOpacity 
            style={styles.pickerButton} 
            onPress={() => setShowParcelPicker(!showParcelPicker)}
          >
            <Text style={[styles.pickerButtonText, !selectedParcel && styles.placeholder]}>
              {selectedParcel ? selectedParcel.name : "Selecciona una parcela"}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#607463" />
          </TouchableOpacity>

          {showParcelPicker && (
            <View style={styles.parcelList}>
              {parcels.map((parcel) => (
                <TouchableOpacity
                  key={parcel.id}
                  style={styles.parcelItem}
                  onPress={() => {
                    setSelectedParcel(parcel);
                    setShowParcelPicker(false);
                  }}
                >
                  <Text style={styles.parcelItemText}>{parcel.name}</Text>
                  {selectedParcel?.id === parcel.id && (
                    <Ionicons name="checkmark" size={20} color="#2e7d32" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Fecha */}
          <Text style={styles.label}>Fecha de Aplicación</Text>
          <TouchableOpacity 
            style={styles.pickerButton} 
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.pickerButtonText}>
              {date.toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}
            </Text>
            <Ionicons name="calendar-outline" size={20} color="#607463" />
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={handleDateChange}
            />
          )}

          {/* Producto */}
          <Text style={styles.label}>Producto (Marca)</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Ridomil Gold"
            value={name}
            onChangeText={setName}
          />

          {/* Ingrediente Activo */}
          <Text style={styles.label}>Materia Activa</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Metalaxil-M"
            value={activeIngredient}
            onChangeText={setActiveIngredient}
          />

          {/* Categoría */}
          <Text style={styles.label}>Categoría</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Fungicida"
            value={category}
            onChangeText={setCategory}
          />

          {/* Dosis */}
          <Text style={styles.label}>Dosis</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: 2 kg/Ha"
            value={dose}
            onChangeText={setDose}
          />

          {/* Notas */}
          <Text style={styles.label}>Notas</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Observaciones adicionales..."
            multiline
            numberOfLines={4}
            value={notes}
            onChangeText={setNotes}
          />

          <View style={{ height: 40 }} />
        </ScrollView>

        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <TouchableOpacity 
            style={[styles.saveButton, loading && styles.saveButtonDisabled]} 
            onPress={handleSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>Guardar Tratamiento</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  title: { fontSize: 18, fontWeight: "700", color: "#1b1f23" },
  backButton: { padding: 5 },
  content: { flex: 1, padding: 20 },
  label: { fontSize: 14, fontWeight: "600", color: "#607463", marginBottom: 8, marginTop: 15 },
  input: {
    backgroundColor: "#f5f7fa",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1b1f23",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  textArea: { height: 100, textAlignVertical: "top" },
  pickerButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f5f7fa",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  pickerButtonText: { fontSize: 16, color: "#1b1f23" },
  placeholder: { color: "#9CA3AF" },
  parcelList: {
    marginTop: 5,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    maxHeight: 200,
  },
  parcelItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 15,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#f0f0f0",
  },
  parcelItemText: { fontSize: 16, color: "#1b1f23" },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: "#f0f0f0" },
  saveButton: {
    backgroundColor: "#2e7d32",
    borderRadius: 12,
    height: 55,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2e7d32",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 4,
  },
  saveButtonDisabled: { opacity: 0.7 },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  centerContent: { flex: 1, justifyContent: "center", alignItems: "center" },
});

