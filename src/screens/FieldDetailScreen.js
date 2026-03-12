import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Modal,
  TextInput,
  Image,
  Alert,
  ActivityIndicator,
  StatusBar,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { dypai } from "../lib/dypai";
import FieldTabs from "../components/FieldsScreen/FieldTabs";
import ResumenTab from "../components/FieldsScreen/ResumenTab";
import RecoleccionTab from "../components/FieldsScreen/RecoleccionTab";
import ActivityTab from "../components/FieldsScreen/ActivityTab";
import DocumentsTab from "../components/FieldsScreen/DocumentsTab";
import TreatmentsTab from "../components/FieldsScreen/TreatmentsTab";
import FinanzasTab from "../components/FieldsScreen/FinanzasTab";
import AnaliticaTab from "../components/FieldsScreen/AnaliticaTab";
import { formatNumber } from "../utils/formatters";

export default function FieldDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const { fieldId } = route.params || {};
  const [field, setField] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isShareModalVisible, setShareModalVisible] = useState(false);
  const [sharedUsers, setSharedUsers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");

  // Cargar datos de la parcela
  useEffect(() => {
    if (fieldId) {
      loadParcela();
      loadParcelMembers();
    }
  }, [fieldId]);

  const loadParcela = async () => {
    try {
      setLoading(true);
      const { data, error } = await dypai.api.get("obtener_parcela_por_id", {
        params: { id: fieldId }
      });
      if (error) throw error;

      const fieldData = Array.isArray(data) ? data[0] : data;

      if (fieldData && fieldData.id) {
        setField(fieldData);
      } else {
        throw new Error("No se encontró la parcela");
      }
    } catch (error) {
      console.error("Error cargando parcela:", error);
      Alert.alert("Error", "No se pudo cargar la información de la parcela");
    } finally {
      setLoading(false);
    }
  };

  const loadParcelMembers = async () => {
    try {
      setLoadingMembers(true);
      const { data, error } = await dypai.api.get("obtener_parcel_members", {
        params: { parcel_id: fieldId }
      });
      if (error) throw error;

      const members = Array.isArray(data) ? data : [];
      
      const transformedMembers = members.map(member => ({
        id: member.id,
        user_id: member.user_id,
        role: member.role || "viewer",
        percentage: member.percentage || 0,
        name: `Usuario ${member.user_id?.substring(0, 8)}`,
        avatar: `https://ui-avatars.com/api/?name=Usuario&background=random`,
      }));
      
      setSharedUsers(transformedMembers);
    } catch (error) {
      console.error("Error cargando miembros:", error);
    } finally {
      setLoadingMembers(false);
    }
  };

  const handleAddUser = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert("Error", "Por favor, introduce un número de teléfono");
      return;
    }
    
    Alert.alert(
      "Funcionalidad en desarrollo",
      "La búsqueda de usuarios por teléfono estará disponible próximamente."
    );
  };

  const handleRemoveUser = async (memberId) => {
    Alert.alert(
      "Eliminar usuario",
      "¿Estás seguro de que deseas dejar de compartir con este usuario?",
      [
        { text: "Cancelar", style: "cancel" },
        { 
          text: "Eliminar", 
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await dypai.api.delete("eliminar_parcel_member", {
                params: { id: memberId }
              });
              if (error) throw error;

              Alert.alert("Éxito", "Usuario eliminado correctamente");
              loadParcelMembers();
            } catch (error) {
              console.error("Error eliminando miembro:", error);
              Alert.alert("Error", error.message || "No se pudo eliminar el usuario");
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>Cargando parcela...</Text>
      </View>
    );
  }

  if (!field) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.title}>No encontramos la parcela</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={18} color="#2e7d32" />
          <Text style={styles.backText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      {/* Header Container */}
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <Ionicons name="chevron-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={styles.headerTitle} numberOfLines={1}>Ficha Técnica</Text>
          <TouchableOpacity style={styles.editButton} activeOpacity={0.7}>
            <Ionicons name="create-outline" size={22} color="#1e293b" />
          </TouchableOpacity>
        </View>

        {/* Field Info - Full Width */}
        <View style={styles.fieldInfoSection}>
          <View style={styles.fieldHeader}>
            <View style={styles.fieldTitleContainer}>
              <Text style={styles.fieldName}>{field.name}</Text>
              <View style={styles.badgeRow}>
                {field.is_leased ? (
                  <View style={styles.leaseBadge}>
                    <Text style={styles.leaseBadgeText}>ARRENDADA</Text>
                  </View>
                ) : (
                  <View style={[styles.leaseBadge, { backgroundColor: '#f0fdf4', borderColor: '#dcfce7' }]}>
                    <Text style={[styles.leaseBadgeText, { color: '#15803d' }]}>PROPIA</Text>
                  </View>
                )}
                <Text style={styles.fieldSubtitle}>
                  {field.crop_type || "Sin cultivo"}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>SUPERFICIE</Text>
              <Text style={styles.statValue}>{formatNumber(field.area_ha)} <Text style={styles.statUnit}>ha</Text></Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statLabel}>FANEGAS</Text>
              <Text style={styles.statValue}>{formatNumber(field.area_fanegas || 0)} <Text style={styles.statUnit}>f</Text></Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <TouchableOpacity onPress={() => setShareModalVisible(true)} style={styles.shareIconButton}>
                <Ionicons name="people" size={20} color="#64748b" />
                <Text style={styles.statLabel}>ACCESO</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.tabsWrapper}>
          <FieldTabs activeTab={activeTab} onTabChange={setActiveTab} />
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "dashboard" && field && <ResumenTab field={field} members={sharedUsers} />}
        {activeTab === "recoleccion" && <RecoleccionTab fieldId={fieldId} isActive={activeTab === "recoleccion"} />}
        {activeTab === "activity" && <ActivityTab fieldId={fieldId} isActive={activeTab === "activity"} />}
        {activeTab === "treatments" && <TreatmentsTab fieldId={fieldId} isActive={activeTab === "treatments"} />}
        {activeTab === "finanzas" && <FinanzasTab fieldId={fieldId} isActive={activeTab === "finanzas"} />}
        {activeTab === "analitica" && <AnaliticaTab fieldId={fieldId} isActive={activeTab === "analitica"} />}
        {activeTab === "documents" && <DocumentsTab fieldId={fieldId} />}
      </ScrollView>

      {/* Modal de Compartir */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isShareModalVisible}
        onRequestClose={() => setShareModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Colaboradores</Text>
                <Text style={styles.modalSubtitle}>Personas con acceso a esta parcela</Text>
              </View>
              <TouchableOpacity onPress={() => setShareModalVisible(false)} style={styles.modalClose}>
                <Ionicons name="close" size={24} color="#1b1f23" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.usersList} showsVerticalScrollIndicator={false}>
              {loadingMembers ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#2e7d32" />
                </View>
              ) : sharedUsers.length === 0 ? (
                <View style={styles.emptyStateContainer}>
                    <Ionicons name="people-outline" size={48} color="#cbd5e1" />
                    <Text style={styles.emptyText}>No has compartido esta parcela todavía.</Text>
                </View>
              ) : (
                sharedUsers.map((user) => (
                  <View key={user.id} style={styles.userItem}>
                    <View style={styles.userInfo}>
                      <Image source={{ uri: user.avatar }} style={styles.userAvatar} />
                      <View>
                        <Text style={styles.userName}>{user.name}</Text>
                        <Text style={styles.userRole}>
                          {user.role === "admin" ? "Administrador" : "Lector"}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity 
                      onPress={() => handleRemoveUser(user.id)}
                      style={styles.removeButton}
                    >
                      <Ionicons name="trash-outline" size={20} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>

            <View style={styles.addSection}>
              <Text style={styles.addLabel}>INVITAR COLABORADOR</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="call-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="600 000 000"
                  keyboardType="phone-pad"
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholderTextColor="#94a3b8"
                />
                <TouchableOpacity 
                  style={[styles.inviteButton, !phoneNumber && styles.inviteButtonDisabled]}
                  onPress={handleAddUser}
                  disabled={!phoneNumber}
                >
                  <Text style={styles.inviteButtonText}>Invitar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  center: { justifyContent: "center", alignItems: "center" },
  headerContainer: {
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderColor: "#f1f5f9",
    zIndex: 10,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  editButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: "#1e293b",
    letterSpacing: -0.5,
  },
  fieldInfoSection: {
    paddingVertical: 24,
    paddingHorizontal: 0,
  },
  fieldHeader: {
    marginBottom: 24,
  },
  fieldTitleContainer: {
    width: "100%",
  },
  fieldName: {
    fontSize: 28,
    fontWeight: "800",
    color: "#1e293b",
    letterSpacing: -1,
    marginBottom: 8,
    lineHeight: 34,
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flexWrap: "wrap",
  },
  leaseBadge: {
    backgroundColor: '#fff7ed',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ffedd5',
  },
  leaseBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#b45309",
    letterSpacing: 0.5,
  },
  fieldSubtitle: {
    color: "#64748b",
    fontSize: 15,
    fontWeight: "600",
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#e2e8f0",
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: "800",
    color: "#94a3b8",
    letterSpacing: 0.8,
    marginBottom: 6,
    textTransform: "uppercase",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1e293b",
    letterSpacing: -0.5,
  },
  statUnit: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "600",
  },
  shareIconButton: {
    alignItems: "center",
  },
  tabsWrapper: {
    marginHorizontal: -20,
    paddingTop: 8,
  },
  content: { padding: 20, paddingBottom: 100 },
  loadingText: {
    marginTop: 16,
    color: "#64748b",
    fontSize: 14,
    fontWeight: "600",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    height: "75%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 32,
  },
  modalClose: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f8fafc",
    justifyContent: "center",
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1e293b",
    letterSpacing: -1,
  },
  modalSubtitle: {
    fontSize: 15,
    color: "#64748b",
    fontWeight: "500",
    marginTop: 4,
  },
  usersList: {
    flex: 1,
    marginBottom: 24,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    borderWidth: 2,
    borderColor: "#fff",
  },
  userName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
  },
  userRole: {
    fontSize: 13,
    color: "#64748b",
    fontWeight: "500",
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#fef2f2",
    justifyContent: "center",
    alignItems: "center",
  },
  emptyStateContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
    gap: 16,
  },
  emptyText: {
    textAlign: "center",
    color: "#94a3b8",
    fontSize: 14,
    fontWeight: "600",
    paddingHorizontal: 40,
  },
  addSection: {
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  addLabel: {
    fontSize: 11,
    fontWeight: "900",
    color: "#94a3b8",
    letterSpacing: 1.5,
    marginBottom: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: "100%",
    fontSize: 16,
    color: "#1e293b",
    fontWeight: "600",
  },
  inviteButton: {
    backgroundColor: "#2e7d32",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginLeft: 8,
  },
  inviteButtonDisabled: {
    backgroundColor: "#94a3b8",
  },
  inviteButtonText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
  },
  loadingContainer: {
    paddingVertical: 40,
  },
});
