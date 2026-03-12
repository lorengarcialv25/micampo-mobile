import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  Alert,
  Platform,
  SafeAreaView,
  ActivityIndicator,
  RefreshControl,
  TextInput,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useCampaign } from '../context/CampaignContext';
import { dypai } from '../lib/dypai';
import HarvestTicketFormModal from '../components/HarvestTicketFormModal';
import ClientFormModal from '../components/ClientFormModal';
import { useNavigation } from '@react-navigation/native';

// --- PALETA DE COLORES PROFESIONAL ---
const COLORS = {
  primary: '#2e7d32', // Verde MiCampo
  primaryLight: '#f0f7f0',
  secondary: '#D97706', // Ámbar oscuro
  bg: '#f7f9f5', // Gris MiCampo
  card: '#FFFFFF',
  text: '#1b1f23', // Casi negro
  textSecondary: '#607463', // Gris medio
  textTertiary: '#9ba9a0', // Gris claro
  success: '#2e7d32',
  error: '#d32f2f',
  border: '#d6e2d1',
  inputBg: '#ffffff',
};

export default function CropsScreen() {
  const navigation = useNavigation();
  const { currentCampaign, currentCampaignId } = useCampaign();
  
  const [activeTab, setActiveTab] = useState('albaranes'); // 'albaranes' o 'clientes'
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Data state
  const [harvestTickets, setHarvestTickets] = useState([]);
  const [incomeTransactions, setIncomeTransactions] = useState([]);
  const [clients, setClients] = useState([]);
  
  // Modals state
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showClientModal, setShowClientModal] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  const loadData = useCallback(async () => {
    if (!currentCampaignId) {
      setLoading(false);
      setRefreshing(false);
      return;
    }
    
    try {
      if (!refreshing) setLoading(true);
      
      const [ticketsRes, incomeRes, clientsRes] = await Promise.all([
        dypai.api.get("obtener_harvest_tickets", { params: { campaign_id: currentCampaignId } }),
        dypai.api.get("obtener_transacciones", { 
          params: { 
            campaign_id: currentCampaignId,
            type: "income"
          } 
        }),
        dypai.api.get("obtener_clientes")
      ]);

      setHarvestTickets(Array.isArray(ticketsRes) ? ticketsRes : (ticketsRes?.data || []));
      setIncomeTransactions(Array.isArray(incomeRes) ? incomeRes : (incomeRes?.data || []));
      setClients(Array.isArray(clientsRes) ? clientsRes : (clientsRes?.data || []));
    } catch (error) {
      console.error("Error cargando datos de campaña:", error);
      Alert.alert("Error", "No se pudieron cargar los datos de la campaña");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentCampaignId, refreshing]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const stats = useMemo(() => {
    const totalKilos = harvestTickets.reduce((acc, t) => acc + (parseFloat(t.kilograms) || 0), 0);
    const ticketsWithDegrees = harvestTickets.filter(t => t.degrees);
    const avgDegrees = ticketsWithDegrees.length > 0 
      ? harvestTickets.reduce((acc, t) => acc + (parseFloat(t.degrees) || 0), 0) / ticketsWithDegrees.length
      : 0;
    const totalEstimated = harvestTickets.reduce((acc, t) => acc + (parseFloat(t.total_amount) || 0), 0);
    const totalPaid = incomeTransactions.reduce((acc, t) => acc + (parseFloat(t.amount) || 0), 0);
    const pendingAmount = Math.max(0, totalEstimated - totalPaid);

    return {
      totalKilos,
      avgDegrees: avgDegrees || 0,
      totalEstimated,
      totalPaid,
      pendingAmount
    };
  }, [harvestTickets, incomeTransactions]);

  const filteredTickets = useMemo(() => {
    if (!searchQuery.trim()) return harvestTickets;
    const query = searchQuery.toLowerCase().trim();
    return harvestTickets.filter((t) => {
      return (
        (t.ticket_number || "").toLowerCase().includes(query) ||
        (t.parcel_name || "").toLowerCase().includes(query) ||
        (t.client_name || "").toLowerCase().includes(query)
      );
    });
  }, [searchQuery, harvestTickets]);

  const handleCreateTicket = async (payload) => {
    try {
      await dypai.api.post("crear_harvest_ticket", payload);
      Alert.alert("Éxito", "Albarán registrado correctamente");
      setShowTicketModal(false);
      loadData();
    } catch (error) {
      console.error("Error guardando albarán:", error);
      Alert.alert("Error", "No se pudo guardar el albarán");
    }
  };

  const formatEuro = (amount) => {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const RecoleccionStatsCard = () => {
    return (
      <View style={styles.statsContainer}>
        <View style={styles.mainStatCard}>
          <Text style={styles.mainStatLabel}>Total Recolectado</Text>
          <Text style={styles.mainStatValue}>
            {stats.totalKilos.toLocaleString()} <Text style={styles.mainStatUnit}>kg</Text>
          </Text>
        </View>
      </View>
    );
  };

  const renderTicketItem = ({ item }) => {
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

    const isPaid = item.payment_status === 'paid';
    const categoryKey = item.crop_type?.toLowerCase() || 'otros';
    const iconColor = isPaid ? "#2e7d32" : "#ffb300";

    return (
      <TouchableOpacity 
        style={styles.ticketCard}
        onPress={() => {
          navigation.navigate("HarvestTicketDetail", { ticket: item });
        }}
        activeOpacity={0.6}
      >
        <View style={[styles.ticketIconBox, { backgroundColor: `${iconColor}10` }]}>
          <MaterialCommunityIcons name="truck-delivery" size={22} color={iconColor} />
        </View>
        <View style={styles.ticketMainInfo}>
          <Text style={styles.ticketConcept} numberOfLines={1}>
            #{item.ticket_number || 'S/N'} • {item.crop_type?.replace('_', ' ') || 'Otro'}
          </Text>
          <Text style={styles.ticketSubtext}>
            {formatDate(item.date)} {item.parcel_name ? `• ${item.parcel_name}` : ''} {item.client_name ? `• ${item.client_name}` : ''}
          </Text>
        </View>
        <View style={styles.ticketAmountContainer}>
          <Text style={[styles.ticketAmount, { color: isPaid ? "#2e7d32" : "#1b1f23" }]}>
            {parseFloat(item.kilograms || 0).toLocaleString()} kg
          </Text>
          {!!item.total_amount && parseFloat(item.total_amount) > 0 && (
            <Text style={styles.ticketAmountSecondary}>
              {formatEuro(parseFloat(item.total_amount))}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderClientItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.clientCard}
      onPress={() => {
        setSelectedClient(item);
        setShowClientModal(true);
      }}
    >
      <View style={styles.clientIcon}>
        <MaterialCommunityIcons 
          name={item.is_cooperative ? "office-building" : "account"} 
          size={24} 
          color={COLORS.primary} 
        />
      </View>
      <View style={styles.clientInfo}>
        <Text style={styles.clientName}>{item.name}</Text>
        <Text style={styles.clientType}>
          {item.is_cooperative ? 'Cooperativa' : 'Privado / Otro'}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.textTertiary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Stats Section */}
        <RecoleccionStatsCard />

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'albaranes' && styles.tabActive]}
            onPress={() => setActiveTab('albaranes')}
          >
            <Text style={[styles.tabText, activeTab === 'albaranes' && styles.tabTextActive]}>
              ALBARANES
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'clientes' && styles.tabActive]}
            onPress={() => setActiveTab('clientes')}
          >
            <Text style={[styles.tabText, activeTab === 'clientes' && styles.tabTextActive]}>
              CLIENTES
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'albaranes' ? (
          <View style={styles.tabContent}>
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={18} color={COLORS.textTertiary} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar por albarán, parcela..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            {loading ? (
              <ActivityIndicator color={COLORS.primary} style={styles.loader} />
            ) : filteredTickets.length > 0 ? (
              filteredTickets.map((item) => (
                <View key={item.id}>
                  {renderTicketItem({ item })}
                </View>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="truck-delivery-outline" size={64} color={COLORS.textTertiary} />
                <Text style={styles.emptyTitle}>No hay albaranes</Text>
                <Text style={styles.emptySubtitle}>Empieza registrando una entrada de cosecha</Text>
              </View>
            )}
          </View>
        ) : (
          <View style={styles.tabContent}>
            {loading ? (
              <ActivityIndicator color={COLORS.primary} style={styles.loader} />
            ) : clients.length > 0 ? (
              clients.map((item) => (
                <View key={item.id}>
                  {renderClientItem({ item })}
                </View>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <MaterialCommunityIcons name="office-building" size={64} color={COLORS.textTertiary} />
                <Text style={styles.emptyTitle}>No hay clientes</Text>
                <Text style={styles.emptySubtitle}>Registra tus cooperativas o clientes habituales</Text>
              </View>
            )}
          </View>
        )}
        
        {/* Espacio extra al final para scroll */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Modals */}
      <HarvestTicketFormModal
        visible={showTicketModal}
        onClose={() => setShowTicketModal(false)}
        onSave={handleCreateTicket}
      />
      <ClientFormModal
        visible={showClientModal}
        onClose={() => setShowClientModal(false)}
        onSuccess={() => {
          loadData();
          setShowClientModal(false);
        }}
        initialData={selectedClient}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollView: { flex: 1, backgroundColor: '#fff' },
  statsContainer: {
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  mainStatCard: {
    alignItems: "center",
    marginBottom: 10,
  },
  mainStatLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
    marginBottom: 8,
  },
  mainStatValue: {
    fontSize: 42,
    fontWeight: "300",
    letterSpacing: -1,
    color: COLORS.text,
  },
  mainStatUnit: {
    fontSize: 24,
    fontWeight: "300",
    color: COLORS.textSecondary,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    backgroundColor: '#eee',
    borderRadius: 12,
    padding: 4,
    marginBottom: 15,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActive: { backgroundColor: '#fff', elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 3, shadowOffset: { width: 0, height: 1 } },
  tabText: { fontSize: 11, fontWeight: '800', color: COLORS.textTertiary, letterSpacing: 1 },
  tabTextActive: { color: COLORS.primary },
  tabContent: { 
    paddingHorizontal: 20,
    backgroundColor: '#fff',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 15,
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, height: 45, fontSize: 14, color: COLORS.text },
  loader: { marginTop: 40 },
  ticketCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 0,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  ticketIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  ticketMainInfo: {
    flex: 1,
  },
  ticketConcept: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 4,
  },
  ticketSubtext: {
    fontSize: 13,
    color: "#94a3b8",
    fontWeight: "500",
  },
  ticketAmountContainer: {
    alignItems: "flex-end",
  },
  ticketAmount: {
    fontSize: 16,
    fontWeight: "800",
  },
  ticketAmountSecondary: {
    fontSize: 12,
    color: "#94a3b8",
    fontWeight: "600",
    marginTop: 2,
  },
  clientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  clientIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 15,
  },
  clientInfo: { flex: 1 },
  clientName: { fontSize: 16, fontWeight: '700', color: COLORS.text },
  clientType: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: COLORS.text, marginTop: 15 },
  emptySubtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 6, textAlign: 'center' },
});
