import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { dypai } from "../lib/dypai";
import { formatDateFull } from "../utils/formatters";

export default function WorkerDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { workerId, workerName } = route.params || {};
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [jornales, setJornales] = useState([]);
  const [worker, setWorker] = useState(null);
  const [stats, setStats] = useState({
    totalDays: 0,
    totalEarned: 0,
    pendingPayment: 0,
  });

  const loadWorkerData = async () => {
    try {
      setLoading(true);
      const [detailsRes, workerRes] = await Promise.all([
        dypai.api.get("obtener_work_event_details", {
          params: {
            worker_id: workerId,
            sort_by: "created_at",
            order: "DESC",
            limit: 1000,
          },
        }),
        dypai.api.get("obtener_workers", {
          params: { id: workerId }
        })
      ]);

      // Check for errors
      if (detailsRes.error) throw detailsRes.error;
      if (workerRes.error) throw workerRes.error;

      // Procesar datos del trabajador
      const workerData = Array.isArray(workerRes.data)
        ? workerRes.data.find(w => w.id === workerId)
        : workerRes.data || null;
      setWorker(workerData);

      const detailsData = Array.isArray(detailsRes.data) ? detailsRes.data : [];

      // Normalizar is_paid
      const normalizedDetails = detailsData.map(item => ({
        ...item,
        is_paid: item.is_paid === true || item.is_paid === 'true'
      }));

      setJornales(normalizedDetails);

      // Calcular estadísticas
      const totalEarned = normalizedDetails.reduce((sum, item) => sum + (parseFloat(item.total_cost) || 0), 0);
      const pendingPayment = normalizedDetails
        .filter(item => !item.is_paid)
        .reduce((sum, item) => sum + (parseFloat(item.total_cost) || 0), 0);
      
      setStats({
        totalDays: detailsData.length,
        totalEarned,
        pendingPayment,
      });
    } catch (error) {
      console.error("Error cargando datos del trabajador:", error);
      Alert.alert("Error", "No se pudieron cargar los datos del trabajador.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (workerId) {
      loadWorkerData();
    }
  }, [workerId]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadWorkerData();
  };

  const handleMarkAsPaid = async (jornalId) => {
    try {
      const { error } = await dypai.api.put("actualizar_work_event_detail", {
        id: jornalId,
        is_paid: true,
      });
      if (error) throw error;

      loadWorkerData(); // Recargar datos
    } catch (error) {
      console.error("Error marcando como pagado:", error);
      Alert.alert("Error", "No se pudo actualizar el estado de pago.");
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.dateContainer}>
          <Text style={styles.dateText}>{formatDateFull(new Date(item.created_at))}</Text>
          <Text style={styles.parcelText}>{item.parcel_name || "Parcela desconocida"}</Text>
        </View>
        <View style={styles.amountContainer}>
          <Text style={styles.amountText}>{parseFloat(item.total_cost).toFixed(2)} €</Text>
          <View style={[styles.statusBadge, { backgroundColor: item.is_paid ? "#e8f5e9" : "#fff3e0" }]}>
            <Text style={[styles.statusText, { color: item.is_paid ? "#2e7d32" : "#ef6c00" }]}>
              {item.is_paid ? "Pagado" : "Pendiente"}
            </Text>
          </View>
        </View>
      </View>
      {!item.is_paid && (
        <TouchableOpacity 
          style={styles.payButton} 
          onPress={() => handleMarkAsPaid(item.id)}
        >
          <Ionicons name="cash-outline" size={16} color="#2e7d32" />
          <Text style={styles.payButtonText}>Marcar como pagado</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1b1f23" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>{worker?.name || workerName || "Detalle Trabajador"}</Text>
          <Text style={styles.subtitle}>{worker?.specialty || "Trabajador"}</Text>
        </View>
      </View>

      {worker && (
        <View style={styles.contactInfoRow}>
          {worker.phone && (
            <View style={styles.contactInfoItem}>
              <Ionicons name="call" size={14} color="#2e7d32" />
              <Text style={styles.contactInfoText}>{worker.phone}</Text>
            </View>
          )}
          {worker.email && (
            <View style={styles.contactInfoItem}>
              <Ionicons name="mail" size={14} color="#2e7d32" />
              <Text style={styles.contactInfoText} numberOfLines={1}>{worker.email}</Text>
            </View>
          )}
        </View>
      )}

      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.totalDays}</Text>
          <Text style={styles.statLabel}>Días</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.totalEarned.toFixed(0)} €</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
        <View style={[styles.statItem, styles.pendingStat]}>
          <Text style={[styles.statValue, { color: "#c62828" }]}>{stats.pendingPayment.toFixed(0)} €</Text>
          <Text style={styles.statLabel}>Pendiente</Text>
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#2e7d32" />
        </View>
      ) : (
        <FlatList
          data={jornales}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="account-clock-outline" size={64} color="#9ba9a0" />
              <Text style={styles.emptyStateText}>No hay historial para este trabajador</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f9f5" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: "#ffffff",
  },
  backButton: { marginRight: 15 },
  headerTextContainer: { flex: 1 },
  title: { fontSize: 20, fontWeight: "700", color: "#1b1f23" },
  subtitle: { fontSize: 12, color: "#8898aa", textTransform: "uppercase", fontWeight: "600" },
  contactInfoRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingBottom: 15,
    gap: 15,
  },
  contactInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#f1f8e9",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  contactInfoText: {
    fontSize: 12,
    color: "#2e7d32",
    fontWeight: "700",
  },
  statsRow: {
    flexDirection: "row",
    padding: 20,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  statItem: { flex: 1, alignItems: "center" },
  pendingStat: { borderLeftWidth: 1, borderLeftColor: "#f0f0f0" },
  statValue: { fontSize: 20, fontWeight: "800", color: "#1b1f23" },
  statLabel: { fontSize: 12, color: "#607463", marginTop: 2, fontWeight: "600" },
  listContent: { padding: 20, paddingBottom: 120 },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#eef1ee",
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  dateContainer: { flex: 1 },
  dateText: { fontSize: 15, fontWeight: "700", color: "#1b1f23" },
  parcelText: { fontSize: 13, color: "#607463", marginTop: 2 },
  amountContainer: { alignItems: "flex-end" },
  amountText: { fontSize: 16, fontWeight: "800", color: "#1b1f23" },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 6,
  },
  statusText: { fontSize: 10, fontWeight: "700" },
  payButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#2e7d32",
    backgroundColor: "#f1f8e9",
  },
  payButtonText: { color: "#2e7d32", fontWeight: "700", marginLeft: 8, fontSize: 13 },
  centerContent: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyState: { alignItems: "center", marginTop: 80 },
  emptyStateText: { marginTop: 15, fontSize: 16, color: "#607463", fontWeight: "600", textAlign: "center" },
});


