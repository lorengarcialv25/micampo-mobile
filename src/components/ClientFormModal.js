import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import BottomSheet from "./BottomSheet";
import { dypai } from "../lib/dypai";

export default function ClientFormModal({ visible, onClose, onSuccess, initialData }) {
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [isCooperative, setIsCooperative] = useState(true);

  useEffect(() => {
    if (visible) {
      if (initialData) {
        setName(initialData.name || "");
        setIsCooperative(initialData.is_cooperative ?? true);
      } else {
        setName("");
        setIsCooperative(true);
      }
    }
  }, [visible, initialData]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Por favor introduce el nombre del cliente");
      return;
    }

    setLoading(true);
    try {
      if (initialData?.id) {
        const { error } = await dypai.api.put("actualizar_cliente", {
          id: initialData.id,
          name: name.trim(),
          is_cooperative: isCooperative
        });
        if (error) throw error;
        Alert.alert("Éxito", "Cliente actualizado correctamente");
      } else {
        const { data, error } = await dypai.api.post("crear_cliente", {
          name: name.trim(),
          is_cooperative: isCooperative
        });
        if (error) throw error;
        Alert.alert("Éxito", "Cliente creado correctamente");
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error("Error gestionando cliente:", err);
      Alert.alert("Error", "Ocurrió un error al guardar el cliente");
    } finally {
      setLoading(false);
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={initialData ? "Editar Cliente" : "Nuevo Cliente"}
      snapPoints={["50%"]}
    >
      <View style={styles.form}>
        <Text style={styles.label}>Nombre Comercial *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Ej: Almazara San Isidro"
          placeholderTextColor="#9CA3AF"
        />

        <Text style={styles.label}>Tipo de Cliente</Text>
        <View style={styles.typeContainer}>
          <TouchableOpacity 
            style={[styles.typeBtn, isCooperative && styles.typeBtnActive]}
            onPress={() => setIsCooperative(true)}
          >
            <MaterialCommunityIcons 
              name="office-building" 
              size={20} 
              color={isCooperative ? "#2e7d32" : "#607463"} 
            />
            <Text style={[styles.typeBtnText, isCooperative && styles.typeBtnTextActive]}>
              Cooperativa
            </Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.typeBtn, !isCooperative && styles.typeBtnActive]}
            onPress={() => setIsCooperative(false)}
          >
            <MaterialCommunityIcons 
              name="account" 
              size={20} 
              color={!isCooperative ? "#2e7d32" : "#607463"} 
            />
            <Text style={[styles.typeBtnText, !isCooperative && styles.typeBtnTextActive]}>
              Privado / Otro
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={onClose}
            disabled={loading}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.button, styles.saveButton]}
            onPress={handleSubmit}
            disabled={loading || !name.trim()}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.saveButtonText}>
                {initialData ? 'Guardar Cambios' : 'Crear Cliente'}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  form: {
    padding: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    marginTop: 12,
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
  typeContainer: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    padding: 4,
    borderRadius: 14,
    marginTop: 8,
  },
  typeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
  },
  typeBtnActive: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  typeBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#607463",
  },
  typeBtnTextActive: {
    color: "#2e7d32",
  },
  actions: {
    flexDirection: "row",
    marginTop: 30,
    gap: 12,
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

