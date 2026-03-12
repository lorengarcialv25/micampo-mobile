import React from "react";
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

export default function ParcelaStep({
  parcels,
  selectedParcela,
  setSelectedParcela,
  searchParcela,
  setSearchParcela,
  filteredParcels,
}) {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Selecciona la parcela</Text>
      <Text style={styles.stepSubtitle}>Elige dónde se realizó el trabajo</Text>

      {/* Buscador de parcelas */}
      {parcels.length > 0 && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#9ba9a0" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar parcela por nombre, cultivo..."
            placeholderTextColor="#9ba9a0"
            value={searchParcela}
            onChangeText={setSearchParcela}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchParcela.length > 0 && (
            <TouchableOpacity onPress={() => setSearchParcela("")} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#9ba9a0" />
            </TouchableOpacity>
          )}
        </View>
      )}

      {parcels.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="map-outline" size={48} color="#9ba9a0" />
          <Text style={styles.emptyText}>No hay parcelas disponibles</Text>
          <Text style={styles.emptySubtext}>
            Crea una parcela primero desde la sección Parcelas
          </Text>
        </View>
      ) : filteredParcels.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="map-search-outline" size={48} color="#9ba9a0" />
          <Text style={styles.emptyText}>No se encontraron parcelas</Text>
          <Text style={styles.emptySubtext}>Intenta con otro término de búsqueda</Text>
        </View>
      ) : (
        filteredParcels.map((parcela) => (
          <TouchableOpacity
            key={parcela.id}
            style={[
              styles.optionCard,
              selectedParcela?.id === parcela.id && styles.optionCardSelected,
            ]}
            onPress={() => setSelectedParcela(parcela)}
          >
            <View style={styles.optionCardContent}>
              <View style={styles.optionCardLeft}>
                <MaterialCommunityIcons
                  name="map-marker"
                  size={24}
                  color={selectedParcela?.id === parcela.id ? "#2e7d32" : "#607463"}
                />
                <View style={styles.optionCardText}>
                  <Text style={styles.optionCardTitle}>{parcela.name}</Text>
                  <Text style={styles.optionCardSubtitle}>
                    {parcela.crop_type || "Sin cultivo"}
                    {parcela.area_ha ? ` · ${parcela.area_ha} ha` : ""}
                  </Text>
                </View>
              </View>
              {selectedParcela?.id === parcela.id && (
                <Ionicons name="checkmark-circle" size={24} color="#2e7d32" />
              )}
            </View>
          </TouchableOpacity>
        ))
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f7f9f5",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
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
  optionCard: {
    backgroundColor: "#f7f9f5",
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  optionCardSelected: {
    borderColor: "#2e7d32",
    backgroundColor: "#e8f5e9",
  },
  optionCardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  optionCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  optionCardText: {
    marginLeft: 12,
    flex: 1,
  },
  optionCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1b1f23",
  },
  optionCardSubtitle: {
    fontSize: 14,
    color: "#607463",
    marginTop: 2,
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
  emptySubtext: {
    fontSize: 14,
    color: "#b0bec5",
    marginTop: 8,
    textAlign: "center",
  },
});
