import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  ScrollView,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { dypai } from "../lib/dypai";
import { useCampaign } from "../context/CampaignContext";
import { formatEuro } from "../utils/formatters";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getReducedSafeAreaTop } from "../utils/layout";

export default function PendingPaymentsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { currentCampaignId } = useCampaign();
  
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [workers, setWorkers] = useState([]);
  const [jornales, setJornales] = useState([]);

  const loadData = async () => {
    try {
      if (!refreshing) setLoading(true);
      const [workersRes, jornalesRes] = await Promise.all([
        dypai.api.get("obtener_workers"),
        dypai.api.get("obtener_work_event_details", {
          params: {
            campaign_id: currentCampaignId,
            limit: 5000,
          },
        }),
      ]);

      setWorkers(Array.isArray(workersRes) ? workersRes : workersRes?.data || []);
      
      let detailsData = [];
      if (jornalesRes?.data && Array.isArray(jornalesRes.data)) detailsData = jornalesRes.data;
      else if (Array.isArray(jornalesRes)) detailsData = jornalesRes;
      else if (jornalesRes?.result && Array.isArray(jornalesRes.result)) detailsData = jornalesRes.result;
      
      // Normalizar is_paid para evitar problemas con strings 'true'/'false'
      const normalizedDetails = detailsData.map(j => ({
        ...j,
        is_paid: j.is_paid === true || j.is_paid === 'true'
      }));
      
      setJornales(normalizedDetails);
    } catch (error) {
      console.error("Error cargando pagos pendientes:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (currentCampaignId) {
      loadData();
    }
  }, [currentCampaignId]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const workerStats = useMemo(() => {
    if (!workers.length) return [];

    return workers.map(worker => {
      const jornalesWorker = jornales.filter(j => j.worker_id === worker.id);
      
      const totalEarned = jornalesWorker
        .reduce((acc, curr) => acc + (parseFloat(curr.total_cost) || 0), 0);

      const totalPaid = jornalesWorker
        .filter(j => j.is_paid)
        .reduce((acc, curr) => acc + (parseFloat(curr.total_cost) || 0), 0);

      const pending = jornalesWorker
        .filter(j => !j.is_paid)
        .reduce((acc, curr) => acc + (parseFloat(curr.total_cost) || 0), 0);

      return {
        ...worker,
        totalEarned,
        totalPaid,
        pending,
        jornalesCount: jornalesWorker.length
      };
    })
    .filter(ws => ws.pending > 0.01)
    .sort((a, b) => b.pending - a.pending);
  }, [workers, jornales]);

  const totalPending = useMemo(() => {
    return workerStats.reduce((acc, curr) => acc + curr.pending, 0);
  }, [workerStats]);

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9"
      }}
      onPress={() => navigation.navigate("WorkerDetail", { workerId: item.id, workerName: item.name })}
      activeOpacity={0.6}
    >
      <View style={{
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: "#fff3e0",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 16
      }}>
        <MaterialCommunityIcons name="wallet-outline" size={24} color="#e67e22" />
      </View>
      
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: "700", color: "#1e293b", marginBottom: 2 }}>
          {item.name}
        </Text>
        <Text style={{ fontSize: 13, color: "#94a3b8", fontWeight: "500" }}>
          {item.jornalesCount} jornales pendientes
        </Text>
      </View>
      
      <View style={{ alignItems: "flex-end" }}>
        <Text style={{ fontSize: 16, fontWeight: "800", color: "#e67e22" }}>
          {formatEuro(item.pending)}
        </Text>
        <Ionicons name="chevron-forward" size={16} color="#cbd5e1" style={{ marginTop: 4 }} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: getReducedSafeAreaTop(insets.top) }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#1b1f23" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Pagos Pendientes</Text>
            <Text style={styles.subtitle}>Resumen de deuda</Text>
          </View>
        </View>
      </View>

      <ScrollView 
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#2e7d32" />}
      >
        <View style={{ paddingVertical: 20, paddingHorizontal: 20, alignItems: "center" }}>
          <Text style={{ fontSize: 14, fontWeight: "600", color: "#64748b", marginBottom: 8 }}>Total Pendiente</Text>
          <Text style={{ fontSize: 42, fontWeight: "300", letterSpacing: -1, color: "#1b1f23" }}>
            {formatEuro(totalPending)}
          </Text>
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          <Text style={{ fontSize: 13, fontWeight: "900", color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>
            Desglose por Trabajador
          </Text>
          
          {loading && !refreshing ? (
            <ActivityIndicator color="#2e7d32" style={{ marginTop: 40 }} />
          ) : workerStats.length > 0 ? (
            workerStats.map(item => (
              <View key={item.id}>
                {renderItem({ item })}
              </View>
            ))
          ) : (
            <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 60 }}>
              <MaterialCommunityIcons name="check-circle-outline" size={64} color="#cbd5e1" />
              <Text style={{ fontSize: 18, fontWeight: '800', color: "#1b1f23", marginTop: 15 }}>¡Todo al día!</Text>
              <Text style={{ fontSize: 13, color: "#94a3b8", marginTop: 6, textAlign: 'center' }}>No hay pagos pendientes en esta campaña.</Text>
            </View>
          )}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 60,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1b1f23",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 12,
    color: "#8898aa",
    textTransform: "uppercase",
    fontWeight: "600",
    marginTop: 2,
    letterSpacing: 0.5,
  },
});

