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

export default function ParcelaFormModal({ visible, onClose, onSave }) {
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [crop, setCrop] = useState("");
  const [variety, setVariety] = useState("");

  useEffect(() => {
    if (!visible) {
      // Limpiar formulario al cerrar
      setName("");
      setArea("");
      setCrop("");
      setVariety("");
    }
  }, [visible]);

  const handleSave = () => {
    if (!name.trim()) {
      alert("Por favor, introduce el nombre de la parcela");
      return;
    }

    // Mapear los campos del formulario a los nombres de la tabla parcels
    const parcelaData = {
      name: name.trim(),
      ...(area && { 
        area_ha: parseFloat(area.replace(/[^\d.,]/g, '').replace(',', '.')) || null 
      }),
      ...(crop && crop.trim() && { crop_type: crop.trim() }),
      ...(variety && variety.trim() && { variety: variety.trim() }),
    };

    onSave(parcelaData);
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Nueva Parcela"
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
          <Text style={styles.label}>Nombre de la parcela *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ingresa el nombre"
            placeholderTextColor="#9CA3AF"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        </View>

        {/* Área */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Área (hectáreas)</Text>
          <TextInput
            style={styles.input}
            placeholder="Número en hectáreas"
            placeholderTextColor="#9CA3AF"
            value={area}
            onChangeText={setArea}
            keyboardType="decimal-pad"
          />
          <Text style={styles.hint}>Opcional: área total de la parcela</Text>
        </View>

        {/* Cultivo */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Tipo de cultivo</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Olivar, Viña, Almendro"
            placeholderTextColor="#9CA3AF"
            value={crop}
            onChangeText={setCrop}
            autoCapitalize="words"
          />
          <Text style={styles.hint}>Opcional: tipo de cultivo principal</Text>
        </View>

        {/* Variedad */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Variedad</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Cencibel, Picual"
            placeholderTextColor="#9CA3AF"
            value={variety}
            onChangeText={setVariety}
          />
          <Text style={styles.hint}>Opcional: variedad específica del cultivo</Text>
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
          <Text style={styles.saveButtonText}>Crear Parcela</Text>
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
