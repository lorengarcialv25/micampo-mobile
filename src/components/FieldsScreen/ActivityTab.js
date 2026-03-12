import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { formatEuro } from "../../utils/formatters";
import { dypai } from "../../lib/dypai";
import { useNavigation } from "@react-navigation/native";

const formatDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
};

export default function ActivityTab({ fieldId, isActive }) {
  const navigation = useNavigation();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (fieldId && isActive) {
      loadWorkEvents();
    }
  }, [fieldId, isActive]);

  const loadWorkEvents = async () => {
    try {
      setLoading(true);
      const eventsResponse = await dypai.api.get("obtener_work_events_completos", {
        params: {
          parcel_id: fieldId,
          limit: 100,
          offset: 0
        }
      });
      
      let eventsData = [];
      if (eventsResponse?.data && Array.isArray(eventsResponse.data)) {
        eventsData = eventsResponse.data;
      } else if (Array.isArray(eventsResponse)) {
        eventsData = eventsResponse;
      }
      
      setTasks(eventsData);
    } catch (error) {
      console.error("Error cargando work events:", error);
      Alert.alert("Error", "No se pudieron cargar las actividades");
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
      <Text style={styles.sectionTitle}>Registro de trabajos</Text>

      {tasks.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="clipboard-outline" size={48} color="#cbd5e1" />
          <Text style={styles.emptyText}>No hay trabajos registrados</Text>
          <Text style={styles.emptySubtext}>Los trabajos aparecerán aquí</Text>
        </View>
      ) : (
        tasks.map((task) => (
          <TouchableOpacity 
            key={task.id} 
            style={styles.taskCard}
            onPress={() => navigation.navigate("TaskDetail", { taskId: task.id })}
            activeOpacity={0.7}
          >
            <View style={styles.cardHeader}>
              <View style={styles.dateBadge}>
                <Text style={styles.dateDay}>{new Date(task.date).getDate()}</Text>
                <Text style={styles.dateMonth}>
                  {new Date(task.date).toLocaleString('es-ES', { month: 'short' }).toUpperCase()}
                </Text>
              </View>
              <View style={styles.taskInfo}>
                <Text style={styles.taskTitle}>{task.concept || task.task_type || "Trabajo agrícola"}</Text>
                <View style={styles.metaRow}>
                  <Ionicons name="people-outline" size={14} color="#64748b" />
                  <Text style={styles.metaText}>{task.workers_count || 0} operarios</Text>
                  <View style={styles.dot} />
                  <Text style={styles.metaText}>{task.total_hours || 0}h totales</Text>
                </View>
              </View>
              <View style={styles.costContainer}>
                <Text style={styles.costValue}>{formatEuro(task.total_cost || 0)}</Text>
                <Ionicons name="chevron-forward" size={16} color="#cbd5e1" />
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
  taskCard: {
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
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  dateDay: { fontSize: 18, fontWeight: "800", color: "#1e293b" },
  dateMonth: { fontSize: 10, fontWeight: "800", color: "#64748b" },
  taskInfo: { flex: 1 },
  taskTitle: { fontSize: 15, fontWeight: "700", color: "#1e293b", marginBottom: 4 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12, color: "#64748b", fontWeight: "500" },
  dot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: "#cbd5e1", marginHorizontal: 2 },
  costContainer: { flexDirection: "row", alignItems: "center", gap: 8 },
  costValue: { fontSize: 15, fontWeight: "800", color: "#1e293b" },
});
