import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Pressable,
  Image,
  ActivityIndicator,
  Alert,
  RefreshControl,
  TextInput,
  StatusBar,
  Platform,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { dypai } from "../lib/dypai";
import ParcelaFormModal from "../components/ParcelaFormModal";
import { formatArea, formatNumber } from "../utils/formatters";

const CROP_CONFIG = {
  uva: { icon: "flower", color: "#9333ea", label: "Viña" },
  cereales: { icon: "wheat", color: "#d97706", label: "Cereal" },
  aceituna: { icon: "leaf", color: "#059669", label: "Olivar" },
  frutos_secos: { icon: "nut", color: "#ea580c", label: "Frutos Secos" },
  otros: { icon: "plus", color: "#64748b", label: "Otros" },
};

const getCropConfig = (cropType) => {
  if (!cropType) return CROP_CONFIG.otros;
  const type = cropType.toLowerCase();
  if (type.includes("uva") || type.includes("viña")) return CROP_CONFIG.uva;
  if (type.includes("cereal") || type.includes("trigo") || type.includes("cebada")) return CROP_CONFIG.cereales;
  if (type.includes("aceituna") || type.includes("olivar") || type.includes("olivo")) return CROP_CONFIG.aceituna;
  if (type.includes("seco") || type.includes("almendr") || type.includes("pistacho")) return CROP_CONFIG.frutos_secos;
  return CROP_CONFIG.otros;
};

const SummaryCard = ({ totalHa, totalCount }) => (
  <View style={styles.summaryContainer}>
    <View style={styles.summaryCard}>
      <View style={styles.summaryItem}>
        <Text style={styles.summaryLabel}>Superficie Total</Text>
        <Text style={styles.summaryValue}>{formatNumber(totalHa)} <Text style={styles.summaryUnit}>ha</Text></Text>
      </View>
      <View style={styles.summaryDivider} />
      <View style={styles.summaryItem}>
        <Text style={styles.summaryLabel}>Parcelas</Text>
        <Text style={styles.summaryValue}>{totalCount}</Text>
      </View>
    </View>
  </View>
);

