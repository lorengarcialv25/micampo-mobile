import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Dimensions, ActivityIndicator, ScrollView, TouchableOpacity } from "react-native";
import { LineChart, BarChart, PieChart } from "react-native-chart-kit";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { dypai } from "../lib/dypai";
import { formatEuro } from "../utils/formatters";
import { useCampaign } from "../context/CampaignContext";

const screenWidth = Dimensions.get("window").width;

export default function AccountAnalysisScreen() {
  const navigation = useNavigation();
  const { currentCampaignId } = useCampaign();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    loadAnalysisData();
  }, [currentCampaignId]);

  const loadAnalysisData = async () => {
    try {
      setLoading(true);
      
      // Simulamos carga de datos analíticos financieros
      // En una versión real, esto vendría de un endpoint de agregación como 'obtener_stats_financieras'
      setTimeout(() => {
        setData({
          expensesByCategory: [
            { name: "Gasóleo", amount: 2500, color: "#2196F3", legendFontColor: "#7F7F7F", legendFontSize: 12 },
            { name: "Reparaciones", amount: 1200, color: "#FF9800", legendFontColor: "#7F7F7F", legendFontSize: 12 },
            { name: "Semillas", amount: 3000, color: "#4CAF50", legendFontColor: "#7F7F7F", legendFontSize: 12 },
            { name: "Fertilizantes", amount: 1800, color: "#9C27B0", legendFontColor: "#7F7F7F", legendFontSize: 12 },
            { name: "Otros", amount: 500, color: "#546e7a", legendFontColor: "#7F7F7F", legendFontSize: 12 },
          ],
          monthlyEvolution: {
            labels: ["Ene", "Feb", "Mar", "Abr", "May", "Jun"],
            datasets: [
              {
                data: [1500, 2200, 1800, 3500, 2800, 4200],
                color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`, // Ingresos
                strokeWidth: 2
              },
              {
                data: [1200, 1500, 2500, 2000, 1500, 3000],
                color: (opacity = 1) => `rgba(198, 40, 40, ${opacity})`, // Gastos
                strokeWidth: 2
              }
            ],
            legend: ["Ingresos", "Gastos"]
          }
        });
        setLoading(false);
      }, 1000);
      
    } catch (error) {
      console.error("Error cargando análisis financiero:", error);
      setLoading(false);
    }
  };

  const chartConfig = {
    backgroundGradientFrom: "#ffffff",
    backgroundGradientTo: "#ffffff",
    color: (opacity = 1) => `rgba(46, 125, 50, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
    labelColor: (opacity = 1) => `rgba(96, 116, 99, ${opacity})`,
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>Calculando balances...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1b1f23" />
        </TouchableOpacity>
        <Text style={styles.title}>Análisis Financiero</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Distribución de Gastos</Text>
        <View style={styles.chartCard}>
          <PieChart
            data={data.expensesByCategory}
            width={screenWidth - 40}
            height={200}
            chartConfig={chartConfig}
            accessor={"amount"}
            backgroundColor={"transparent"}
            paddingLeft={"15"}
            center={[10, 0]}
            absolute
          />
        </View>

        <Text style={styles.sectionTitle}>Evolución Mensual</Text>
        <View style={styles.chartCard}>
          <LineChart
            data={data.monthlyEvolution}
            width={screenWidth - 60}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>

        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Margen Bruto</Text>
            <Text style={[styles.statValue, { color: "#2e7d32" }]}>24.5%</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>ROI Campaña</Text>
            <Text style={[styles.statValue, { color: "#1976d2" }]}>1.8x</Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f9f5" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: "#ffffff",
  },
  title: { fontSize: 20, fontWeight: "700", color: "#1b1f23" },
  backButton: { padding: 5 },
  content: { flex: 1, padding: 20 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { marginTop: 15, color: "#607463", fontWeight: "600" },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#1b1f23", marginBottom: 15, marginTop: 10 },
  chartCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 15,
    marginBottom: 25,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#eef2ee",
    alignItems: "center",
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 15,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#eef2ee",
    alignItems: "center",
  },
  statLabel: { fontSize: 13, color: "#607463", fontWeight: "600", marginBottom: 6 },
  statValue: { fontSize: 22, fontWeight: "900" },
});

