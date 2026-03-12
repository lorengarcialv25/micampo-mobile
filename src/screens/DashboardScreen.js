import React from "react";
import { ScrollView, View, StyleSheet, Text } from "react-native";
import TopBar from "../components/TopBar";
import SectionCard from "../components/SectionCard";
import { useNavigation } from "@react-navigation/native";

export default function DashboardScreen() {
  const navigation = useNavigation();

  return (
    <View style={styles.container}>
      <TopBar 
        title="Campaña 24-25" 
        subtitle="VISTA GENERAL"
        onSettingsPress={() => navigation.navigate('Ajustes')}
      />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Aquí podríamos poner un resumen rápido de KPIs */}
        <View style={styles.kpiContainer}>
          <View style={styles.kpiCard}>
             <Text style={styles.kpiLabel}>Recogido</Text>
             <Text style={styles.kpiValue}>12.500 kg</Text>
          </View>
          <View style={styles.kpiCard}>
             <Text style={styles.kpiLabel}>Gastos Mes</Text>
             <Text style={[styles.kpiValue, {color: '#d32f2f'}]}>1.200 €</Text>
          </View>
        </View>

        <SectionCard label="Próxima tarea" value="Riego Lote Norte - 08:00" />
        <SectionCard label="Clima" value="24°C | Parcialmente nublado" note="Humedad 65%, viento 10 km/h" />
        <SectionCard label="Producción estimada" value="12.4 t" note="Semana 35" />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f9f5" },
  content: { padding: 20, paddingBottom: 100 }, // Padding extra para el bottom bar
  kpiContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  kpiCard: {
    backgroundColor: '#fff',
    width: '48%',
    padding: 15,
    borderRadius: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  kpiLabel: {
    fontSize: 12,
    color: '#666',
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 5,
  },
  kpiValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1b1f23',
  }
});
