import React from "react";
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { formatEuro } from "../../utils/formatters";

export default function WorkersStep({
  workers,
  filteredWorkers,
  selectedWorkers,
  setSelectedWorkers,
  searchWorker,
  setSearchWorker,
  toggleWorker,
  updateWorkerDetail,
  applyToAll,
  calculateTotalCost,
}) {
  const handleSelectAll = () => {
    const allFilteredSelected = filteredWorkers.every((w) =>
      selectedWorkers.some((sw) => sw.worker_id === w.id)
    );

    if (allFilteredSelected) {
      setSelectedWorkers((prev) =>
        prev.filter((sw) => !filteredWorkers.some((fw) => fw.id === sw.worker_id))
      );
    } else {
      const newSelected = filteredWorkers
        .filter((w) => !selectedWorkers.some((sw) => sw.worker_id === w.id))
        .map((w) => ({
          worker_id: w.id,
          worker_name: w.name,
          quantity: 1,
          extras_qty: 0,
          daily_wage: parseFloat(w.default_daily_wage) || 0,
          extra_price: parseFloat(w.default_extra_price) || 0,
          total_cost: parseFloat(w.default_daily_wage) || 0,
        }));

      setSelectedWorkers((prev) => [...prev, ...newSelected]);
    }
  };

  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Trabajadores</Text>
      <Text style={styles.stepSubtitle}>Activa los trabajadores y completa sus datos</Text>

      {/* Header: Buscador */}
      <View style={styles.selectionHeader}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9ba9a0" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar trabajador..."
            placeholderTextColor="#9ba9a0"
            value={searchWorker}
            onChangeText={setSearchWorker}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchWorker.length > 0 && (
            <TouchableOpacity onPress={() => setSearchWorker("")} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#9ba9a0" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Lista con TODOS los trabajadores (activos e inactivos) */}
      <View style={styles.tableContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>Planilla de Jornales:</Text>
          <TouchableOpacity onPress={handleSelectAll}>
            <Text style={styles.selectAllText}>
              {filteredWorkers.every((w) => selectedWorkers.some((sw) => sw.worker_id === w.id)) &&
              filteredWorkers.length > 0
                ? "Deseleccionar Todos"
                : "Seleccionar Todos"}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Filas de Trabajadores - Diseño vertical más espacioso */}
        {filteredWorkers.map((worker) => {
          const isActive = selectedWorkers.some((w) => w.worker_id === worker.id);
          const workerData =
            selectedWorkers.find((w) => w.worker_id === worker.id) || {
              quantity: 1,
              daily_wage: parseFloat(worker.default_daily_wage) || 0,
              total_cost: parseFloat(worker.default_daily_wage) || 0,
            };

          return (
            <View
              key={worker.id}
              style={[styles.workerCard, !isActive && styles.workerCardInactive]}
            >
              {/* Fila superior: Checkbox + Nombre */}
              <TouchableOpacity
                style={styles.workerCardHeader}
                onPress={() => toggleWorker(worker)}
                activeOpacity={0.7}
              >
                <View style={styles.workerCardLeft}>
                  <View style={[styles.tableCheckbox, isActive && styles.tableCheckboxActive]}>
                    {isActive && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </View>
                  <Text
                    style={[
                      styles.workerName,
                      !isActive && styles.workerNameInactive,
                    ]}
                  >
                    {worker.name}
                  </Text>
                </View>
                {isActive && (
                  <Text
                    style={[
                      styles.workerTotal,
                      !isActive && styles.workerTotalInactive,
                    ]}
                  >
                    {formatEuro(workerData.total_cost || 0)}
                  </Text>
                )}
              </TouchableOpacity>

              {/* Fila inferior: Campos de entrada (solo si está activo) */}
              {isActive && (
                <View style={styles.workerCardDetails}>
                  <View style={styles.detailRow}>
                    <View style={styles.detailField}>
                      <Text style={styles.detailLabel}>Cantidad</Text>
                      <TextInput
                        style={styles.detailInput}
                        value={String(workerData.quantity || 0)}
                        onChangeText={(text) => updateWorkerDetail(worker.id, "quantity", text)}
                        keyboardType="decimal-pad"
                        textAlign="center"
                      />
                    </View>
                    <TouchableOpacity
                      style={styles.copyButton}
                      onPress={() => {
                        if (selectedWorkers.length > 0) {
                          const firstVal = selectedWorkers[0].quantity;
                          Alert.alert(
                            "Copiar Cantidad",
                            `¿Aplicar ${firstVal} a todos?`,
                            [
                              { text: "Cancelar", style: "cancel" },
                              { text: "Aplicar", onPress: () => applyToAll("quantity", firstVal) },
                            ]
                          );
                        }
                      }}
                    >
                      <Ionicons name="copy-outline" size={16} color="#64748b" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.detailRow}>
                    <View style={styles.detailField}>
                      <Text style={styles.detailLabel}>Precio / día</Text>
                      <TextInput
                        style={styles.detailInput}
                        value={String(workerData.daily_wage || 0)}
                        onChangeText={(text) => updateWorkerDetail(worker.id, "daily_wage", text)}
                        keyboardType="decimal-pad"
                        textAlign="center"
                      />
                    </View>
                    <TouchableOpacity
                      style={styles.copyButton}
                      onPress={() => {
                        if (selectedWorkers.length > 0) {
                          const firstVal = selectedWorkers[0].daily_wage;
                          Alert.alert(
                            "Copiar Precio",
                            `¿Aplicar ${formatEuro(firstVal)} a todos?`,
                            [
                              { text: "Cancelar", style: "cancel" },
                              { text: "Aplicar", onPress: () => applyToAll("daily_wage", firstVal) },
                            ]
                          );
                        }
                      }}
                    >
                      <Ionicons name="copy-outline" size={16} color="#64748b" />
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          );
        })}

        {/* Total - Solo trabajadores activos */}
        <View style={styles.tableFooter}>
          <Text style={styles.totalLabel}>
            Total Cuadrilla ({selectedWorkers.length})
          </Text>
          <Text style={styles.totalValue}>{formatEuro(calculateTotalCost())}</Text>
        </View>
      </View>

      {filteredWorkers.length === 0 && (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No se encontraron trabajadores</Text>
        </View>
      )}
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
  selectionHeader: {
    marginBottom: 10,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f7f9f5",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1b1f23",
    padding: 0,
  },
  clearButton: {
    marginLeft: 8,
    padding: 4,
  },
  selectAllText: {
    color: "#2e7d32",
    fontWeight: "600",
    fontSize: 13,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#333",
  },
  tableContainer: {
    marginTop: 6,
  },
  workerCard: {
    backgroundColor: "#fff",
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    marginBottom: 10,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  workerCardInactive: {
    backgroundColor: "#fafbfc",
    borderColor: "#e8eaed",
    borderStyle: "dashed",
  },
  workerCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    paddingBottom: 10,
  },
  workerCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  tableCheckbox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "#cbd5e1",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    marginRight: 10,
  },
  tableCheckboxActive: {
    backgroundColor: "#2e7d32",
    borderColor: "#2e7d32",
  },
  workerName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1e293b",
    flex: 1,
  },
  workerNameInactive: {
    color: "#64748b",
    fontWeight: "500",
  },
  workerTotal: {
    fontSize: 15,
    fontWeight: "700",
    color: "#2e7d32",
    marginLeft: 12,
  },
  workerTotalInactive: {
    color: "#94a3b8",
    fontSize: 14,
  },
  workerCardDetails: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 10,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 10,
    gap: 8,
  },
  detailField: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748b",
    marginBottom: 5,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  detailInput: {
    backgroundColor: "#f7f9f5",
    borderRadius: 8,
    paddingVertical: 9,
    paddingHorizontal: 12,
    fontSize: 15,
    fontWeight: "600",
    borderWidth: 1,
    borderColor: "#d1d5db",
    color: "#1e293b",
    textAlign: "center",
  },
  copyButton: {
    padding: 9,
    borderRadius: 8,
    backgroundColor: "#f7f9f5",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    justifyContent: "center",
    alignItems: "center",
    minWidth: 42,
    height: 42,
  },
  tableFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
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
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#9ba9a0",
    marginTop: 16,
  },
});
