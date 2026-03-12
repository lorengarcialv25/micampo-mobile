import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import BottomSheet from "./BottomSheet";

export default function WorkerFormModal({ visible, onClose, worker, onSave }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [dailyRate, setDailyRate] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [specialty, setSpecialty] = useState("");
  const [observations, setObservations] = useState("");

  useEffect(() => {
    if (worker) {
      // Modo edición: cargar datos del trabajador
      setName(worker.name || "");
      setPhone(worker.phone || "");
      setEmail(worker.email || "");
      setDailyRate(worker.default_daily_wage?.toString() || "");
      setHourlyRate(worker.hourly_rate?.toString() || "");
      setSpecialty(worker.specialty || "");
      setObservations(worker.observations || "");
    } else {
      // Modo creación: limpiar formulario
      setName("");
      setPhone("");
      setEmail("");
      setDailyRate("");
      setHourlyRate("");
      setSpecialty("");
      setObservations("");
    }
  }, [worker, visible]);

  const handleSave = () => {
    if (!name.trim()) {
      alert("Por favor, introduce el nombre del trabajador");
      return;
    }

    const workerData = {
      id: worker?.id,
      name: name.trim(),
      phone: phone.trim() || null,
      email: email.trim() || null,
      default_daily_wage: dailyRate ? parseFloat(dailyRate) : null,
      hourly_rate: hourlyRate ? parseFloat(hourlyRate) : null,
      specialty: specialty.trim() || null,
      observations: observations.trim() || null,
      payment_method: 'daily', // Por defecto 'daily'
    };

    onSave(workerData);
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={worker ? "Editar Trabajador" : "Nuevo Trabajador"}
      snapPoints={["90%"]}
    >
      <ScrollView 
        style={styles.form} 
        contentContainerStyle={{ paddingBottom: 16, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
      >
        {/* Nombre */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Nombre completo *</Text>
          <TextInput
            style={styles.input}
            placeholder="Introduce el nombre completo"
            placeholderTextColor="#9CA3AF"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        </View>

        {/* Teléfono y Email */}
        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Teléfono</Text>
            <TextInput
              style={styles.input}
              placeholder="Teléfono"
              placeholderTextColor="#9CA3AF"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1.5 }]}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="correo@ejemplo.com"
              placeholderTextColor="#9CA3AF"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Tarifas */}
        <View style={styles.row}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Precio Jornada (€)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor="#9CA3AF"
              value={dailyRate}
              onChangeText={setDailyRate}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Precio Hora (€)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor="#9CA3AF"
              value={hourlyRate}
              onChangeText={setHourlyRate}
              keyboardType="decimal-pad"
            />
          </View>
        </View>

        {/* Especialidad */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Especialidad</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Tractorista, Podador..."
            placeholderTextColor="#9CA3AF"
            value={specialty}
            onChangeText={setSpecialty}
            autoCapitalize="sentences"
          />
        </View>

        {/* Observaciones */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Observaciones</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Introduce cualquier observación adicional"
            placeholderTextColor="#9CA3AF"
            value={observations}
            onChangeText={setObservations}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
          <Text style={styles.hint}>Opcional: notas o información adicional sobre el trabajador</Text>
        </View>
      </ScrollView>

      {/* Botones */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.cancelButton]}
          onPress={onClose}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.saveButton]}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonText}>
            {worker ? "Guardar Cambios" : "Añadir Trabajador"}
          </Text>
        </TouchableOpacity>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  form: {
    padding: 20,
    paddingBottom: 10,
  },
  inputGroup: {
    marginBottom: 20,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f7f9f5",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    color: "#1b1f23",
  },
  textArea: {
    minHeight: 100,
    paddingTop: 14,
  },
  hint: {
    fontSize: 12,
    color: "#90a4ae",
    marginTop: 6,
  },
  actions: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    gap: 12,
    alignItems: "center",
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButton: {
    backgroundColor: "#f5f5f5",
  },
  cancelButtonText: {
    color: "#666",
    fontWeight: "700",
    fontSize: 15,
  },
  saveButton: {
    backgroundColor: "#2e7d32",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
});
