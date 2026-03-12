import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Alert, TouchableOpacity } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { dypai } from "../../lib/dypai";
import { formatEuro } from "../../utils/formatters";
import { useNavigation } from "@react-navigation/native";

export default function FinanzasTab({ fieldId, isActive }) {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    income: 0,
    expenses: 0,
    balance: 0,
    transactions: [],
  });

  useEffect(() => {
    if (fieldId && isActive) {
      loadFinances();
    }
  }, [fieldId, isActive]);

  const loadFinances = async () => {
    try {
      setLoading(true);
      
      const { data: responseData, error } = await dypai.api.get("obtener_transacciones", {
        params: {
          parcel_id: fieldId,
          limit: 100,
          sort_by: "date",
          order: "DESC",
        }
      });
      if (error) throw error;

      const transactions = Array.isArray(responseData) ? responseData : [];

      const expenses = transactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);
      
      const income = transactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

      setData({
        income,
        expenses,
        balance: income - expenses,
        transactions,
      });
    } catch (error) {
      console.error("Error cargando finanzas de parcela:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="small" color="#2e7d32" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Balance Box */}
      <View style={styles.balanceContainer}>
        <Text style={styles.balanceLabel}>BALANCE NETO</Text>
        <Text style={[styles.balanceValue, { color: data.balance >= 0 ? "#1b1f23" : "#ef4444" }]}>
          {data.balance >= 0 ? "+" : ""}{formatEuro(data.balance)}
        </Text>
        
        <View style={styles.miniCardsRow}>
          <View style={styles.miniCard}>
            <View style={[styles.miniIcon, { backgroundColor: "#f0fdf4" }]}>
              <Ionicons name="arrow-down" size={14} color="#15803d" />
            </View>
            <View>
              <Text style={styles.miniLabel}>Ingresos</Text>
              <Text style={[styles.miniValue, { color: "#15803d" }]}>{formatEuro(data.income)}</Text>
            </View>
          </View>
          <View style={styles.miniCard}>
            <View style={[styles.miniIcon, { backgroundColor: "#fef2f2" }]}>
              <Ionicons name="arrow-up" size={14} color="#ef4444" />
            </View>
            <View>
              <Text style={styles.miniLabel}>Gastos</Text>
              <Text style={[styles.miniValue, { color: "#ef4444" }]}>{formatEuro(data.expenses)}</Text>
            </View>
          </View>
        </View>
      </View>

      <Text style={styles.sectionTitle}>ÚLTIMOS MOVIMIENTOS</Text>
      
      {data.transactions.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="receipt-outline" size={48} color="#cbd5e1" />
          <Text style={styles.emptyText}>Sin movimientos financieros</Text>
          <Text style={styles.emptySubtext}>Los tickets y facturas aparecerán aquí</Text>
        </View>
      ) : (
        data.transactions.map((t) => (
          <TouchableOpacity 
            key={t.id} 
            style={styles.transactionItem}
            onPress={() => navigation.navigate("TransactionDetail", { transaction: t })}
            activeOpacity={0.7}
          >
            <View style={[styles.iconBox, { backgroundColor: t.type === 'income' ? '#f0fdf4' : '#f8fafc' }]}>
              <Ionicons 
                name={t.type === 'income' ? "trending-up" : "receipt-outline"} 
                size={20} 
                color={t.type === 'income' ? "#15803d" : "#64748b"} 
              />
            </View>
            <View style={styles.transactionInfo}>
              <Text style={styles.transactionConcept} numberOfLines={1}>{t.concept || t.category || "Transacción"}</Text>
              <Text style={styles.transactionDate}>
                {new Date(t.date).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
              </Text>
            </View>
            <Text style={[styles.transactionAmount, { color: t.type === 'income' ? "#15803d" : "#1e293b" }]}>
              {t.type === 'income' ? '+' : '-'}{formatEuro(t.amount)}
            </Text>
          </TouchableOpacity>
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContainer: { paddingVertical: 40, alignItems: "center" },
  balanceContainer: {
    paddingVertical: 24,
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    marginBottom: 32,
  },
  balanceLabel: { fontSize: 11, fontWeight: "900", color: "#94a3b8", letterSpacing: 1.5, marginBottom: 8 },
  balanceValue: { fontSize: 32, fontWeight: "300", letterSpacing: -1, marginBottom: 24 },
  miniCardsRow: { flexDirection: "row", gap: 12, paddingHorizontal: 16 },
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
  miniIcon: { width: 32, height: 32, borderRadius: 10, justifyContent: "center", alignItems: "center" },
  miniLabel: { fontSize: 10, fontWeight: "700", color: "#94a3b8", textTransform: "uppercase" },
  miniValue: { fontSize: 13, fontWeight: "800" },
  
  sectionTitle: { fontSize: 11, fontWeight: "900", color: "#94a3b8", letterSpacing: 1.5, marginBottom: 16, paddingLeft: 4 },
  transactionItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  transactionInfo: { flex: 1 },
  transactionConcept: { fontSize: 15, fontWeight: "700", color: "#1e293b", marginBottom: 2 },
  transactionDate: { fontSize: 12, color: "#94a3b8", fontWeight: "500" },
  transactionAmount: { fontSize: 15, fontWeight: "800" },
  
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
