import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { dypai } from "../../lib/dypai";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function TreatmentsTab({ fieldId, isActive }) {
  const [treatments, setTreatments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (fieldId && isActive) {
      loadTreatments();
    }
  }, [fieldId, isActive]);

  const loadTreatments = async () => {
    try {
      setLoading(true);
      const response = await dypai.api.get("obtener_treatments", {
        params: {
          parcel_id: fieldId,
          limit: 100,
          sort_by: "application_date",
          order: "DESC",
        }
      });
      
      let treatmentsData = [];
      if (response?.data && Array.isArray(response.data)) {
        treatmentsData = response.data;
      } else if (Array.isArray(response)) {
        treatmentsData = response;
      }
      
      setTreatments(treatmentsData);
    } catch (error) {
      console.error("Error cargando tratamientos:", error);
      Alert.alert("Error", "No se pudieron cargar los tratamientos");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="small" color="#2e7d32" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Aplicaciones fitosanitarias</Text>

      {treatments.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="flask-outline" size={48} color="#cbd5e1" />
          <Text style={styles.emptyText}>No hay tratamientos</Text>
          <Text style={styles.emptySubtext}>Las aplicaciones aparecerán aquí</Text>
        </View>
      ) : (
        treatments.map((item) => (
          <TouchableOpacity 
            key={item.id} 
            style={styles.card}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <View style={styles.dateBadge}>
                <Text style={styles.dateDay}>{format(new Date(item.application_date), "dd")}</Text>
                <Text style={styles.dateMonth}>{format(new Date(item.application_date), "MMM", { locale: es }).toUpperCase()}</Text>
              </View>
              <View style={styles.infoContainer}>
                <Text style={styles.treatmentName} numberOfLines={1}>{item.name}</Text>
                <Text style={styles.activeIngredient} numberOfLines={1}>
                  {item.active_ingredient || "Sin ingrediente activo"}
                </Text>
                <View style={styles.badgeRow}>
                  <View style={styles.tag}>
                    <Text style={styles.tagText}>{item.category_name || "Tratamiento"}</Text>
                  </View>
                </View>
              </View>
              <View style={styles.doseBox}>
                <Text style={styles.doseValue}>{item.dose || `${item.dose_value} ${item.dose_unit}/Ha`}</Text>
                <Text style={styles.doseLabel}>DOSIS</Text>
              </View>
            </View>
          </TouchableOpacity>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { paddingVertical: 40, alignItems: "center" },
  sectionTitle: { fontSize: 13, fontWeight: "900", color: "#94a3b8", letterSpacing: 1, marginBottom: 16, paddingLeft: 4 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 8,
    elevation: 1,
  },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  dateBadge: {
    width: 48,
    height: 48,
    backgroundColor: "#f0fdfa",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#ccfbf1",
  },
  dateDay: { fontSize: 18, fontWeight: "800", color: "#0d9488" },
  dateMonth: { fontSize: 10, fontWeight: "800", color: "#0d9488" },
  infoContainer: { flex: 1 },
  treatmentName: { fontSize: 15, fontWeight: "700", color: "#1e293b", marginBottom: 2 },
  activeIngredient: { fontSize: 12, color: "#64748b", fontStyle: "italic", marginBottom: 6 },
  badgeRow: { flexDirection: 'row', gap: 6 },
  tag: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  tagText: { fontSize: 9, fontWeight: "800", color: "#64748b" },
  doseBox: { alignItems: "flex-end" },
  doseValue: { fontSize: 14, fontWeight: "800", color: "#1e293b" },
  doseLabel: { fontSize: 9, fontWeight: "900", color: "#94a3b8", marginTop: 2 },
  emptyState: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 40,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  emptyText: { fontSize: 16, fontWeight: "700", color: "#1e293b", marginTop: 16 },
  emptySubtext: { fontSize: 13, color: "#64748b", marginTop: 4, fontWeight: "500" },
});
