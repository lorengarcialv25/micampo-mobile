import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { formatEuro } from '../../utils/formatters';

const TASK_ICONS = {
  poda: { icon: "tree", color: "#2e7d32", bg: "#e8f5e9" },
  recoleccion: { icon: "basket", color: "#e67e22", bg: "#fef5e7" },
  tratamiento: { icon: "spray", color: "#3498db", bg: "#ebf5fb" },
  riego: { icon: "water", color: "#2980b9", bg: "#eaf2f8" },
  otros: { icon: "tools", color: "#64748b", bg: "#f1f5f9" },
};

const TaskCard = ({ task }) => {
  const navigation = useNavigation();
  
  if (!task) return null;
  
  const handlePress = () => {
    navigation.navigate('TaskDetail', { taskId: task.id });
  };

  // Determinar el icono basado en el concepto o tipo de tarea
  const conceptLower = (task.concept || '').toLowerCase();
  const taskType = task.task_type || '';
  let taskStyle = TASK_ICONS.otros;
  
  // Buscar el icono por tipo de tarea o concepto
  if (taskType && TASK_ICONS[taskType]) {
    taskStyle = TASK_ICONS[taskType];
  } else if (conceptLower.includes('poda')) {
    taskStyle = TASK_ICONS.poda;
  } else if (conceptLower.includes('recoleccion') || conceptLower.includes('recolección')) {
    taskStyle = TASK_ICONS.recoleccion;
  } else if (conceptLower.includes('tratamiento')) {
    taskStyle = TASK_ICONS.tratamiento;
  } else if (conceptLower.includes('riego')) {
    taskStyle = TASK_ICONS.riego;
  }
  
  return (
    <TouchableOpacity 
      style={{ 
        flexDirection: "row", 
        alignItems: "flex-start", 
        paddingVertical: 14, 
        borderBottomWidth: 1, 
        borderBottomColor: "#f1f5f9" 
      }}
      onPress={handlePress}
      activeOpacity={0.6}
    >
      <View style={{ 
        width: 36, 
        height: 36, 
        borderRadius: 10, 
        backgroundColor: taskStyle.bg, 
        justifyContent: "center", 
        alignItems: "center", 
        marginRight: 12,
        marginTop: 2
      }}>
        <MaterialCommunityIcons name={taskStyle.icon} size={18} color={taskStyle.color} />
      </View>
      
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 15, fontWeight: "800", color: "#1e293b", marginBottom: 4, textTransform: "uppercase" }}>
          {task.concept || 'Tarea'}
        </Text>
        
        {/* Badges de tipos de tarea */}
        {task.task_types && task.task_types.length > 0 && (
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, marginBottom: 6 }}>
            {task.task_types.map((type, index) => (
              <View key={index} style={{ 
                backgroundColor: "#f1f5f9", 
                paddingHorizontal: 6, 
                paddingVertical: 2, 
                borderRadius: 4,
                borderWidth: 1,
                borderColor: "#e2e8f0"
              }}>
                <Text style={{ fontSize: 9, fontWeight: "800", color: "#64748b", textTransform: "uppercase" }}>
                  {type}
                </Text>
              </View>
            ))}
          </View>
        )}
        
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 4, flexWrap: "wrap" }}>
          <Text style={{ fontSize: 12, color: "#94a3b8", fontWeight: "600" }}>
            {task.date}
          </Text>
          <Text style={{ fontSize: 12, color: "#cbd5e1", fontWeight: "500" }}>•</Text>
          <Text style={{ fontSize: 12, color: "#94a3b8", fontWeight: "600" }} numberOfLines={1}>
            {task.parcela}
        </Text>
        </View>
      </View>
      
      <View style={{ alignItems: "flex-end", marginLeft: 8 }}>
        {task.is_paid && (
          <View style={{ 
            flexDirection: 'row', 
            alignItems: 'center', 
            backgroundColor: '#e8f5e9', 
            paddingHorizontal: 6, 
            paddingVertical: 2, 
            borderRadius: 4,
            marginBottom: 4,
            gap: 2
          }}>
            <Ionicons name="checkmark-done" size={10} color="#2e7d32" />
            <Text style={{ fontSize: 9, fontWeight: "800", color: "#2e7d32" }}>PAGADO</Text>
          </View>
        )}
        {task.cost > 0 && (
          <Text style={{ fontSize: 16, fontWeight: "800", color: task.is_paid ? "#2e7d32" : "#1b1f23", marginBottom: 4 }}>
            {formatEuro(task.cost)}
          </Text>
        )}
        {task.workersCount > 0 && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <Ionicons name="people-outline" size={12} color="#64748b" />
            <Text style={{ fontSize: 11, fontWeight: "700", color: "#64748b" }}>
              {task.workersCount} {task.workersCount === 1 ? 'pers.' : 'pers.'}
        </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default TaskCard;
