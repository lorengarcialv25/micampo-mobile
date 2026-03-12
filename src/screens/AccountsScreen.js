import React, { useState, useEffect, useCallback, useMemo } from "react";
import { 
  FlatList, 
  View, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator, 
  RefreshControl, 
  Alert,
  Platform,
  StatusBar,
  TextInput,
  ScrollView
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { dypai } from "../lib/dypai";
import { useCampaign } from "../context/CampaignContext";
import { formatDateFull, formatEuro } from "../utils/formatters";

const PAGE_SIZE = 20;

const CATEGORY_ICONS = {
  "gasóleo": "speedometer-outline",
  "gasoil": "speedometer-outline",
  "reparaciones": "construct-outline",
  "semillas": "leaf-outline",
  "fertilizantes": "flask-outline",
  "riego": "water-outline",
  "mano de obra": "people-outline",
  "maquinaria": "bus-outline",
  "fitosanitarios": "leaf-outline",
  "seguros": "shield-checkmark-outline",
  "recolección": "nutrition-outline",
  "arrendamientos": "business-outline",
  "suministros": "bulb-outline",
  "impuestos": "file-tray-full-outline",
  "venta de cosecha": "cash-outline",
  "subvenciones": "file-tray-full-outline",
  "otros": "receipt-outline",
};

const CATEGORY_COLORS = {
  "gasóleo": "#2563eb",
  "gasoil": "#2563eb",
  "reparaciones": "#ea580c",
  "semillas": "#059669",
  "fertilizantes": "#9333ea",
  "riego": "#0891b2",
  "mano de obra": "#dc2626",
  "maquinaria": "#d97706",
  "fitosanitarios": "#65a30d",
  "seguros": "#4f46e5",
  "recolección": "#b45309",
  "arrendamientos": "#475569",
  "suministros": "#ca8a04",
  "impuestos": "#e11d48",
  "venta de cosecha": "#059669",
  "subvenciones": "#2563eb",
  "otros": "#475569",
};

const BalanceCard = ({ incomes, expenses }) => {
  const balance = incomes - expenses;
  return (
    <View style={styles.balanceContainer}>
      <Text style={styles.balanceLabel}>Balance de Campaña</Text>
      <Text style={[styles.balanceAmount, { color: balance >= 0 ? "#1b1f23" : "#dc2626" }]}>
        {balance >= 0 ? "+" : ""}{formatEuro(balance)}
      </Text>
      
      <View style={styles.miniCardsRow}>
        <View style={styles.miniCard}>
          <View style={[styles.miniIcon, { backgroundColor: "#e8f5e9" }]}>
            <Ionicons name="arrow-down-outline" size={14} color="#2e7d32" />
          </View>
          <View>
            <Text style={styles.miniLabel}>Ingresos</Text>
            <Text style={styles.miniValue}>{formatEuro(incomes)}</Text>
          </View>
        </View>
        <View style={styles.miniCard}>
          <View style={[styles.miniIcon, { backgroundColor: "#fef2f2" }]}>
            <Ionicons name="arrow-up-outline" size={14} color="#dc2626" />
          </View>
          <View>
            <Text style={styles.miniLabel}>Gastos</Text>
            <Text style={styles.miniValue}>{formatEuro(expenses)}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const TransactionItem = ({ item, onPress }) => {
  const isIncome = item.type === 'income';
  const categoryKey = item.category?.toLowerCase() || 'otros';
  const iconName = isIncome ? "trending-up" : (CATEGORY_ICONS[categoryKey] || "receipt-outline");
  const iconColor = isIncome ? "#059669" : (CATEGORY_COLORS[categoryKey] || "#475569");

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return "Hoy";
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return "Ayer";
    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
  };

  return (
    <TouchableOpacity style={styles.itemContainer} onPress={onPress} activeOpacity={0.6}>
      <View style={[styles.itemIconBox, { backgroundColor: `${iconColor}10` }]}>
        <Ionicons name={iconName} size={22} color={iconColor} />
      </View>
      <View style={styles.itemMainInfo}>
        <Text style={styles.itemConcept} numberOfLines={1}>{item.concept || "Sin concepto"}</Text>
        <Text style={styles.itemSubtext}>
          {formatDate(item.date)} {item.category ? `• ${item.category}` : ''}
        </Text>
      </View>
      <View style={styles.itemAmountContainer}>
        <Text style={[styles.itemAmount, { color: isIncome ? "#059669" : "#1b1f23" }]}>
          {isIncome ? "+" : "-"}{formatEuro(item.amount)}
        </Text>
        {item.archivo_adjunto_id || item.receipt_image_url ? (
          <Ionicons name="document-text-outline" size={12} color="#94a3b8" style={{ marginTop: 2 }} />
        ) : null}
      </View>
    </TouchableOpacity>
  );
};

const AccountsHeader = ({ 
  totals, 
  searchQuery, 
  setSearchQuery, 
  isSearching, 
  filterType, 
  setFilterType, 
  filterCategory, 
  setFilterCategory, 
  categoriesList,
  navigation 
}) => (
  <View style={styles.header}>
    <BalanceCard incomes={totals.incomes} expenses={totals.expenses} />
    
    <TouchableOpacity 
      style={styles.analysisCard}
      onPress={() => navigation.navigate("AccountAnalysis")}
      activeOpacity={0.7}
    >
      <View style={styles.analysisIcon}>
        <MaterialCommunityIcons name="chart-arc" size={20} color="#2e7d32" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.analysisTitle}>Análisis de Gastos</Text>
        <Text style={styles.analysisSubtitle}>Ver distribución por categorías</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
    </TouchableOpacity>

    <View style={styles.filtersWrapper}>
      <View style={styles.searchBox}>
        {isSearching ? (
          <ActivityIndicator size="small" color="#2e7d32" />
        ) : (
          <Ionicons name="search-outline" size={18} color="#94a3b8" />
        )}
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar por concepto..."
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

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
        <TouchableOpacity 
          style={[styles.chip, filterType === 'all' && styles.chipActive]} 
          onPress={() => setFilterType('all')}
        >
          <Text style={[styles.chipText, filterType === 'all' && styles.chipTextActive]}>Todos</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.chip, filterType === 'income' && styles.chipActive]} 
          onPress={() => setFilterType('income')}
        >
          <Text style={[styles.chipText, filterType === 'income' && styles.chipTextActive]}>Ingresos</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.chip, filterType === 'expense' && styles.chipActive]} 
          onPress={() => setFilterType('expense')}
        >
          <Text style={[styles.chipText, filterType === 'expense' && styles.chipTextActive]}>Gastos</Text>
        </TouchableOpacity>
        
        <View style={styles.chipSeparator} />
        
        {categoriesList.map(cat => (
          <TouchableOpacity 
            key={cat}
            style={[styles.chip, filterCategory === cat && styles.chipActive]} 
            onPress={() => setFilterCategory(cat)}
          >
            <Text style={[styles.chipText, filterCategory === cat && styles.chipTextActive]}>
              {cat === 'all' ? 'Categorías' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>

    <View style={styles.sectionTitleRow}>
      <Text style={styles.sectionTitle}>Movimientos</Text>
    </View>
  </View>
);

export default function AccountsScreen() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { currentCampaignId } = useCampaign();
  
  const [allTransactions, setAllTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [totals, setTotals] = useState({ expenses: 0, incomes: 0 });

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [filterType, setFilterType] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  const categoriesList = useMemo(() => {
    return ["all", ...new Set(Object.keys(CATEGORY_COLORS).filter(c => c !== "gasoil"))];
  }, []);

  // Debounce search query
  useEffect(() => {
    if (searchQuery !== searchTerm) {
      setIsSearching(true);
    }
    const delayDebounceFn = setTimeout(() => {
      setSearchTerm(searchQuery);
      setIsSearching(false);
    }, 600); // 600ms delay before searching

    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery]);

  useEffect(() => {
    resetAndLoad();
  }, [currentCampaignId, filterType, filterCategory, searchTerm]);

  const resetAndLoad = async () => {
    setPage(0);
    setHasMore(true);
    await Promise.all([
      loadTransactions(0, true),
      loadTotals()
    ]);
  };

  const loadTotals = async () => {
    if (!currentCampaignId) return;
    try {
      const [expRes, incRes] = await Promise.all([
        dypai.api.get("obtener_transacciones", { params: { campaign_id: currentCampaignId, type: "expense", limit: 1000 } }),
        dypai.api.get("obtener_transacciones", { params: { campaign_id: currentCampaignId, type: "income", limit: 1000 } })
      ]);

      if (expRes.error) throw expRes.error;
      if (incRes.error) throw incRes.error;

      const getSum = (items) => {
        return (items || []).reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
      };

      setTotals({
        expenses: getSum(expRes.data),
        incomes: getSum(incRes.data)
      });
    } catch (e) {
      console.error("Error cargando totales:", e);
    }
  };

  const loadTransactions = async (pageNum, isInitial = false) => {
    if (!currentCampaignId || (!hasMore && !isInitial)) return;

    try {
      if (isInitial) setLoading(true);
      else setLoadingMore(true);

      const params = {
        campaign_id: currentCampaignId,
        limit: PAGE_SIZE,
        offset: pageNum * PAGE_SIZE,
        sort_by: "date",
        order: "DESC",
      };

      if (filterType !== "all") params.type = filterType;
      if (filterCategory !== "all") params.category = filterCategory;
      if (searchTerm.trim()) params.search = searchTerm;

      const { data, error } = await dypai.api.get("obtener_transacciones", { params });
      if (error) throw error;
      const newData = data || [];

      if (newData.length < PAGE_SIZE) {
        setHasMore(false);
      }

      setAllTransactions(prev => isInitial ? newData : [...prev, ...newData]);
      setPage(pageNum);
    } catch (error) {
      console.error("Error cargando transacciones:", error);
      if (isInitial) Alert.alert("Error", "No se pudieron cargar los movimientos");
    } finally {
      setLoading(false);
      setRefreshing(false);
      setLoadingMore(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    resetAndLoad();
  };

  const handleLoadMore = () => {
    if (!loading && !loadingMore && hasMore) {
      loadTransactions(page + 1);
    }
  };

  const renderFooter = () => {
    if (!loadingMore) return <View style={{ height: 40 }} />;
    return (
      <View style={styles.loaderFooter}>
        <ActivityIndicator size="small" color="#2e7d32" />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <FlatList
        data={allTransactions}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TransactionItem 
            item={item} 
            onPress={() => navigation.navigate("TransactionDetail", { transaction: item })} 
          />
        )}
        ListHeaderComponent={
          <AccountsHeader 
            totals={totals}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            isSearching={isSearching}
            filterType={filterType}
            setFilterType={setFilterType}
            filterCategory={filterCategory}
            setFilterCategory={setFilterCategory}
            categoriesList={categoriesList}
            navigation={navigation}
          />
        }
        ListFooterComponent={renderFooter}
        ListEmptyComponent={
          loading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="small" color="#2e7d32" />
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={48} color="#cbd5e1" />
              <Text style={styles.emptyText}>No hay movimientos que coincidan</Text>
            </View>
          )
        }
        contentContainerStyle={styles.listContent}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2e7d32" />}
        showsVerticalScrollIndicator={false}
      />
      
      {/* FAB */}
      <TouchableOpacity 
        style={[styles.fab, { bottom: insets.bottom + 16 }]}
        onPress={() => navigation.navigate("ActionsStack", { screen: "AddExpense" })}
        activeOpacity={0.9}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 100,
  },
  header: {
    paddingBottom: 10,
  },
  balanceContainer: {
    paddingVertical: 32,
    alignItems: "center",
  },
  balanceLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 42,
    fontWeight: "300",
    letterSpacing: -1,
    marginBottom: 24,
  },
  miniCardsRow: {
    flexDirection: "row",
    gap: 12,
  },
  miniCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  miniIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  miniLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: "#94a3b8",
    textTransform: "uppercase",
  },
  miniValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1e293b",
  },
  analysisCard: {
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
  analysisIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#e8f5e9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  analysisTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1e293b",
  },
  analysisSubtitle: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 2,
  },
  filtersWrapper: {
    marginBottom: 24,
    gap: 12,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    borderRadius: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#1e293b",
    fontWeight: "500",
  },
  chipScroll: {
    flexDirection: "row",
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  chipActive: {
    backgroundColor: "#2e7d32",
    borderColor: "#2e7d32",
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#64748b",
  },
  chipTextActive: {
    color: "#fff",
  },
  chipSeparator: {
    width: 1,
    height: 20,
    backgroundColor: "#e2e8f0",
    marginHorizontal: 8,
    alignSelf: "center",
  },
  sectionTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1b1f23",
    letterSpacing: -0.5,
  },
  itemContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#f1f5f9",
  },
  itemIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  itemMainInfo: {
    flex: 1,
  },
  itemConcept: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 4,
  },
  itemSubtext: {
    fontSize: 13,
    color: "#94a3b8",
    fontWeight: "500",
  },
  itemAmountContainer: {
    alignItems: "flex-end",
  },
  itemAmount: {
    fontSize: 16,
    fontWeight: "800",
  },
  loaderFooter: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: "center",
  },
  emptyText: {
    marginTop: 12,
    color: "#94a3b8",
    fontSize: 14,
    fontWeight: "500",
  },
  fab: {
    position: "absolute",
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2e7d32",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#2e7d32",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
});
