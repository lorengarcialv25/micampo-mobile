import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Dimensions, ActivityIndicator, ScrollView, TouchableOpacity } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LineChart, PieChart } from "react-native-chart-kit";
import { formatEuro, formatNumber } from "../../utils/formatters";
import { dypai } from "../../lib/dypai";

const screenWidth = Dimensions.get("window").width;

const chartConfig = {
  backgroundGradientFrom: "#ffffff",
  backgroundGradientTo: "#ffffff",
  color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
  strokeWidth: 2,
  barPercentage: 0.6,
  decimalPlaces: 0,
  propsForDots: {
    r: "4",
    strokeWidth: "2",
    stroke: "#2e7d32",
  },
  propsForLabels: {
    fontSize: 10,
    fontWeight: "700",
    fill: "#94a3b8",
  },
};

// Función para agrupar costos por mes
const groupCostsByMonth = (events) => {
  const monthlyData = {};
  
  events.forEach(event => {
    if (!event.date) return;
    const date = new Date(event.date);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const monthName = date.toLocaleString('es-ES', { month: 'short' });
    
    if (!monthlyData[monthKey]) {
      monthlyData[monthKey] = {
        name: monthName.charAt(0).toUpperCase() + monthName.slice(1),
        total: 0
      };
    }
    
    monthlyData[monthKey].total += parseFloat(event.total_cost) || 0;
  });
  
  const sortedMonths = Object.keys(monthlyData)
    .sort()
    .slice(-6)
    .map(key => monthlyData[key]);
  
  return sortedMonths;
};

// Función para calcular distribución de costos por tipo de tarea
const calculateCostDistribution = (events) => {
  const distribution = {};
  let total = 0;
  
  events.forEach(event => {
    const taskType = event.task_type || "otros";
    const cost = parseFloat(event.total_cost) || 0;
    
    if (!distribution[taskType]) {
      distribution[taskType] = 0;
    }
    
    distribution[taskType] += cost;
    total += cost;
  });
  
  if (total === 0) return [];
  
  const colors = ["#2e7d32", "#16a34a", "#4ade80", "#bbf7d0", "#f0fdf4"];
  const taskTypeLabels = {
    poda: "Poda",
    recoleccion: "Cosecha",
    tratamiento: "Trat.",
    riego: "Riego",
    otros: "Otros",
  };
  
  return Object.keys(distribution)
    .map((key, index) => ({
      name: taskTypeLabels[key] || key.charAt(0).toUpperCase() + key.slice(1),
      population: Math.round(distribution[key]),
      color: colors[index % colors.length],
      legendFontColor: "#64748b",
      legendFontSize: 11,
    }))
    .filter(item => item.population > 0)
    .sort((a, b) => b.population - a.population);
};

export default function AnaliticaTab({ fieldId, isActive }) {
  const [loading, setLoading] = useState(true);
  const [totalCost, setTotalCost] = useState(0);
  const [monthlyCosts, setMonthlyCosts] = useState({
    labels: [],
    datasets: [{ data: [] }],
  });
  const [costDistribution, setCostDistribution] = useState([]);

  useEffect(() => {
    if (fieldId && isActive) {
      loadFinancialData();
    }
  }, [fieldId, isActive]);

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      const response = await dypai.api.get("obtener_work_events_completos", {
        params: {
          parcel_id: fieldId,
          limit: 1000,
          offset: 0
        }
      });
      
      let eventsData = [];
      if (response?.data && Array.isArray(response.data)) {
        eventsData = response.data;
      } else if (Array.isArray(response)) {
        eventsData = response;
      }
      
      const total = eventsData.reduce((sum, event) => sum + (parseFloat(event.total_cost) || 0), 0);
      setTotalCost(total);
      
      const monthly = groupCostsByMonth(eventsData);
      if (monthly.length > 0) {
        setMonthlyCosts({
          labels: monthly.map(m => m.name),
          datasets: [{ data: monthly.map(m => m.total) }],
        });
      } else {
        setMonthlyCosts({
          labels: ["Ene", "Feb", "Mar", "Abr", "May", "Jun"],
          datasets: [{ data: [0, 0, 0, 0, 0, 0] }],
        });
      }
      
      const distribution = calculateCostDistribution(eventsData);
      setCostDistribution(distribution);
    } catch (error) {
      console.error("Error cargando datos financieros:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="small" color="#2e7d32" />
        <Text style={styles.loadingText}>Analizando datos...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Análisis de Costos</Text>

      {/* KPI Cards */}
      <View style={styles.kpiGrid}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>COSTO TOTAL ACUM.</Text>
          <Text style={styles.kpiValue}>{formatEuro(totalCost)}</Text>
        </View>
      </View>

      {/* Monthly Evolution */}
      <View style={styles.chartSection}>
        <Text style={styles.chartTitle}>Evolución Mensual de Gastos</Text>
        <View style={styles.chartWrapper}>
            <LineChart
            data={monthlyCosts}
            width={screenWidth - 40}
            height={200}
            chartConfig={chartConfig}
            bezier
            withDots={true}
            withInnerLines={false}
            withOuterLines={false}
            style={styles.chart}
            />
        </View>
      </View>

      {/* Cost Distribution */}
      <View style={styles.chartSection}>
        <Text style={styles.chartTitle}>Distribución por Tarea</Text>
        <View style={styles.pieWrapper}>
          {costDistribution.length > 0 ? (
            <PieChart
              data={costDistribution}
              width={screenWidth - 40}
              height={180}
              chartConfig={chartConfig}
              accessor={"population"}
              backgroundColor={"transparent"}
              paddingLeft={"0"}
              center={[10, 0]}
              absolute
            />
          ) : (
            <View style={styles.noDataBox}>
              <Ionicons name="pie-chart-outline" size={40} color="#cbd5e1" />
              <Text style={styles.noDataText}>Sin datos suficientes</Text>
            </View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { paddingVertical: 60, alignItems: "center" },
  loadingText: { marginTop: 12, color: "#64748b", fontWeight: "600", fontSize: 13 },
  sectionTitle: { fontSize: 13, fontWeight: "900", color: "#94a3b8", letterSpacing: 1, marginBottom: 16, paddingLeft: 4 },
  kpiGrid: { marginBottom: 24 },
  kpiCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    alignItems: "center",
  },
  kpiLabel: { fontSize: 10, fontWeight: "800", color: "#94a3b8", letterSpacing: 0.5, marginBottom: 4 },
  kpiValue: { fontSize: 24, fontWeight: "800", color: "#1e293b" },
  
  chartSection: { marginBottom: 32 },
  chartTitle: { fontSize: 14, fontWeight: "700", color: "#1e293b", marginBottom: 12, paddingLeft: 4 },
  chartWrapper: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  pieWrapper: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    alignItems: "center",
  },
  noDataBox: { paddingVertical: 40, alignItems: "center", gap: 8 },
  noDataText: { color: "#94a3b8", fontSize: 13, fontWeight: "600" },
});
