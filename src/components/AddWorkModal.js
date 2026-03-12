import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
// DateTimePicker solo para iOS/Android, no para web
let DateTimePicker;
if (Platform.OS !== 'web') {
  try {
    DateTimePicker = require('@react-native-community/datetimepicker').default;
  } catch (e) {
    console.warn('DateTimePicker no disponible:', e);
    DateTimePicker = null;
  }
} else {
  DateTimePicker = null;
}
import { dypai } from "../lib/dypai";
import { useCampaign } from "../context/CampaignContext";
import { formatDateFull } from "../utils/formatters";
import { formatEuro } from "../utils/formatters";

const TASK_TYPES = [
  { value: "poda", label: "Poda", icon: "tree" },
  { value: "recoleccion", label: "Recolección", icon: "basket" },
  { value: "tratamiento", label: "Tratamiento", icon: "spray" },
  { value: "riego", label: "Riego", icon: "water" },
  { value: "otros", label: "Otros", icon: "tools" },
];

export default function AddWorkModal({ visible, onClose, onSuccess }) {
  const { currentCampaignId } = useCampaign();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Datos del formulario
  const [parcels, setParcels] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [selectedParcela, setSelectedParcela] = useState(null);
  const [selectedTaskType, setSelectedTaskType] = useState(null);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [description, setDescription] = useState("");
  const [concept, setConcept] = useState("");
  const [selectedWorkers, setSelectedWorkers] = useState([]); // Array de {worker_id, quantity, extras_qty, total_cost}

  // Cargar datos iniciales
  useEffect(() => {
    if (visible) {
      loadInitialData();
    } else {
      // Resetear formulario al cerrar
      resetForm();
    }
  }, [visible]);

  const loadInitialData = async () => {
    try {
      setLoadingData(true);
      const [parcelsRes, workersRes] = await Promise.all([
        dypai.api.get("obtener_parcels", {
          params: { sort_by: "name", order: "ASC", limit: 1000 },
        }),
        dypai.api.get("obtener_workers", {
          params: { sort_by: "name", order: "ASC", limit: 1000 },
        }),
      ]);

      if (parcelsRes.error) throw parcelsRes.error;
      if (workersRes.error) throw workersRes.error;

      setParcels(Array.isArray(parcelsRes.data) ? parcelsRes.data : []);
      setWorkers(Array.isArray(workersRes.data) ? workersRes.data : []);
    } catch (error) {
      console.error("Error cargando datos:", error);
      Alert.alert("Error", "No se pudieron cargar las parcelas y trabajadores");
    } finally {
      setLoadingData(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setSelectedParcela(null);
    setSelectedTaskType(null);
    setDate(new Date());
    setDescription("");
    setConcept("");
    setSelectedWorkers([]);
  };

  const handleDateChange = (event, selectedDate) => {
    if (Platform.OS === "android") {
      setShowDatePicker(false);
      if (event.type === "dismissed") return;
    }
    if (selectedDate) {
      // Asegurarse de que selectedDate es un objeto Date válido
      const dateObj = selectedDate instanceof Date ? selectedDate : new Date(selectedDate);
      setDate(dateObj);
    }
    if (Platform.OS === "ios") {
      if (event.type === "set") {
        setShowDatePicker(false);
      }
    }
  };

  const toggleWorker = (worker) => {
    setSelectedWorkers((prev) => {
      const exists = prev.find((w) => w.worker_id === worker.id);
      if (exists) {
        return prev.filter((w) => w.worker_id !== worker.id);
      } else {
        // Añadir trabajador con valores por defecto
        const dailyWage = parseFloat(worker.default_daily_wage) || 0;
        return [
          ...prev,
          {
            worker_id: worker.id,
            worker_name: worker.name,
            quantity: 1,
            extras_qty: 0,
            daily_wage: dailyWage,
            extra_price: parseFloat(worker.default_extra_price) || 0,
            total_cost: dailyWage,
          },
        ];
      }
    });
  };

  const updateWorkerDetail = (workerId, field, value) => {
    setSelectedWorkers((prev) =>
      prev.map((w) => {
        if (w.worker_id === workerId) {
          const updated = { ...w, [field]: parseFloat(value) || 0 };
          // Recalcular total_cost
          const quantity = updated.quantity || 1;
          const extras = updated.extras_qty || 0;
          const dailyWage = updated.daily_wage || 0;
          const extraPrice = updated.extra_price || 0;
          updated.total_cost = quantity * dailyWage + extras * extraPrice;
          return updated;
        }
        return w;
      })
    );
  };

  const calculateTotalCost = () => {
    return selectedWorkers.reduce((sum, w) => sum + (w.total_cost || 0), 0);
  };

  const handleNext = () => {
    if (step === 1 && !selectedParcela) {
      Alert.alert("Error", "Por favor selecciona una parcela");
      return;
    }
    if (step === 2 && !selectedTaskType) {
      Alert.alert("Error", "Por favor selecciona un tipo de trabajo");
      return;
    }
    if (step === 3 && selectedWorkers.length === 0) {
      Alert.alert("Error", "Por favor selecciona al menos un trabajador");
      return;
    }
    setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleSave = async () => {
    if (!currentCampaignId) {
      Alert.alert("Error", "No hay una campaña activa seleccionada");
      return;
    }

    try {
      setLoading(true);

      // Crear work_event
      // Asegurarse de que date es un objeto Date válido
      const dateObj = date instanceof Date ? date : new Date(date);
      const dateString = dateObj.toISOString().split("T")[0];
      
      const workEventData = {
        campaign_id: currentCampaignId,
        parcel_id: selectedParcela.id,
        date: dateString,
        task_type: selectedTaskType,
        concept: concept.trim() || null,
        description: description.trim() || null,
      };

      const { data: workEventResult, error: workEventError } = await dypai.api.post(
        "crear_work_event",
        workEventData
      );

      if (workEventError) throw workEventError;

      const created = Array.isArray(workEventResult) ? workEventResult[0] : workEventResult;
      const workEventId = created?.id;

      if (!workEventId) {
        console.error("No se encontró ID en la respuesta:", workEventResult);
        throw new Error("No se pudo crear el trabajo. La respuesta no contiene un ID válido.");
      }

      // Crear work_event_details para cada trabajador
      const detailsPromises = selectedWorkers.map((worker) =>
        dypai.api.post("crear_work_event_detail", {
          work_event_id: workEventId,
          worker_id: worker.worker_id,
          quantity: worker.quantity || 1,
          extras_qty: worker.extras_qty || 0,
          total_cost: worker.total_cost || 0,
          is_paid: false,
        })
      );

      const detailsResults = await Promise.all(detailsPromises);
      for (const result of detailsResults) {
        if (result.error) throw result.error;
      }

      Alert.alert("Éxito", "Trabajo registrado correctamente", [
        {
          text: "OK",
          onPress: () => {
            resetForm();
            onClose();
            if (onSuccess) onSuccess();
          },
        },
      ]);
    } catch (error) {
      console.error("Error guardando trabajo:", error);
      console.error("Detalles del error:", {
        message: error.message,
        stack: error.stack,
        response: error.response,
      });
      Alert.alert(
        "Error",
        error.message || "No se pudo registrar el trabajo. Intenta de nuevo."
      );
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
      <Modal visible={visible} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modalContent}>
            <ActivityIndicator size="large" color="#2e7d32" />
            <Text style={styles.loadingText}>Cargando datos...</Text>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <View style={styles.overlay}>
          <View style={styles.modalContent}>
            {/* Header */}
            <View style={styles.header}>
              <TouchableOpacity
                onPress={step > 1 ? handleBack : onClose}
                style={styles.backButton}
              >
                <Ionicons
                  name={step > 1 ? "chevron-back" : "close"}
                  size={24}
                  color="#1b1f23"
                />
              </TouchableOpacity>
              <View style={styles.headerCenter}>
                <Text style={styles.headerTitle}>Nuevo Trabajo</Text>
                <Text style={styles.headerSubtitle}>
                  Paso {step} de 4
                </Text>
              </View>
              <View style={styles.backButton} />
            </View>

            {/* Progress Bar */}
            <View style={styles.progressBar}>
              <View
                style={[styles.progressFill, { width: `${(step / 4) * 100}%` }]}
              />
            </View>

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Paso 1: Seleccionar Parcela */}
              {step === 1 && (
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Selecciona la parcela</Text>
                  <Text style={styles.stepSubtitle}>
                    Elige dónde se realizó el trabajo
                  </Text>

                  {parcels.length === 0 ? (
                    <View style={styles.emptyState}>
                      <MaterialCommunityIcons
                        name="map-outline"
                        size={48}
                        color="#9ba9a0"
                      />
                      <Text style={styles.emptyText}>
                        No hay parcelas disponibles
                      </Text>
                      <Text style={styles.emptySubtext}>
                        Crea una parcela primero desde la sección Parcelas
                      </Text>
                    </View>
                  ) : (
                    parcels.map((parcela) => (
                      <TouchableOpacity
                        key={parcela.id}
                        style={[
                          styles.optionCard,
                          selectedParcela?.id === parcela.id &&
                            styles.optionCardSelected,
                        ]}
                        onPress={() => setSelectedParcela(parcela)}
                      >
                        <View style={styles.optionCardContent}>
                          <View style={styles.optionCardLeft}>
                            <MaterialCommunityIcons
                              name="map-marker"
                              size={24}
                              color={
                                selectedParcela?.id === parcela.id
                                  ? "#2e7d32"
                                  : "#607463"
                              }
                            />
                            <View style={styles.optionCardText}>
                              <Text style={styles.optionCardTitle}>
                                {parcela.name}
                              </Text>
                              <Text style={styles.optionCardSubtitle}>
                                {parcela.crop_type || "Sin cultivo"}
                                {parcela.area_ha
                                  ? ` · ${parcela.area_ha} ha`
                                  : ""}
                              </Text>
                            </View>
                          </View>
                          {selectedParcela?.id === parcela.id && (
                            <Ionicons
                              name="checkmark-circle"
                              size={24}
                              color="#2e7d32"
                            />
                          )}
                        </View>
                      </TouchableOpacity>
                    ))
                  )}
                </View>
              )}

              {/* Paso 2: Tipo de Trabajo y Fecha */}
              {step === 2 && (
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Tipo de trabajo</Text>
                  <Text style={styles.stepSubtitle}>
                    ¿Qué tipo de trabajo se realizó?
                  </Text>

                  <View style={styles.taskTypesGrid}>
                    {TASK_TYPES.map((task) => (
                      <TouchableOpacity
                        key={task.value}
                        style={[
                          styles.taskTypeCard,
                          selectedTaskType === task.value &&
                            styles.taskTypeCardSelected,
                        ]}
                        onPress={() => setSelectedTaskType(task.value)}
                      >
                        <MaterialCommunityIcons
                          name={task.icon}
                          size={32}
                          color={
                            selectedTaskType === task.value
                              ? "#2e7d32"
                              : "#607463"
                          }
                        />
                        <Text
                          style={[
                            styles.taskTypeLabel,
                            selectedTaskType === task.value &&
                              styles.taskTypeLabelSelected,
                          ]}
                        >
                          {task.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Concepto / Título rápido (opcional)</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Ej: Poda de invierno, Recolección temprana..."
                      placeholderTextColor="#9ba9a0"
                      value={concept}
                      onChangeText={setConcept}
                      maxLength={100}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Fecha del trabajo</Text>
                    <TouchableOpacity
                      style={styles.dateButton}
                      onPress={() => setShowDatePicker(true)}
                    >
                      <Ionicons name="calendar" size={20} color="#2e7d32" />
                      <Text style={styles.dateButtonText}>
                        {date instanceof Date ? formatDateFull(date) : formatDateFull(new Date(date))}
                      </Text>
                    </TouchableOpacity>
                    {showDatePicker && Platform.OS !== 'web' && DateTimePicker && (
                      <DateTimePicker
                        value={date}
                        mode="date"
                        display={Platform.OS === "ios" ? "spinner" : "default"}
                        onChange={handleDateChange}
                        maximumDate={new Date()}
                      />
                    )}
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Descripción (opcional)</Text>
                    <TextInput
                      style={styles.textArea}
                      placeholder="Añade notas o detalles adicionales"
                      placeholderTextColor="#9ba9a0"
                      value={description}
                      onChangeText={setDescription}
                      multiline
                      numberOfLines={3}
                    />
                  </View>
                </View>
              )}

              {/* Paso 3: Seleccionar Trabajadores */}
              {step === 3 && (
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Trabajadores</Text>
                  <Text style={styles.stepSubtitle}>
                    Selecciona los trabajadores que participaron
                  </Text>

                  {workers.length === 0 ? (
                    <View style={styles.emptyState}>
                      <MaterialCommunityIcons
                        name="account-outline"
                        size={48}
                        color="#9ba9a0"
                      />
                      <Text style={styles.emptyText}>
                        No hay trabajadores disponibles
                      </Text>
                      <Text style={styles.emptySubtext}>
                        Crea trabajadores desde la sección Trabajo
                      </Text>
                    </View>
                  ) : (
                    <>
                      {workers.map((worker) => {
                        const isSelected = selectedWorkers.some(
                          (w) => w.worker_id === worker.id
                        );
                        const workerDetail = selectedWorkers.find(
                          (w) => w.worker_id === worker.id
                        );

                        return (
                          <View key={worker.id} style={styles.workerCard}>
                            <TouchableOpacity
                              style={styles.workerCardHeader}
                              onPress={() => toggleWorker(worker)}
                            >
                              <View style={styles.workerCardLeft}>
                                <View
                                  style={[
                                    styles.checkbox,
                                    isSelected && styles.checkboxSelected,
                                  ]}
                                >
                                  {isSelected && (
                                    <Ionicons
                                      name="checkmark"
                                      size={16}
                                      color="#fff"
                                    />
                                  )}
                                </View>
                                <View style={styles.workerInfo}>
                                  <Text style={styles.workerName}>
                                    {worker.name}
                                  </Text>
                                  <Text style={styles.workerWage}>
                                    {formatEuro(parseFloat(worker.default_daily_wage) || 0)} / jornada
                                  </Text>
                                </View>
                              </View>
                            </TouchableOpacity>

                            {isSelected && workerDetail && (
                              <View style={styles.workerDetails}>
                                <View style={styles.detailRow}>
                                  <Text style={styles.detailLabel}>
                                    Jornales:
                                  </Text>
                                  <View style={styles.quantityControls}>
                                    <TouchableOpacity
                                      style={styles.quantityButton}
                                      onPress={() =>
                                        updateWorkerDetail(
                                          worker.id,
                                          "quantity",
                                          Math.max(
                                            0.5,
                                            (workerDetail.quantity || 1) - 0.5
                                          )
                                        )
                                      }
                                    >
                                      <Ionicons
                                        name="remove"
                                        size={18}
                                        color="#2e7d32"
                                      />
                                    </TouchableOpacity>
                                    <Text style={styles.quantityValue}>
                                      {workerDetail.quantity || 1}
                                    </Text>
                                    <TouchableOpacity
                                      style={styles.quantityButton}
                                      onPress={() =>
                                        updateWorkerDetail(
                                          worker.id,
                                          "quantity",
                                          (workerDetail.quantity || 1) + 0.5
                                        )
                                      }
                                    >
                                      <Ionicons
                                        name="add"
                                        size={18}
                                        color="#2e7d32"
                                      />
                                    </TouchableOpacity>
                                  </View>
                                </View>

                                <View style={styles.detailRow}>
                                  <Text style={styles.detailLabel}>
                                    Horas extra:
                                  </Text>
                                  <TextInput
                                    style={styles.numberInput}
                                    value={String(workerDetail.extras_qty || 0)}
                                    onChangeText={(text) =>
                                      updateWorkerDetail(
                                        worker.id,
                                        "extras_qty",
                                        text
                                      )
                                    }
                                    keyboardType="decimal-pad"
                                    placeholder="0"
                                  />
                                </View>

                                <View style={styles.detailRow}>
                                  <Text style={styles.detailLabel}>
                                    Total:
                                  </Text>
                                  <Text style={styles.totalCost}>
                                    {formatEuro(workerDetail.total_cost || 0)}
                                  </Text>
                                </View>
                              </View>
                            )}
                          </View>
                        );
                      })}

                      {selectedWorkers.length > 0 && (
                        <View style={styles.totalCard}>
                          <Text style={styles.totalLabel}>Costo total:</Text>
                          <Text style={styles.totalValue}>
                            {formatEuro(calculateTotalCost())}
                          </Text>
                        </View>
                      )}
                    </>
                  )}
                </View>
              )}

              {/* Paso 4: Resumen */}
              {step === 4 && (
                <View style={styles.stepContent}>
                  <Text style={styles.stepTitle}>Resumen</Text>
                  <Text style={styles.stepSubtitle}>
                    Revisa la información antes de guardar
                  </Text>

                  <View style={styles.summaryCard}>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Parcela:</Text>
                      <Text style={styles.summaryValue}>
                        {selectedParcela?.name}
                      </Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Tipo:</Text>
                      <Text style={styles.summaryValue}>
                        {
                          TASK_TYPES.find((t) => t.value === selectedTaskType)
                            ?.label
                        }
                      </Text>
                    </View>
                    {concept && (
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Concepto:</Text>
                        <Text style={styles.summaryValue}>{concept}</Text>
                      </View>
                    )}
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Fecha:</Text>
                      <Text style={styles.summaryValue}>
                        {date instanceof Date ? formatDateFull(date) : formatDateFull(new Date(date))}
                      </Text>
                    </View>
                    {description && (
                      <View style={styles.summaryRow}>
                        <Text style={styles.summaryLabel}>Descripción:</Text>
                        <Text style={styles.summaryValue}>{description}</Text>
                      </View>
                    )}
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Trabajadores:</Text>
                      <Text style={styles.summaryValue}>
                        {selectedWorkers.length}
                      </Text>
                    </View>
                    <View style={styles.summaryRow}>
                      <Text style={styles.summaryLabel}>Costo total:</Text>
                      <Text style={styles.summaryValue}>
                        {formatEuro(calculateTotalCost())}
                      </Text>
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>

            {/* Footer con botones */}
            <View style={styles.footer}>
              {step < 4 ? (
                <TouchableOpacity
                  style={styles.nextButton}
                  onPress={handleNext}
                >
                  <Text style={styles.nextButtonText}>Continuar</Text>
                  <Ionicons name="chevron-forward" size={20} color="#fff" />
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.nextButton, loading && styles.nextButtonDisabled]}
                  onPress={handleSave}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <>
                      <Text style={styles.nextButtonText}>Guardar Trabajo</Text>
                      <Ionicons name="checkmark" size={20} color="#fff" />
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    maxHeight: "90%",
    paddingBottom: Platform.OS === "ios" ? 30 : 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#1b1f23",
  },
  headerSubtitle: {
    fontSize: 13,
    color: "#607463",
    marginTop: 2,
  },
  progressBar: {
    height: 4,
    backgroundColor: "#e0e0e0",
    marginHorizontal: 20,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#2e7d32",
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1b1f23",
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 15,
    color: "#607463",
    marginBottom: 24,
  },
  optionCard: {
    backgroundColor: "#f7f9f5",
    borderRadius: 14,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  optionCardSelected: {
    borderColor: "#2e7d32",
    backgroundColor: "#e8f5e9",
  },
  optionCardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  optionCardLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  optionCardText: {
    marginLeft: 12,
    flex: 1,
  },
  optionCardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1b1f23",
  },
  optionCardSubtitle: {
    fontSize: 14,
    color: "#607463",
    marginTop: 2,
  },
  taskTypesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 24,
    gap: 12,
  },
  taskTypeCard: {
    width: "30%",
    aspectRatio: 1,
    backgroundColor: "#f7f9f5",
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  taskTypeCardSelected: {
    borderColor: "#2e7d32",
    backgroundColor: "#e8f5e9",
  },
  taskTypeLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#607463",
    marginTop: 8,
  },
  taskTypeLabelSelected: {
    color: "#2e7d32",
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f7f9f5",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  dateButtonText: {
    fontSize: 16,
    color: "#1b1f23",
    marginLeft: 10,
  },
  textInput: {
    backgroundColor: "#f7f9f5",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    color: "#1b1f23",
  },
  textArea: {
    backgroundColor: "#f7f9f5",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    color: "#1b1f23",
    minHeight: 80,
    textAlignVertical: "top",
  },
  workerCard: {
    backgroundColor: "#f7f9f5",
    borderRadius: 14,
    marginBottom: 12,
    overflow: "hidden",
  },
  workerCardHeader: {
    padding: 16,
  },
  workerCardLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#9ba9a0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  checkboxSelected: {
    backgroundColor: "#2e7d32",
    borderColor: "#2e7d32",
  },
  workerInfo: {
    flex: 1,
  },
  workerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1b1f23",
  },
  workerWage: {
    fontSize: 13,
    color: "#607463",
    marginTop: 2,
  },
  workerDetails: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: "#607463",
    fontWeight: "600",
  },
  quantityControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  quantityButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#2e7d32",
  },
  quantityValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1b1f23",
    minWidth: 40,
    textAlign: "center",
  },
  numberInput: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 8,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    width: 80,
    textAlign: "center",
  },
  totalCost: {
    fontSize: 16,
    fontWeight: "700",
    color: "#2e7d32",
  },
  totalCard: {
    backgroundColor: "#e8f5e9",
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1b1f23",
  },
  totalValue: {
    fontSize: 20,
    fontWeight: "800",
    color: "#2e7d32",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#9ba9a0",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#b0bec5",
    marginTop: 8,
    textAlign: "center",
  },
  summaryCard: {
    backgroundColor: "#f7f9f5",
    borderRadius: 14,
    padding: 20,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#607463",
    fontWeight: "600",
  },
  summaryValue: {
    fontSize: 14,
    color: "#1b1f23",
    fontWeight: "600",
    flex: 1,
    textAlign: "right",
  },
  footer: {
    padding: 20,
    paddingTop: 0,
  },
  nextButton: {
    backgroundColor: "#2e7d32",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
  nextButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  loadingText: {
    marginTop: 16,
    color: "#607463",
    fontSize: 16,
  },
});
