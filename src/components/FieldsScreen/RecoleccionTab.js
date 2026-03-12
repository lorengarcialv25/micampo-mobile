import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";
import { dypai } from "../../lib/dypai";
import { formatEuro } from "../../utils/formatters";
import { useNavigation } from "@react-navigation/native";
import { useCampaign } from "../../context/CampaignContext";

const COLORS = {
  primary: '#2e7d32',
  text: '#1b1f23',
  textSecondary: '#64748b',
  textTertiary: '#94a3b8',
  border: '#e5e7eb',
};

export default function RecoleccionTab({ fieldId, isActive }) {
  const navigation = useNavigation();
  const { currentCampaignId } = useCampaign();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (fieldId && isActive && currentCampaignId) {
      loadHarvestTickets();
    }
  }, [fieldId, isActive, currentCampaignId]);

  const loadHarvestTickets = async () => {
    try {
      setLoading(true);
      const response = await dypai.api.get("obtener_harvest_tickets", {
        params: {
          parcel_id: fieldId,
          campaign_id: currentCampaignId,
          limit: 100,
          sort_by: "date",
          order: "DESC",
        }
      });
      
      let ticketsData = [];
      if (response?.data && Array.isArray(response.data)) {
        ticketsData = response.data;
      } else if (Array.isArray(response)) {
        ticketsData = response;
      }
      
      setTickets(ticketsData);
    } catch (error) {
      console.error("Error cargando albaranes de parcela:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="small" color={COLORS.primary} />
      </View>
    );
  }

  const totalKilos = tickets.reduce((acc, t) => acc + (parseFloat(t.kilograms) || 0), 0);

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
    <View style={styles.container}>
      {/* Stats Section - Estilo CropsScreen */}
      <View style={styles.statsContainer}>
        <View style={styles.mainStatCard}>
          <Text style={styles.mainStatLabel}>Total Recolectado</Text>
          <Text style={styles.mainStatValue}>
            {totalKilos.toLocaleString()} <Text style={styles.mainStatUnit}>kg</Text>
          </Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>HISTORIAL DE ALBARANES</Text>

      {tickets.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="truck-delivery-outline" size={48} color="#cbd5e1" />
          <Text style={styles.emptyText}>No hay albaranes</Text>
          <Text style={styles.emptySubtext}>Las entradas de cosecha aparecerán aquí</Text>
        </View>
      ) : (
        tickets.map((item) => {
          const isPaid = item.payment_status === 'paid';
          const iconColor = isPaid ? COLORS.primary : "#ffb300";

          return (
            <TouchableOpacity 
              key={item.id} 
              style={styles.ticketCard}
              onPress={() => navigation.navigate("HarvestTicketDetail", { ticket: item })}
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
                  {formatDate(item.date)} {item.client_name ? `• ${item.client_name}` : ''}
                </Text>
              </View>
              <View style={styles.ticketAmountContainer}>
                <Text style={[styles.ticketAmount, { color: isPaid ? COLORS.primary : COLORS.text }]}>
                  {parseFloat(item.kilograms || 0).toLocaleString()} kg
                </Text>
                {item.total_amount && parseFloat(item.total_amount) > 0 && (
                  <Text style={styles.ticketAmountSecondary}>
                    {formatEuro(parseFloat(item.total_amount))}
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { paddingVertical: 40, alignItems: "center" },
  
  // Estilos calcados de CropsScreen
  statsContainer: {
    paddingVertical: 32,
    paddingHorizontal: 0,
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

  sectionTitle: { fontSize: 11, fontWeight: "900", color: "#94a3b8", letterSpacing: 1.5, marginBottom: 16, paddingLeft: 4 },
  
  ticketCard: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 0,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
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
  
  emptyState: {
    padding: 40,
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  emptyText: { fontSize: 16, fontWeight: "700", color: "#1e293b", marginTop: 16 },
  emptySubtext: { fontSize: 13, color: "#64748b", marginTop: 4, fontWeight: "500" },
});
