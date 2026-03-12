import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRoute, useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { dypai } from "../lib/dypai";
import { formatDateFull, formatEuro } from "../utils/formatters";

const TASK_TYPES = [
  { value: "poda", label: "Poda", icon: "tree-outline" },
  { value: "recoleccion", label: "Recolección", icon: "basket-outline" },
  { value: "tratamiento", label: "Tratamiento", icon: "spray" },
  { value: "riego", label: "Riego", icon: "water-outline" },
  { value: "otros", label: "Otros", icon: "tools" },
];

const TASK_ICONS = {
  poda: { icon: "tree", color: "#2e7d32", bg: "#e8f5e9" },
  recoleccion: { icon: "basket", color: "#e67e22", bg: "#fef5e7" },
  tratamiento: { icon: "spray", color: "#3498db", bg: "#ebf5fb" },
  riego: { icon: "water", color: "#2980b9", bg: "#eaf2f8" },
  otros: { icon: "tools", color: "#64748b", bg: "#f1f5f9" },
};

export default function TaskDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { taskId } = route.params || {};
  const [loading, setLoading] = useState(true);
  const [task, setTask] = useState(null);
  const [workers, setWorkers] = useState([]);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (taskId) {
      loadTaskDetails();
    }
  }, [taskId]);

  // Refrescar cuando la pantalla vuelve a estar enfocada (por si se vuelve de editar)
  useFocusEffect(
    useCallback(() => {
      if (taskId) {
        loadTaskDetails();
      }
    }, [taskId])
  );

  const handleDelete = () => {
    Alert.alert(
      "Eliminar Tarea",
      "¿Estás seguro de que quieres eliminar esta tarea? Esta acción eliminará también todos los jornales asociados y no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive", 
          onPress: confirmDelete 
        }
      ]
    );
  };

  const confirmDelete = async () => {
    try {
      setDeleting(true);
      const { error } = await dypai.api.delete('eliminar_work_event', { params: { id: taskId } });
      if (error) throw error;
      Alert.alert("Éxito", "Tarea eliminada correctamente");
      navigation.goBack();
    } catch (error) {
      console.error("Error eliminando tarea:", error);
      Alert.alert("Error", "No se pudo eliminar la tarea");
    } finally {
      setDeleting(false);
    }
  };

  const loadTaskDetails = async () => {
    try {
      setLoading(true);
      
      const [eventRes, detailsRes] = await Promise.all([
        dypai.api.get("obtener_work_events_completos", {
          params: { limit: 1000, offset: 0 },
        }),
        dypai.api.get("obtener_work_event_details", {
          params: { work_event_id: taskId, limit: 1000, offset: 0 },
        }),
      ]);

      if (eventRes.error) throw eventRes.error;
      if (detailsRes.error) throw detailsRes.error;

      const eventsData = Array.isArray(eventRes.data) ? eventRes.data : [];

      const eventData = eventsData.find((e) => e.id === taskId || e.id?.toString() === taskId?.toString());

      const detailsData = Array.isArray(detailsRes.data) ? detailsRes.data : [];

      if (!eventData) {
        Alert.alert("Error", "No se encontró la tarea");
        navigation.goBack();
        return;
      }

      const parcelName = detailsData.length > 0 
        ? (detailsData[0].parcel_name || "Parcela desconocida")
        : "Parcela desconocida";

      const transformedWorkers = detailsData.map((detail) => {
        return {
          id: detail.id,
          worker_id: detail.worker_id,
          worker_name: detail.worker_name || "Trabajador desconocido",
          work_days: detail.work_days || 0,
          work_days_price: detail.work_days_price || 0,
          work_hours: detail.work_hours || 0,
          work_hours_price: detail.work_hours_price || 0,
          area_qty: detail.area_qty || 0,
          area_price: detail.area_price || 0,
          area_unit: detail.area_unit || 'fanegas',
          total_cost: parseFloat(detail.total_cost) || 0,
          is_paid: detail.is_paid === true || detail.is_paid === 'true',
        };
      });

      const totalCost = transformedWorkers.reduce((sum, w) => sum + w.total_cost, 0);

      setTask({
        ...eventData,
        parcel_name: parcelName || eventData.parcel_id,
        total_cost: totalCost,
      });
      setWorkers(transformedWorkers);
    } catch (error) {
      console.error("Error cargando detalles de tarea:", error);
      Alert.alert("Error", "No se pudieron cargar los detalles de la tarea");
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>Cargando detalles...</Text>
      </View>
    );
  }

  if (!task) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>No se encontró la tarea</Text>
        <TouchableOpacity style={styles.backAction} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#2e7d32" />
          <Text style={{ marginLeft: 8, color: "#2e7d32", fontWeight: "700" }}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const taskType = TASK_TYPES.find((t) => t.value === task.task_type);
  const dateObj = task.date ? new Date(task.date) : new Date(task.created_at);
  const taskTypeIcon = taskType?.icon || "tools";
  const taskStyle = TASK_ICONS[task.task_type] || TASK_ICONS.otros;

  return (
    <View style={styles.container}>
      {/* Header Minimalista */}
      <View style={[styles.headerContainer, { paddingTop: insets.top + 8 }]}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.navButton}>
            <Ionicons name="arrow-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Actividad</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
          <TouchableOpacity
            onPress={handleDelete}
              style={styles.navButton}
            >
              <Ionicons name="trash-outline" size={22} color="#ef4444" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('ActionsStack', { screen: 'AddWork', params: { editId: taskId } })}
              style={styles.navButton}
            >
              <Ionicons name="create-outline" size={22} color="#2e7d32" />
            </TouchableOpacity>
            </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Sección Hero: Concepto y Total */}
        <View style={styles.heroSection}>
          <View style={styles.rowBetween}>
            <View style={[styles.typeBadge, { backgroundColor: taskStyle.bg }]}>
              <MaterialCommunityIcons name={taskStyle.icon} size={14} color={taskStyle.color} />
              <Text style={[styles.typeBadgeText, { color: taskStyle.color }]}>
                {taskType?.label || task.task_type || "OTRO"}
              </Text>
            </View>
            <Text style={styles.dateText}>{formatDateFull(dateObj)}</Text>
          </View>
          
          <Text style={styles.mainTitle}>{task.concept || "Jornada de Trabajo"}</Text>

          <View style={styles.totalContainer}>
            <View>
              <Text style={styles.totalLabel}>Inversión Total</Text>
              <View style={styles.amountRow}>
                <Text style={styles.totalAmount}>
                  {task.total_cost?.toLocaleString('es-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Text>
                <Text style={styles.currencySymbol}>€</Text>
              </View>
            </View>
            <View style={styles.totalIconContainer}>
              <MaterialCommunityIcons name="cash-multiple" size={28} color="#2e7d32" />
            </View>
          </View>
        </View>

        {/* Detalles de la ubicación */}
        <View style={styles.section}>
          <View style={styles.infoRow}>
            <View style={styles.infoIconBox}>
              <MaterialCommunityIcons name="map-marker-radius" size={20} color="#2e7d32" />
              </View>
              <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Ubicación / Finca</Text>
              <Text style={styles.infoValue}>{task.parcel_name}</Text>
              </View>
            </View>

          {task.description && (
            <View style={[styles.infoRow, { marginTop: 24, alignItems: 'flex-start' }]}>
              <View style={styles.infoIconBox}>
                <MaterialCommunityIcons name="text-subject" size={20} color="#2e7d32" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Observaciones</Text>
                <Text style={styles.descriptionText}>{task.description}</Text>
                </View>
              </View>
            )}
        </View>

        {/* Trabajadores */}
        <View style={styles.section}>
          <View style={[styles.rowBetween, { marginBottom: 20 }]}>
            <Text style={styles.sectionTitle}>Equipo de Trabajo</Text>
            <View style={styles.countChip}>
              <Text style={styles.countChipText}>{workers.length} pers.</Text>
            </View>
          </View>

          {workers.map((worker, index) => (
            <View key={worker.id} style={[styles.workerItem, index === workers.length - 1 && { borderBottomWidth: 0 }]}>
              <View style={styles.workerAvatar}>
                <Text style={styles.avatarLetter}>{worker.worker_name?.charAt(0).toUpperCase()}</Text>
              </View>
              
              <View style={styles.workerBody}>
                <View style={styles.workerHeaderRow}>
                      <Text style={styles.workerName}>{worker.worker_name}</Text>
                      {worker.is_paid && (
                    <View style={styles.paidBadge}>
                      <Ionicons name="checkmark-done" size={12} color="#fff" />
                      <Text style={styles.paidBadgeText}>PAGADO</Text>
                        </View>
                      )}
                    </View>

                <View style={styles.computationRow}>
                  {worker.work_days > 0 && (
                    <Text style={styles.compText}>
                      {worker.work_days === 1 ? "1 jornal" : `${worker.work_days} jornales`} <Text style={styles.compOp}>×</Text> {worker.work_days_price}€
                        </Text>
                  )}
                  {worker.work_hours > 0 && (
                    <Text style={[styles.compText, { color: '#2563eb' }]}>
                      {worker.work_hours === 1 ? "1 hora" : `${worker.work_hours} horas`} <Text style={styles.compOp}>×</Text> {worker.work_hours_price}€
                        </Text>
                  )}
                  {worker.area_qty > 0 && (
                    <Text style={[styles.compText, { color: '#ea580c' }]}>
                      {worker.area_qty}{worker.area_unit === 'fanegas' ? 'f' : 'h'} <Text style={styles.compOp}>×</Text> {worker.area_price}€
                    </Text>
                  )}
                </View>
              </View>

              <Text style={styles.workerTotal}>{formatEuro(worker.total_cost)}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  center: {
    justifyContent: "center",
    alignItems: "center",
  },
  headerContainer: {
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 56,
  },
  navButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  scrollContent: {
    paddingBottom: 60,
  },
  heroSection: {
    padding: 24,
    backgroundColor: "#ffffff",
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  typeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  dateText: {
    fontSize: 13,
    color: "#94a3b8",
    fontWeight: "600",
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: "900",
    color: "#1e293b",
    marginTop: 16,
    marginBottom: 24,
    lineHeight: 34,
  },
  totalContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f8fafc",
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 4,
  },
  amountRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
  totalAmount: {
    fontSize: 36,
    fontWeight: "300",
    color: "#1e293b",
    letterSpacing: -1,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: "800",
    color: "#2e7d32",
  },
  totalIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  section: {
    paddingHorizontal: 24,
    paddingVertical: 32,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  infoIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#f0fdf4",
    justifyContent: "center",
    alignItems: "center",
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
  },
  descriptionText: {
    fontSize: 15,
    color: "#475569",
    lineHeight: 22,
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#1e293b",
  },
  countChip: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  countChipText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#64748b",
  },
  workerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  workerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarLetter: {
    fontSize: 16,
    fontWeight: "800",
    color: "#64748b",
  },
  workerBody: {
    flex: 1,
  },
  workerHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  workerName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1e293b",
  },
  paidBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#2e7d32",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  paidBadgeText: {
    fontSize: 8,
    fontWeight: "900",
    color: "#ffffff",
  },
  computationRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  compText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#059669",
  },
  compOp: {
    color: "#cbd5e1",
    fontWeight: "400",
  },
  workerTotal: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1e293b",
    marginLeft: 8,
  },
  loadingText: {
    marginTop: 16,
    color: "#64748b",
    fontWeight: "600",
  },
  errorText: {
    fontSize: 16,
    color: "#ef4444",
    fontWeight: "700",
  },
});
