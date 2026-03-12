import React from "react";
import { View, StyleSheet, Text } from "react-native";

export default function ActionScreen() {
  return (
    <View style={styles.container}>
      <Text>Acción Rápida</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f9f5", justifyContent: 'center', alignItems: 'center' },
});
