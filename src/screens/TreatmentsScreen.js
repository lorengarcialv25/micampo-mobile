import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { dypai } from "../lib/dypai";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export default function TreatmentsScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { parcelId, parcelName } = route.params || {};
  
  const [treatments, setTreatments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const loadTreatments = async () => {
    try {
      setLoading(true);
      const params = {
        limit: 100,
        search: searchQuery
      };
      
      if (parcelId) {
        params.parcel_id = parcelId;
      }

      const response = await dypai.api.get("obtener_treatments", { params });
      
      let treatmentsData = [];
      if (response?.data && Array.isArray(response.data)) {
        treatmentsData = response.data;
      } else if (Array.isArray(response)) {
        treatmentsData = response;
      } else if (response?.result?.data) {
        treatmentsData = response.result.data;
      }
      
      setTreatments(treatmentsData);
    } catch (error) {
      console.error("Error cargando tratamientos:", error);
      Alert.alert("Error", "No se pudieron cargar los tratamientos.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadTreatments();
  }, [parcelId, searchQuery]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadTreatments();
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.dateBadge}>
          <Text style={styles.dateDay}>{format(new Date(item.application_date), "dd")}</Text>
          <Text style={styles.dateMonth}>{format(new Date(item.application_date), "MMM", { locale: es }).toUpperCase()}</Text>
        </View>
        <View style={styles.infoContainer}>
          <Text style={styles.treatmentName}>{item.name}</Text>
          <Text style={styles.activeIngredient}>{item.active_ingredient || "Sin ingrediente activo"}</Text>
          <View style={styles.tagContainer}>
            <View style={[styles.tag, { backgroundColor: '#e8f5e9' }]}>
              <Text style={[styles.tagText, { color: '#2e7d32' }]}>{item.category_name || "Tratamiento"}</Text>
            </View>
            <View style={[styles.tag, { backgroundColor: '#e3f2fd' }]}>
              <Text style={[styles.tagText, { color: '#1976d2' }]}>{item.parcel_name || "Parcela desconocida"}</Text>
            </View>
          </View>
        </View>
        <View style={styles.doseContainer}>
          <Text style={styles.doseValue}>{item.dose || `${item.dose_value} ${item.dose_unit}/Ha`}</Text>
          <Text style={styles.doseLabel}>Dosis</Text>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1b1f23" />
        </TouchableOpacity>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>Historial de Tratamientos</Text>
          {parcelName && <Text style={styles.subtitle}>{parcelName}</Text>}
        </View>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar tratamientos..."
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {loading && !refreshing ? (
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color="#2e7d32" />
        </View>
      ) : (
        <FlatList
          data={treatments}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="flask-outline" size={64} color="#9ba9a0" />
              <Text style={styles.emptyStateText}>No se encontraron tratamientos</Text>
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
  subtitle: { fontSize: 14, color: "#607463" },
  searchContainer: { padding: 20 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 50,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  searchInput: { flex: 1, marginLeft: 10, fontSize: 16 },
  listContent: { paddingHorizontal: 20, paddingBottom: 40 },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: { flexDirection: "row", alignItems: "center" },
  dateBadge: {
    width: 50,
    height: 55,
    backgroundColor: "#f5f7fa",
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  dateDay: { fontSize: 18, fontWeight: "800", color: "#1b1f23" },
  dateMonth: { fontSize: 10, fontWeight: "700", color: "#607463" },
  infoContainer: { flex: 1 },
  treatmentName: { fontSize: 16, fontWeight: "700", color: "#1b1f23", marginBottom: 2 },
  activeIngredient: { fontSize: 13, color: "#607463", fontStyle: "italic", marginBottom: 8 },
  tagContainer: { flexDirection: "row", flexWrap: "wrap" },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: { fontSize: 10, fontWeight: "700" },
  doseContainer: { alignItems: "flex-end", minWidth: 80 },
  doseValue: { fontSize: 14, fontWeight: "800", color: "#1b1f23" },
  doseLabel: { fontSize: 10, color: "#607463", marginTop: 2 },
  centerContent: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyState: { alignItems: "center", marginTop: 100 },
  emptyStateText: { marginTop: 15, fontSize: 16, color: "#607463", fontWeight: "600" },
});

