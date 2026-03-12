import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import BottomSheet from "./BottomSheet";

export default function ActionBottomSheet({ visible, onClose, onAction }) {
  const navigation = useNavigation();

  const handleAction = (actionType) => {
    onClose();
    
    // Pequeño delay para que el bottom sheet se cierre suavemente
    setTimeout(() => {
      if (actionType === "trabajo") {
        navigation.navigate("ActionsStack", { screen: "AddWork" });
      } else if (actionType === "tratamiento") {
        navigation.navigate("ActionsStack", { screen: "AddTreatment" });
      } else if (actionType === "albaran") {
        navigation.navigate("ActionsStack", { screen: "AddAlbaran" });
      } else if (actionType === "transaccion" || actionType === "gasto") {
        navigation.navigate("ActionsStack", { screen: "AddExpense" });
      } else if (actionType === "parcela") {
        navigation.navigate("ActionsStack", { screen: "AddParcel" });
      }
    }, 300);
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Acciones Rápidas"
      showHandle={true}
      snapPoints={["70%"]}
    >
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionLabel}>REGISTRO MANUAL</Text>
        </View>

        {/* GASTOS E INGRESOS - EL MÁS IMPORTANTE PARA ESTE FLUJO */}
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleAction("transaccion")}
          activeOpacity={0.7}
        >
          <View style={[styles.iconContainer, { backgroundColor: "#e8f5e9" }]}>
            <Ionicons name="wallet-outline" size={22} color="#2e7d32" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.actionTitle}>Gasto o Ingreso</Text>
            <Text style={styles.actionSubtitle}>Facturas, tickets y ventas</Text>
          </View>
          <Ionicons name="add-circle-outline" size={22} color="#2e7d32" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleAction("trabajo")}
          activeOpacity={0.7}
        >
          <View style={[styles.iconContainer, { backgroundColor: "#f8fafc" }]}>
            <MaterialCommunityIcons name="hard-hat" size={22} color="#64748b" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.actionTitle}>Añadir Trabajo</Text>
            <Text style={styles.actionSubtitle}>Jornales y tareas diarias</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleAction("tratamiento")}
          activeOpacity={0.7}
        >
          <View style={[styles.iconContainer, { backgroundColor: "#f8fafc" }]}>
            <MaterialCommunityIcons name="flask-outline" size={22} color="#64748b" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.actionTitle}>Tratamiento</Text>
            <Text style={styles.actionSubtitle}>Aplicación fitosanitaria</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleAction("albaran")}
          activeOpacity={0.7}
        >
          <View style={[styles.iconContainer, { backgroundColor: "#f8fafc" }]}>
            <MaterialCommunityIcons name="truck-delivery-outline" size={22} color="#64748b" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.actionTitle}>Albarán de Cosecha</Text>
            <Text style={styles.actionSubtitle}>Entrada de productos</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleAction("parcela")}
          activeOpacity={0.7}
        >
          <View style={[styles.iconContainer, { backgroundColor: "#f8fafc" }]}>
            <Ionicons name="location-outline" size={22} color="#64748b" />
          </View>
          <View style={styles.textContainer}>
            <Text style={styles.actionTitle}>Nueva Parcela</Text>
            <Text style={styles.actionSubtitle}>Registrar nuevo terreno</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color="#cbd5e1" />
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingTop: 8,
  },
  sectionHeader: {
    marginBottom: 16,
    paddingLeft: 4,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#94a3b8",
    letterSpacing: 1,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
  },
});
