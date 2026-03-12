import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar, Modal, FlatList, TouchableWithoutFeedback, Image, Alert, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCampaign } from "../context/CampaignContext";
import { formatDateFull } from "../utils/formatters";
import { getReducedSafeAreaTop } from "../utils/layout";

// DateTimePicker solo para iOS/Android, no para web
let DateTimePicker;
if (Platform.OS !== 'web') {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
}

// Función helper para formatear fecha a YYYY-MM-DD
const formatDateToAPI = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function TopBar({ 
  title, // Se ignora, se usa del contexto
  subtitle, 
  onSettingsPress,
  actionLabel, 
  onActionPress 
}) {
  const insets = useSafeAreaInsets();
  const [modalVisible, setModalVisible] = useState(false);
  const [newCampaignModalVisible, setNewCampaignModalVisible] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  
  const { currentCampaign, campaignList, changeCampaign, createCampaign, loading } = useCampaign();

  const handleSelectCampaign = async (campaignId, campaignName) => {
    await changeCampaign(campaignId, campaignName);
    setModalVisible(false);
  };

  const handleNewCampaign = () => {
    setModalVisible(false);
    setNewCampaignModalVisible(true);
  };

  const handleStartDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowStartDatePicker(false);
      if (event.type === 'dismissed') {
        return;
      }
    }
    
    if (selectedDate) {
      setStartDate(selectedDate);
      // Si la fecha de inicio es posterior a la de fin, ajustar la fecha de fin
      if (selectedDate > endDate) {
        setEndDate(selectedDate);
      }
    }
    
    // En iOS, solo cerrar si el usuario presiona "done" o "cancel"
    if (Platform.OS === 'ios' && event.type === 'set') {
      setShowStartDatePicker(false);
    }
  };

  const handleEndDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowEndDatePicker(false);
      if (event.type === 'dismissed') {
        return;
      }
    }
    
    if (selectedDate) {
      // Asegurar que la fecha de fin no sea anterior a la de inicio
      if (selectedDate >= startDate) {
        setEndDate(selectedDate);
      } else {
        Alert.alert("Error", "La fecha de fin debe ser posterior a la fecha de inicio");
        return;
      }
    }
    
    // En iOS, solo cerrar si el usuario presiona "done" o "cancel"
    if (Platform.OS === 'ios' && event.type === 'set') {
      setShowEndDatePicker(false);
    }
  };

  const handleCreateCampaign = async () => {
    if (!newCampaignName.trim()) {
      Alert.alert("Error", "Por favor ingresa el nombre de la campaña");
      return;
    }

    try {
      const campaign = await createCampaign(
        newCampaignName.trim(),
        formatDateToAPI(startDate),
        formatDateToAPI(endDate)
      );
      
      // Activar la nueva campaña
      await changeCampaign(campaign.id, campaign.name);
      
      setNewCampaignModalVisible(false);
      setNewCampaignName('');
      setStartDate(new Date());
      setEndDate(new Date());
      setShowStartDatePicker(false);
      setShowEndDatePicker(false);
      Alert.alert("Éxito", "Campaña creada correctamente");
    } catch (error) {
      Alert.alert("Error", "No se pudo crear la campaña. Intenta de nuevo.");
      console.error('Error creando campaña:', error);
    }
  };

  return (
    <>
      <View style={[styles.wrapper, { paddingTop: getReducedSafeAreaTop(insets.top) }]}>
        
        <View style={styles.container}>
          <View style={styles.leftContainer}>
            {subtitle && (
              <View style={styles.subtitleContainer}>
                <Image 
                  source={require('../../agroapp-logo.png')} 
                  style={styles.logoSmall}
                  resizeMode="contain"
                />
                <Text style={styles.subtitle}>{subtitle}</Text>
              </View>
            )}
            
            {/* Título Clickable (Selector) */}
            <TouchableOpacity 
              style={styles.titleContainer} 
              onPress={() => setModalVisible(true)}
              activeOpacity={0.6}
              disabled={loading}
            >
              <Text style={styles.title}>{loading ? 'Cargando...' : (currentCampaign || 'Sin campaña')}</Text>
              <View style={styles.chevronBox}>
                <Ionicons name="chevron-down" size={14} color="#ffffff" />
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.rightContainer}>
            {/* Botón de Ajustes */}
            <TouchableOpacity 
              onPress={onSettingsPress} 
              style={styles.settingsBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="settings-outline" size={22} color="#ffffff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Modal del Selector de Campaña */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setModalVisible(false)}
        >
          {/* Posicionamos el menú cerca de la cabecera */}
          <View style={styles.dropdownMenu}>
            <Text style={styles.menuHeader}>Seleccionar Campaña</Text>
            
            {loading ? (
              <Text style={styles.loadingText}>Cargando campañas...</Text>
            ) : campaignList.length === 0 ? (
              <Text style={styles.emptyText}>No hay campañas disponibles</Text>
            ) : (
              campaignList.map((camp) => (
              <TouchableOpacity 
                key={camp.id} 
                style={styles.menuItem}
                  onPress={() => handleSelectCampaign(camp.id, camp.name)}
              >
                <Text style={[
                  styles.menuItemText, 
                    camp.active && styles.activeItemText
                ]}>
                  {camp.name}
                </Text>
                  {camp.active && (
                  <Ionicons name="checkmark" size={18} color="#2e7d32" />
                )}
              </TouchableOpacity>
              ))
            )}

            <View style={styles.separator} />

            <TouchableOpacity 
              style={styles.newCampaignBtn}
              onPress={handleNewCampaign}
            >
              <View style={styles.plusIconBox}>
                <Ionicons name="add" size={16} color="#fff" />
              </View>
              <Text style={styles.newCampaignText}>Nueva Campaña</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal para crear nueva campaña */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={newCampaignModalVisible}
        onRequestClose={() => setNewCampaignModalVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay} 
          activeOpacity={1} 
          onPress={() => setNewCampaignModalVisible(false)}
        >
          <TouchableOpacity activeOpacity={1} onPress={(e) => e.stopPropagation()}>
            <View style={styles.newCampaignModal}>
              <Text style={styles.newCampaignModalTitle}>Nueva Campaña</Text>
              
              <Text style={styles.inputLabel}>Nombre (ej: 24-25)</Text>
              <TextInput
                style={styles.input}
                placeholder="24-25"
                value={newCampaignName}
                onChangeText={setNewCampaignName}
                autoCapitalize="none"
              />

              <Text style={styles.inputLabel}>Fecha de inicio</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowStartDatePicker(true)}
              >
                <Text style={styles.dateInputText}>
                  {formatDateFull(startDate)}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#2e7d32" />
              </TouchableOpacity>

              <Text style={styles.inputLabel}>Fecha de fin</Text>
              <TouchableOpacity
                style={styles.dateInput}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Text style={styles.dateInputText}>
                  {formatDateFull(endDate)}
                </Text>
                <Ionicons name="calendar-outline" size={20} color="#2e7d32" />
              </TouchableOpacity>

              <View style={styles.modalButtons}>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setNewCampaignModalVisible(false);
                    setNewCampaignName('');
                    setStartDate(new Date());
                    setEndDate(new Date());
                    setShowStartDatePicker(false);
                    setShowEndDatePicker(false);
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.modalButton, styles.createButton]}
                  onPress={handleCreateCampaign}
                >
                  <Text style={styles.createButtonText}>Crear</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Date Pickers */}
      {showStartDatePicker && Platform.OS !== 'web' && DateTimePicker && (
        <>
          {Platform.OS === 'ios' && (
            <View style={styles.iosPickerOverlay}>
              <View style={styles.iosPickerContainer}>
                <View style={styles.iosPickerHeader}>
                  <TouchableOpacity
                    onPress={() => setShowStartDatePicker(false)}
                  >
                    <Text style={styles.iosPickerCancelText}>Cancelar</Text>
                  </TouchableOpacity>
                  <Text style={styles.iosPickerTitle}>Fecha de inicio</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setShowStartDatePicker(false);
                    }}
                  >
                    <Text style={styles.iosPickerDoneText}>Listo</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={startDate}
                  mode="date"
                  display="spinner"
                  onChange={handleStartDateChange}
                  maximumDate={endDate}
                />
              </View>
            </View>
          )}
          {Platform.OS === 'android' && (
            <DateTimePicker
              value={startDate}
              mode="date"
              display="default"
              onChange={handleStartDateChange}
              maximumDate={endDate}
            />
          )}
        </>
      )}

      {showEndDatePicker && Platform.OS !== 'web' && DateTimePicker && (
        <>
          {Platform.OS === 'ios' && (
            <View style={styles.iosPickerOverlay}>
              <View style={styles.iosPickerContainer}>
                <View style={styles.iosPickerHeader}>
                  <TouchableOpacity
                    onPress={() => setShowEndDatePicker(false)}
                  >
                    <Text style={styles.iosPickerCancelText}>Cancelar</Text>
                  </TouchableOpacity>
                  <Text style={styles.iosPickerTitle}>Fecha de fin</Text>
                  <TouchableOpacity
                    onPress={() => {
                      setShowEndDatePicker(false);
                    }}
                  >
                    <Text style={styles.iosPickerDoneText}>Listo</Text>
                  </TouchableOpacity>
                </View>
                <DateTimePicker
                  value={endDate}
                  mode="date"
                  display="spinner"
                  onChange={handleEndDateChange}
                  minimumDate={startDate}
                />
              </View>
            </View>
          )}
          {Platform.OS === 'android' && (
            <DateTimePicker
              value={endDate}
              mode="date"
              display="default"
              onChange={handleEndDateChange}
              minimumDate={startDate}
            />
          )}
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: "#2e7d32",
    borderBottomWidth: 1,
    borderBottomColor: "#1b5e20",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    zIndex: 10,
  },
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  leftContainer: {
    flexDirection: "column",
    justifyContent: "center",
  },
  subtitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 1,
  },
  logoSmall: {
    width: 16,
    height: 16,
    marginRight: 5,
  },
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginLeft: -8, // Ajuste visual para alinear a la izquierda
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: "#ffffff",
    letterSpacing: -0.5,
    marginRight: 6,
  },
  chevronBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 10,
    width: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 11,
    color: "#e8f5e9",
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 1,
    letterSpacing: 0.5,
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingsBtn: {
    padding: 6,
    borderRadius: 50,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  
  // Estilos del Dropdown Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-start',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight + 60 : 100, // Ajuste de posición
    paddingHorizontal: 20,
  },
  dropdownMenu: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 10,
  },
  menuHeader: {
    fontSize: 12,
    fontWeight: '600',
    color: '#8898aa',
    textTransform: 'uppercase',
    marginBottom: 10,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  menuItemText: {
    fontSize: 16,
    color: '#333',
  },
  activeItemText: {
    color: '#2e7d32',
    fontWeight: '700',
  },
  separator: {
    height: 10,
  },
  newCampaignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 5,
  },
  plusIconBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#2e7d32',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  newCampaignText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2e7d32',
  },
  loadingText: {
    fontSize: 14,
    color: '#8898aa',
    textAlign: 'center',
    paddingVertical: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#8898aa',
    textAlign: 'center',
    paddingVertical: 20,
  },
  newCampaignModal: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 20,
    maxWidth: 400,
    alignSelf: 'center',
    marginTop: 100,
  },
  newCampaignModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1b1f23',
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#f7f9f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dateInput: {
    backgroundColor: '#f7f9f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateInputText: {
    fontSize: 16,
    color: '#1b1f23',
  },
  iosPickerOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  iosPickerContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  iosPickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  iosPickerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1b1f23',
  },
  iosPickerCancelText: {
    fontSize: 16,
    color: '#666',
  },
  iosPickerDoneText: {
    fontSize: 16,
    color: '#2e7d32',
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: '#2e7d32',
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});
