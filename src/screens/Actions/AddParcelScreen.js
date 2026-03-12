import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { dypai } from "../../lib/dypai";

export default function AddParcelScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  
  // Form states
  const [name, setName] = useState("");
  const [area, setArea] = useState("");
  const [crop, setCrop] = useState("");
  const [variety, setVariety] = useState("");

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Campo requerido", "Por favor, introduce el nombre de la parcela");
      return;
    }

    setLoading(true);
    try {
      const parcelaData = {
        name: name.trim(),
        ...(area && { 
          area_ha: parseFloat(area.replace(/[^\d.,]/g, '').replace(',', '.')) || null 
        }),
        ...(crop && crop.trim() && { crop_type: crop.trim() }),
        ...(variety && variety.trim() && { variety: variety.trim() }),
      };

      const response = await dypai.api.post("crear_parcela", parcelaData);
      
      if (response && (response.success || response.id)) {
        Alert.alert("Éxito", "Parcela creada correctamente", [
          { text: "OK", onPress: () => navigation.goBack() }
        ]);
      } else {
        throw new Error("No se pudo crear la parcela");
      }
    } catch (error) {
      console.error("Error creando parcela:", error);
      Alert.alert("Error", error.message || "No se pudo crear la parcela. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="close" size={24} color="#1b1f23" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nueva Parcela</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.formSection}>
          <Text style={styles.sectionLabel}>DATOS BÁSICOS</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Nombre de la parcela *</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Finca El Olivo"
              placeholderTextColor="#94a3b8"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Superficie (Hectáreas)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              placeholderTextColor="#94a3b8"
              value={area}
              onChangeText={setArea}
              keyboardType="decimal-pad"
            />
            <Text style={styles.hint}>Superficie total aproximada en Ha.</Text>
          </View>
        </View>

        <View style={styles.formSection}>
          <Text style={styles.sectionLabel}>CULTIVO</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tipo de cultivo</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Viña, Olivar, Almendro"
              placeholderTextColor="#94a3b8"
              value={crop}
              onChangeText={setCrop}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Variedad</Text>
            <TextInput
              style={styles.input}
              placeholder="Ej: Cencibel, Picual"
              placeholderTextColor="#94a3b8"
              value={variety}
              onChangeText={setVariety}
              autoCapitalize="words"
            />
          </View>
        </View>
      </ScrollView>

      {/* Footer Actions */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.cancelButton} 
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancelar</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.saveButton, loading && styles.disabledButton]} 
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveButtonText}>Crear Parcela</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 22,
    backgroundColor: "#f8fafc",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1e293b",
    letterSpacing: -0.5,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  formSection: {
    marginBottom: 32,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "900",
    color: "#94a3b8",
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#475569",
    marginBottom: 8,
  },
  input: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    fontSize: 16,
    color: "#1e293b",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    fontWeight: "600",
  },
  hint: {
    fontSize: 12,
    color: "#94a3b8",
    marginTop: 6,
    fontWeight: "500",
  },
  footer: {
    padding: 20,
    flexDirection: "row",
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    backgroundColor: "#fff",
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#64748b",
  },
  saveButton: {
    flex: 2,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: "#2e7d32",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#2e7d32",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#fff",
  },
  disabledButton: {
    opacity: 0.7,
  },
});

