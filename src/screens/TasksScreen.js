import React from "react";
import { ScrollView, View, StyleSheet, Text } from "react-native";
import TopBar from "../components/TopBar";

const tasks = [
  { title: "Riego Lote Norte", time: "08:00" },
  { title: "Fertilización Lote Sur", time: "11:30" },
  { title: "Muestreo de suelo", time: "15:00" },
];

export default function TasksScreen() {
  return (
    <View style={styles.container}>
      <TopBar title="Tareas" actionLabel="Nueva" onActionPress={() => {}} />
      <ScrollView contentContainerStyle={styles.content}>
        {tasks.map((task) => (
          <View key={task.title} style={styles.taskCard}>
            <Text style={styles.taskTitle}>{task.title}</Text>
            <Text style={styles.taskMeta}>{task.time}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f7f9f5" },
  content: { padding: 20, paddingBottom: 40 },
  taskCard: {
    backgroundColor: "#ffffff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "#d6e2d1",
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1b1f23",
    marginBottom: 6,
  },
  taskMeta: {
    color: "#607463",
  },
});

