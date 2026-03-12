import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function SectionCard({ label, value, note }) {
  return (
    <View style={styles.card}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {note ? <Text style={styles.note}>{note}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#d6e2d1",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  label: {
    color: "#607463",
    fontSize: 13,
    marginBottom: 6,
  },
  value: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1b1f23",
  },
  note: {
    marginTop: 8,
    color: "#607463",
    fontSize: 12,
  },
});

