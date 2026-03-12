import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function AddWorkHeader({ onBack, isEdit }) {
  return (
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
        <Ionicons name="close" size={26} color="#1b1f23" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
        <Text style={styles.headerTitle}>{isEdit ? "Editar Trabajo" : "Nuevo Trabajo"}</Text>
      </View>
      <View style={{ width: 44 }} /> 
      </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: "#fff",
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1b1f23",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
