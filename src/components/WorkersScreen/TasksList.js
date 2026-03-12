import React from 'react';
import { View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TaskCard from './TaskCard';

const TasksList = ({ tasks }) => {
  if (!tasks || tasks.length === 0) {
    return (
      <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 60 }}>
        <Ionicons name="clipboard-outline" size={48} color="#cbd5e1" />
        <Text style={{ fontSize: 16, fontWeight: "800", color: "#1b1f23", marginTop: 16 }}>No hay tareas</Text>
        <Text style={{ fontSize: 13, color: "#94a3b8", marginTop: 6, textAlign: "center", fontWeight: "500" }}>Las tareas aparecerán aquí cuando se creen</Text>
      </View>
    );
  }

  return (
    <>
      <Text style={{ fontSize: 13, fontWeight: "900", color: "#64748b", textTransform: "uppercase", letterSpacing: 1, marginBottom: 16 }}>Tareas ({tasks.length})</Text>
      {tasks.map((t) => (
        <TaskCard key={t.id} task={t} />
      ))}
    </>
  );
};

export default TasksList;
