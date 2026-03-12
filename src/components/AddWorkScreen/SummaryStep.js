import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { formatDateFull, formatEuro } from "../../utils/formatters";

const TASK_TYPES = [
  { value: "poda", label: "Poda", icon: "tree" },
  { value: "recoleccion", label: "Recolección", icon: "basket" },
  { value: "tratamiento", label: "Tratamiento", icon: "spray" },
  { value: "riego", label: "Riego", icon: "water" },
  { value: "otros", label: "Otros", icon: "tools" },
];

export default function SummaryStep({
  selectedParcela,
  selectedTaskType,
  date,
  concept,
  description,
  selectedWorkers,
  calculateTotalCost,
}) {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Resumen</Text>
      <Text style={styles.stepSubtitle}>Revisa la información antes de guardar</Text>

      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Parcela:</Text>
          <Text style={styles.summaryValue}>{selectedParcela?.name}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Tipo:</Text>
          <Text style={styles.summaryValue}>
            {TASK_TYPES.find((t) => t.value === selectedTaskType)?.label}
          </Text>
        </View>
        {concept && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Concepto:</Text>
            <Text style={styles.summaryValue}>{concept}</Text>
          </View>
        )}
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Fecha:</Text>
          <Text style={styles.summaryValue}>
            {date instanceof Date ? formatDateFull(date) : formatDateFull(new Date(date))}
          </Text>
        </View>
        {description && (
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Descripción:</Text>
            <Text style={styles.summaryValue}>{description}</Text>
          </View>
        )}
      </View>

      {/* Lista de Trabajadores */}
      <View style={styles.workersCard}>
        <View style={styles.workersHeader}>
          <Text style={styles.workersTitle}>Trabajadores ({selectedWorkers.length})</Text>
        </View>
        {selectedWorkers.map((worker, index) => (
          <View
            key={worker.worker_id}
            style={[
              styles.workerRow,
              index === selectedWorkers.length - 1 && styles.workerRowLast,
            ]}
          >
            <View style={styles.workerInfo}>
              <Text style={styles.workerName}>{worker.worker_name}</Text>
              <Text style={styles.workerDetails}>
                {`${worker.quantity || 1} jornal${worker.quantity !== 1 ? "es" : ""} × ${formatEuro(worker.daily_wage || 0)}`}
              </Text>
            </View>
            <Text style={styles.workerTotal}>
              {formatEuro(worker.total_cost || 0)}
            </Text>
          </View>
        ))}
        <View style={styles.workersFooter}>
          <Text style={styles.totalLabel}>Total Cuadrilla</Text>
          <Text style={styles.totalValue}>{formatEuro(calculateTotalCost())}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1b1f23",
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 15,
    color: "#607463",
    marginBottom: 24,
  },
  summaryCard: {
    backgroundColor: "#f7f9f5",
    borderRadius: 14,
    padding: 20,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#607463",
    fontWeight: "600",
  },
  summaryValue: {
    fontSize: 14,
    color: "#1b1f23",
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  workersCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
  },
  workersHeader: {
    backgroundColor: "#f8fafc",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  workersTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#1e293b",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  workerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  workerRowLast: {
    borderBottomWidth: 0,
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 4,
  },
  workerDetails: {
    fontSize: 13,
    color: "#64748b",
  },
  workerTotal: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2e7d32",
    marginLeft: 12,
  },
  workersFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: "#f0fdf4",
    borderTopWidth: 2,
    borderTopColor: "#2e7d32",
  },
  totalLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1e293b",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#2e7d32",
  },
});