const ParcelaCard = ({ field, onPress }) => {
  const cropConfig = getCropConfig(field.crop_type);
  
  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.cropIconBox, { backgroundColor: `${cropConfig.color}15` }]}>
          <MaterialCommunityIcons name={cropConfig.icon} size={24} color={cropConfig.color} />
        </View>
        <View style={styles.cardTitleContainer}>
          <View style={styles.cardNameRow}>
            <Text style={styles.cardTitle} numberOfLines={1}>{field.name}</Text>
            {field.is_leased ? (
              <View style={styles.leaseBadge}>
                <Ionicons name="person-outline" size={10} color="#b45309" />
                <Text style={styles.leaseBadgeText}>ARRENDADA</Text>
              </View>
            ) : (
              <View style={[styles.leaseBadge, { backgroundColor: '#f0fdf4', borderColor: '#dcfce7' }]}>
                <Text style={[styles.leaseBadgeText, { color: '#15803d' }]}>PROPIA</Text>
              </View>
            )}
          </View>
          <Text style={styles.cardSub}>
            {field.crop_type || "Sin cultivo definido"}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#cbd5e1" />
      </View>

      <View style={styles.cardFooter}>
        <View style={styles.areaInfo}>
          <View style={styles.areaItem}>
            <Text style={styles.areaLabel}>SUPERFICIE</Text>
            <Text style={styles.areaValue}>{formatArea(field.area_ha || 0)}</Text>
          </View>
          {field.area_fanegas && (
            <>
              <View style={styles.footerDivider} />
              <View style={styles.areaItem}>
                <Text style={styles.areaLabel}>FANEGAS</Text>
                <Text style={styles.areaValue}>{formatNumber(field.area_fanegas)} f</Text>
              </View>
            </>
          )}
        </View>
        
        <View style={styles.lastActivity}>
          <Text style={styles.areaLabel}>ÚLTIMA ACCIÓN</Text>
          <Text style={styles.lastActivityValue} numberOfLines={1}>
            {field.lastActivity || "Sin registros"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function FieldsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCrop, setSelectedCrop] = useState("all");

  const loadParcelas = async () => {
    try {
      const response = await dypai.api.get("obtener_parcels", {
        params: {
          sort_by: 'name',
          order: 'ASC',
          limit: 1000
        }
      });
      
      let parcelsData = [];
      if (response?.data && Array.isArray(response.data)) {
        parcelsData = response.data;
      } else if (Array.isArray(response)) {
        parcelsData = response;
      }
      
      setFields(parcelsData);
    } catch (error) {
      console.error("Error cargando parcelas:", error);
      Alert.alert("Error", "No se pudieron cargar las parcelas. Intenta de nuevo.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadParcelas();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadParcelas();
  };

  const handleCreateParcela = async (parcelaData) => {
    try {
      const response = await dypai.api.post("crear_parcela", parcelaData);
      if (response && (response.success || response.id)) {
        Alert.alert("Éxito", "Parcela creada correctamente");
        setShowModal(false);
        loadParcelas();
      } else {
        throw new Error("No se pudo crear la parcela");
      }
    } catch (error) {
      console.error("Error creando parcela:", error);
      Alert.alert("Error", error.message || "No se pudo crear la parcela. Intenta de nuevo.");
    }
  };

  const filteredFields = useMemo(() => {
    let result = fields;
    
    if (selectedCrop !== "all") {
      result = result.filter(f => {
        const config = getCropConfig(f.crop_type);
        // Find which key in CROP_CONFIG matches the label
        const cropKey = Object.keys(CROP_CONFIG).find(key => CROP_CONFIG[key].label === selectedCrop);
        return getCropConfig(f.crop_type).label === selectedCrop;
      });
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      result = result.filter((field) => {
        const name = (field.name || "").toLowerCase();
        const cropType = (field.crop_type || "").toLowerCase();
        return name.includes(query) || cropType.includes(query);
      });
    }
    
    return result;
  }, [fields, searchQuery, selectedCrop]);

  const stats = useMemo(() => {
    const totalHa = fields.reduce((acc, curr) => acc + parseFloat(curr.area_ha || 0), 0);
    return { totalHa, totalCount: fields.length };
  }, [fields]);

  const cropFilters = useMemo(() => {
    const crops = new Set(fields.map(f => getCropConfig(f.crop_type).label).filter(Boolean));
    return ["all", ...Array.from(crops)];
  }, [fields]);

  const renderHeader = () => (
    <View style={styles.header}>
      <SummaryCard totalHa={stats.totalHa} totalCount={stats.totalCount} />
      
      <TouchableOpacity 
        style={styles.treatmentsCard}
        onPress={() => navigation.navigate("Treatments")}
        activeOpacity={0.7}
      >
        <View style={styles.treatmentsIcon}>
          <MaterialCommunityIcons name="flask-outline" size={20} color="#2e7d32" />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.treatmentsTitle}>Cuaderno de Campo</Text>
          <Text style={styles.treatmentsSubtitle}>Tratamientos y fitosanitarios</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
      </TouchableOpacity>

      <View style={styles.searchWrapper}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#94a3b8" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar parcelas..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
          {searchQuery !== "" && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color="#cbd5e1" />
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={cropFilters}
          keyExtractor={item => item}
          style={styles.chipScroll}
          contentContainerStyle={{ paddingRight: 20 }}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={[styles.chip, selectedCrop === item && styles.chipActive]} 
              onPress={() => setSelectedCrop(item)}
            >
              <Text style={[styles.chipText, selectedCrop === item && styles.chipTextActive]}>
                {item === 'all' ? 'Todos' : item}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      <View style={styles.sectionTitleRow}>
        <Text style={styles.sectionTitle}>Tus Parcelas</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <FlatList
        data={filteredFields}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ParcelaCard 
            field={item} 
            onPress={() => navigation.navigate("FieldDetail", { fieldId: item.id })} 
          />
        )}
        ListHeaderComponent={renderHeader()}
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="small" color="#2e7d32" />
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <MaterialCommunityIcons name="map-marker-off-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>No se encontraron parcelas</Text>
            </View>
          )
        }
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#2e7d32" />
        }
        showsVerticalScrollIndicator={false}
      />

      <ParcelaFormModal
        visible={showModal}
        onClose={() => setShowModal(false)}
        onSave={handleCreateParcela}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  listContent: { paddingHorizontal: 20, paddingTop: 10, paddingBottom: 100 },
  header: { paddingBottom: 10 },
  
  // Summary Styles
  summaryContainer: { paddingVertical: 24, alignItems: "center" },
  summaryCard: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    width: "100%",
  },
  summaryItem: { flex: 1, alignItems: "center" },
  summaryDivider: { width: 1, height: "100%", backgroundColor: "#e2e8f0" },
  summaryLabel: { fontSize: 12, fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", marginBottom: 4 },
  summaryValue: { fontSize: 24, fontWeight: "800", color: "#1e293b" },
  summaryUnit: { fontSize: 14, fontWeight: "600", color: "#64748b" },

  // Action Card Style
  treatmentsCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  treatmentsIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#e8f5e9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  treatmentsTitle: { fontSize: 15, fontWeight: "700", color: "#1e293b" },
  treatmentsSubtitle: { fontSize: 12, color: "#64748b", marginTop: 2 },

  // Filter & Search Styles
  searchWrapper: { marginBottom: 24, gap: 12 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    borderRadius: 12,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 15, color: "#1e293b", fontWeight: "500" },
  chipScroll: { marginTop: 4 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  chipActive: { backgroundColor: "#2e7d32", borderColor: "#2e7d32" },
  chipText: { fontSize: 12, fontWeight: "600", color: "#64748b" },
  chipTextActive: { color: "#fff" },

  // List Styles
  sectionTitleRow: { marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#1b1f23", letterSpacing: -0.5 },
  
  // Card Styles
  card: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  cropIconBox: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  cardTitleContainer: { flex: 1 },
  cardNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  cardTitle: { fontSize: 17, fontWeight: "800", color: "#1e293b" },
  cardSub: { fontSize: 13, color: "#94a3b8", fontWeight: "500" },
  leaseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fff7ed',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ffedd5',
  },
  leaseBadgeText: { fontSize: 9, fontWeight: "900", color: "#b45309" },
  
  cardFooter: {
    flexDirection: "row",
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#f8fafc",
    justifyContent: "space-between",
    alignItems: "center",
  },
  areaInfo: { flexDirection: "row", alignItems: "center", gap: 12 },
  areaItem: { gap: 2 },
  areaLabel: { fontSize: 10, fontWeight: "800", color: "#94a3b8", letterSpacing: 0.5 },
  areaValue: { fontSize: 14, fontWeight: "700", color: "#1e293b" },
  footerDivider: { width: 1, height: 20, backgroundColor: "#f1f5f9" },
  lastActivity: { alignItems: "flex-end", flex: 1, marginLeft: 16 },
  lastActivityValue: { fontSize: 13, fontWeight: "600", color: "#475569", marginTop: 2 },

  emptyContainer: { paddingVertical: 60, alignItems: "center" },
  emptyText: { marginTop: 12, color: "#94a3b8", fontSize: 14, fontWeight: "500" },
});
