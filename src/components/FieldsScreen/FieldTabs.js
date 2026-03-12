import React from "react";
import { View, StyleSheet, ScrollView, TouchableOpacity, Text } from "react-native";

export default function FieldTabs({ activeTab, onTabChange }) {
  const tabs = [
    { id: "dashboard", label: "Resumen" },
    { id: "recoleccion", label: "Recolección" },
    { id: "activity", label: "Trabajos" },
    { id: "treatments", label: "Tratamientos" },
    { id: "finanzas", label: "Finanzas" },
    { id: "analitica", label: "Analítica" },
    { id: "documents", label: "Docs" },
  ];

  return (
    <View style={styles.container}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => onTabChange(tab.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.label}
              </Text>
              {isActive && <View style={styles.activeIndicator} />}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
  },
  scrollContent: {
    paddingHorizontal: 4,
    paddingBottom: 4,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
    borderRadius: 12,
    backgroundColor: "transparent",
    alignItems: "center",
  },
  tabActive: {
    backgroundColor: "transparent",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#94a3b8",
  },
  tabTextActive: {
    color: "#2e7d32",
    fontWeight: "800",
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 20,
    height: 3,
    backgroundColor: "#2e7d32",
    borderRadius: 2,
  }
});
