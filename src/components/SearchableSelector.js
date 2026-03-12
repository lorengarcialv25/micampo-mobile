import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import BottomSheet from "./BottomSheet";

export function SearchableSelectorContent({
  items,
  onSelect,
  onClose,
  placeholder = "Buscar...",
  selectedId,
  renderItem,
  loading = false,
  onCreateNew,
}) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredItems = useMemo(() => {
    let result = items;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = items.filter((item) => {
        const label = item.name || item.label || item.toString();
        return label.toLowerCase().includes(query);
      });
    }
    return result;
  }, [items, searchQuery]);

  const showCreateOption = useMemo(() => {
    if (!onCreateNew || !searchQuery.trim()) return false;
    const exactMatch = items.find(item => 
      (item.name || item.label || item.toString()).toLowerCase() === searchQuery.toLowerCase().trim()
    );
    return !exactMatch;
  }, [onCreateNew, searchQuery, items]);

  const defaultRenderItem = ({ item }) => {
    const isSelected = selectedId === (item.id || item);
    const label = item.name || item.label || item.toString();

    return (
      <TouchableOpacity
        style={[styles.item, isSelected && styles.itemSelected]}
        onPress={() => {
          onSelect(item);
          if (onClose) onClose();
          setSearchQuery("");
        }}
      >
        <View style={styles.itemContent}>
          {item.icon && (
            <View style={[styles.iconBox, { backgroundColor: item.color ? `${item.color}15` : "#f1f5f9" }]}>
              <Ionicons name={item.icon} size={20} color={item.color || "#64748b"} />
            </View>
          )}
          <Text style={[styles.itemText, isSelected && styles.itemTextSelected]}>
            {label}
          </Text>
        </View>
        {isSelected && (
          <Ionicons name="checkmark-circle" size={22} color="#2e7d32" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <Ionicons name="search-outline" size={20} color="#94a3b8" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder={placeholder}
          placeholderTextColor="#94a3b8"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCorrect={false}
        />
        {searchQuery !== "" && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={18} color="#cbd5e1" />
          </TouchableOpacity>
        )}
      </View>

      {showCreateOption && (
        <TouchableOpacity 
          style={styles.createOption}
          onPress={() => {
            onCreateNew(searchQuery.trim());
            if (onClose) onClose();
            setSearchQuery("");
          }}
        >
          <View style={styles.createIconBox}>
            <Ionicons name="add-circle-outline" size={24} color="#2e7d32" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.createLabel}>CREAR NUEVO</Text>
            <Text style={styles.createValue}>"{searchQuery.trim()}"</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#2e7d32" />
        </TouchableOpacity>
      )}

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#2e7d32" />
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item, index) => (item.id || index).toString()}
          renderItem={renderItem || defaultRenderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={48} color="#e2e8f0" />
              <Text style={styles.emptyText}>No se encontraron resultados</Text>
            </View>
          }
        />
      )}
    </View>
  );
}

export default function SearchableSelector({
  visible,
  onClose,
  title = "Seleccionar",
  ...contentProps
}) {
  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title={title}
    >
      <SearchableSelectorContent {...contentProps} onClose={onClose} />
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginVertical: 16,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#1e293b",
    fontWeight: "500",
  },
  list: {
    paddingBottom: 40,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#f1f5f9",
  },
  itemSelected: {
    // backgroundColor: "#f8fafc",
  },
  itemContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  itemText: {
    fontSize: 16,
    color: "#1e293b",
    fontWeight: "500",
  },
  itemTextSelected: {
    color: "#2e7d32",
    fontWeight: "700",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  empty: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 15,
    color: "#94a3b8",
    fontWeight: "500",
  },
  createOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ecfdf5",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#d1fae5",
  },
  createIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  createLabel: {
    fontSize: 10,
    fontWeight: "900",
    color: "#059669",
    letterSpacing: 1,
  },
  createValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#065f46",
    marginTop: 2,
  },
});

