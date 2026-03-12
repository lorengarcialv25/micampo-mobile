import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Platform,
  StatusBar,
  Modal,
  ActivityIndicator,
  Alert,
  TextInput,
  RefreshControl,
  Pressable,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useCrew } from "../context/CrewContext";
import WorkerFormModal from "../components/WorkerFormModal";
import Toast from "../components/Toast";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { dypai } from "../lib/dypai";
import { useAuth } from "../context/AuthContext";
import { getReducedSafeAreaTop } from "../utils/layout";

export default function CrewScreen({ onClose }) {
  const { closeCrewModal } = useCrew();
  const navigation = useNavigation();
  const { isAuthenticated } = useAuth();
  const insets = useSafeAreaInsets();
  const [workers, setWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [formModalVisible, setFormModalVisible] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);
  const [confirmWorker, setConfirmWorker] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [toastType, setToastType] = useState("success");

  // Cargar trabajadores desde la API
  useEffect(() => {
    if (isAuthenticated) {
      loadWorkers(false);
    }
  }, [isAuthenticated]);

  const loadWorkers = async (isRefresh = false) => {
    try {
      if (!isRefresh) {
        setLoading(true);
      }
      const { data, error } = await dypai.api.get('obtener_workers', {
        params: { sort_by: 'name', order: 'ASC' }
      });
      if (error) throw error;
      const workersData = data || [];
      setWorkers(workersData);
    } catch (error) {
      console.error('Error cargando trabajadores:', error);
      Alert.alert("Error", "No se pudieron cargar los trabajadores");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadWorkers(true);
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      closeCrewModal();
    }
  };

  const handleAdd = () => {
    setEditingWorker(null);
    setFormModalVisible(true);
  };

  const handleEdit = (worker) => {
    setEditingWorker(worker);
    setFormModalVisible(true);
  };

  const handleDelete = (worker) => {
    setConfirmWorker(worker);
  };

  const confirmDelete = async () => {
    if (!confirmWorker) return;

    try {
      const { error } = await dypai.api.delete('eliminar_worker', { id: confirmWorker.id });
      if (error) throw error;
      
      // Recargar lista después de eliminar
      await loadWorkers(false);
      setConfirmWorker(null);
      Alert.alert("Éxito", "Trabajador eliminado correctamente");
    } catch (error) {
      console.error('Error eliminando trabajador:', error);
      Alert.alert("Error", "No se pudo eliminar el trabajador");
    }
  };

  const cancelDelete = () => {
    setConfirmWorker(null);
  };

  const handleSave = async (workerData) => {
    try {
      // Cerrar el modal inmediatamente para ver el trabajador
      setFormModalVisible(false);
      setEditingWorker(null);

      if (editingWorker) {
        // Editar trabajador existente
        const { error } = await dypai.api.put('actualizar_worker', {
          id: editingWorker.id,
          name: workerData.name,
          phone: workerData.phone || null,
          email: workerData.email || null,
          default_daily_wage: workerData.default_daily_wage || null,
          hourly_rate: workerData.hourly_rate || null,
          specialty: workerData.specialty || null,
          observations: workerData.observations || null,
          payment_method: workerData.payment_method || 'daily',
        });
        if (error) throw error;
        setToastMessage("Trabajador actualizado correctamente");
      } else {
        // Crear nuevo trabajador
        const { error } = await dypai.api.post('crear_worker', {
          name: workerData.name,
          phone: workerData.phone || null,
          email: workerData.email || null,
          default_daily_wage: workerData.default_daily_wage || null,
          hourly_rate: workerData.hourly_rate || null,
          specialty: workerData.specialty || null,
          observations: workerData.observations || null,
          payment_method: workerData.payment_method || 'daily',
        });
        if (error) throw error;
        setToastMessage("Trabajador creado correctamente");
      }
      
      // Recargar lista después de guardar
      await loadWorkers(false);
      
      // Mostrar toast de éxito
      setToastType("success");
      setToastVisible(true);
    } catch (error) {
      console.error('Error guardando trabajador:', error);
      setToastType("error");
      setToastMessage(editingWorker ? "No se pudo actualizar el trabajador" : "No se pudo crear el trabajador");
      setToastVisible(true);
    }
  };

  const formatRate = (rate) => {
    if (!rate || rate === 0) return "Sin precio definido";
    return `${rate} € / jornada`;
  };

  // Filtrar trabajadores por búsqueda
  const filteredWorkers = useMemo(() => {
    if (!searchQuery.trim()) {
      return workers;
    }
    const query = searchQuery.toLowerCase().trim();
    return workers.filter((worker) =>
      worker.name?.toLowerCase().includes(query)
    );
  }, [workers, searchQuery]);

  const renderItem = ({ item }) => (
    <TouchableOpacity 
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#f1f5f9"
      }}
      onPress={() => {
        handleClose();
        navigation.navigate("WorkerDetail", { workerId: item.id, workerName: item.name });
      }}
      activeOpacity={0.6}
    >
      <View style={{
        width: 44,
        height: 44,
        borderRadius: 14,
        backgroundColor: "#f1f5f9",
        justifyContent: "center",
        alignItems: "center",
        marginRight: 16
      }}>
        <MaterialCommunityIcons name="account" size={24} color="#2e7d32" />
      </View>
      
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: "800", color: "#1e293b", marginBottom: 6, textTransform: "uppercase", letterSpacing: -0.5 }}>
          {item.name}
        </Text>
        <View style={{ gap: 4 }}>
          {item.email ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name="mail-outline" size={14} color="#94a3b8" />
              <Text style={{ fontSize: 13, color: "#64748b", fontWeight: "600" }} numberOfLines={1}>
                {item.email}
              </Text>
            </View>
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name="mail-outline" size={14} color="#cbd5e1" />
              <Text style={{ fontSize: 13, color: "#cbd5e1", fontWeight: "600" }}>
                Sin correo
              </Text>
            </View>
          )}
          {item.phone ? (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name="call-outline" size={14} color="#94a3b8" />
              <Text style={{ fontSize: 13, color: "#64748b", fontWeight: "600" }}>
                {item.phone}
              </Text>
            </View>
          ) : (
            <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              <Ionicons name="call-outline" size={14} color="#cbd5e1" />
              <Text style={{ fontSize: 13, color: "#cbd5e1", fontWeight: "600" }}>
                Sin teléfono
              </Text>
            </View>
          )}
        </View>
      </View>
      
      <View style={{ alignItems: "flex-end", marginLeft: 12 }}>
        <View style={{ alignItems: "flex-end", marginBottom: 4 }}>
          <Text style={{ fontSize: 14, fontWeight: "800", color: "#1e293b" }}>
            {item.hourly_rate || "0"}€
          </Text>
          <Text style={{ fontSize: 10, fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>
            / hora
          </Text>
        </View>
        <View style={{ alignItems: "flex-end", marginTop: 4 }}>
          <Text style={{ fontSize: 14, fontWeight: "800", color: "#1e293b" }}>
            {item.default_daily_wage || "0"}€
          </Text>
          <Text style={{ fontSize: 10, fontWeight: "700", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.5 }}>
            / jornal
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Header personalizado con botón de atrás */}
      <View style={[styles.header, { paddingTop: getReducedSafeAreaTop(insets.top) }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleClose}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color="#1b1f23" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Cuadrilla</Text>
            <Text style={styles.headerSubtitle}>Gestiona tus trabajadores</Text>
          </View>
          <View style={styles.headerSpacer} />
        </View>
      </View>

      {/* Header con contador y botón añadir */}
      <View style={styles.headerRow}>
        <Text style={styles.sectionTitle}>
          Trabajadores ({filteredWorkers.length}{searchQuery ? ` de ${workers.length}` : ""})
        </Text>
        <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
          <Ionicons name="add" size={18} color="#fff" />
          <Text style={styles.addText}>Añadir</Text>
        </TouchableOpacity>
      </View>

      {/* Barra de búsqueda */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={20} color="#9CA3AF" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por nombre..."
            placeholderTextColor="#9CA3AF"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery("")}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {loading ? (
        <View style={styles.emptyState}>
          <ActivityIndicator size="large" color="#2e7d32" />
          <Text style={styles.emptyText}>Cargando trabajadores...</Text>
        </View>
      ) : filteredWorkers.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons 
            name={searchQuery ? "search-outline" : "people-outline"} 
            size={64} 
            color="#ccc" 
          />
          <Text style={styles.emptyText}>
            {searchQuery ? "No se encontraron trabajadores" : "No hay trabajadores"}
          </Text>
          <Text style={styles.emptySubtext}>
            {searchQuery 
              ? "Intenta con otro nombre de búsqueda"
              : "Añade tu primer trabajador para empezar"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredWorkers}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#2e7d32"
              colors={["#2e7d32"]}
            />
          }
        />
      )}

      {/* Modal de formulario */}
      <WorkerFormModal
        visible={formModalVisible}
        onClose={() => {
          setFormModalVisible(false);
          setEditingWorker(null);
        }}
        worker={editingWorker}
        onSave={handleSave}
      />

      {/* Confirmación de borrado */}
      <Modal
        transparent
        animationType="fade"
        visible={!!confirmWorker}
        onRequestClose={cancelDelete}
      >
        <View style={styles.confirmOverlay}>
          <View style={styles.confirmCard}>
            <View style={styles.confirmHeader}>
              <Ionicons name="warning-outline" size={24} color="#c62828" />
              <Text style={styles.confirmTitle}>Eliminar trabajador</Text>
            </View>
            <Text style={styles.confirmMessage}>
              {`¿Seguro que quieres eliminar a ${confirmWorker?.name}? Esta acción no se puede deshacer.`}
            </Text>
            <View style={styles.confirmActions}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.confirmCancel]}
                onPress={cancelDelete}
              >
                <Text style={styles.confirmCancelText}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, styles.confirmDelete]}
                onPress={confirmDelete}
              >
                <Text style={styles.confirmDeleteText}>Eliminar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Toast personalizado */}
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHide={() => setToastVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: "#fff" 
  },
  header: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 60,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0f172a",
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 10,
    color: "#64748b",
    fontWeight: "800",
    textTransform: "uppercase",
    marginTop: 0,
    letterSpacing: 1,
  },
  headerSpacer: {
    width: 32,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#f8fafc",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#1e293b",
    fontWeight: "500",
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  headerRow: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 0,
    paddingBottom: 120,
  },
  sectionTitle: { fontSize: 13, fontWeight: "900", color: "#64748b", textTransform: "uppercase", letterSpacing: 1 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1e293b",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addText: { color: "#fff", fontWeight: "800", marginLeft: 6, fontSize: 12, textTransform: "uppercase" },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0f172a",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 8,
    textAlign: "center",
    fontWeight: "500",
  },
  confirmOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  confirmCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    width: "100%",
    maxWidth: 380,
  },
  confirmHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0f172a",
  },
  confirmMessage: {
    fontSize: 15,
    color: "#64748b",
    marginBottom: 24,
    lineHeight: 22,
    fontWeight: "500",
  },
  confirmActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  confirmButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  confirmCancel: {
    backgroundColor: "#f1f5f9",
  },
  confirmDelete: {
    backgroundColor: "#ef4444",
  },
  confirmCancelText: {
    color: "#64748b",
    fontWeight: "800",
  },
  confirmDeleteText: {
    color: "#fff",
    fontWeight: "800",
  },
});
