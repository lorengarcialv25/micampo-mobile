import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  TextInput,
  Dimensions,
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import { dypai } from "../../lib/dypai";
import { useCampaign } from "../../context/CampaignContext";
import AddWorkHeader from "../../components/AddWorkScreen/AddWorkHeader";
import SearchableSelector from "../../components/SearchableSelector";
import DatePickerModal from "../../components/AddWorkScreen/DatePickerModal";

export default function AddWorkScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { editId } = route.params || {};
  const insets = useSafeAreaInsets();
  const { currentCampaignId } = useCampaign();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  // Catálogos
  const [parcels, setParcels] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [taskTypes, setTaskTypes] = useState([]);

  // Estados del Formulario
  const [selectedParcela, setSelectedParcela] = useState(null);
  const [selectedTaskType, setSelectedTaskType] = useState(null);
  const [date, setDate] = useState(new Date());
  const [concept, setConcept] = useState("");
  const [description, setDescription] = useState("");
  const [selectedWorkers, setSelectedWorkers] = useState([]);
  const [originalDetails, setOriginalDetails] = useState([]);

  // Visibilidad de Selectores
  const [showParcelSelector, setShowParcelSelector] = useState(false);
  const [showTaskSelector, setShowTaskSelector] = useState(false);
  const [showWorkerSelector, setShowWorkerSelector] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [activeRowTaskSelector, setActiveRowTaskSelector] = useState(null); // rowId de la fila que está editando su tarea
  const [activeRowParcelSelector, setActiveRowParcelSelector] = useState(null); // rowId de la fila que está editando su parcela

  // Estados para creación rápida
  const [creatingItem, setCreatingItem] = useState(false);

  // Estados para archivos
  const [fileUri, setFileUri] = useState(null);
  const [fileName, setFileName] = useState(null);
  const [fileType, setFileType] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);

  // Calcular Coste Total
  const totalCost = useMemo(() => {
    return selectedWorkers.reduce((sum, w) => sum + (parseFloat(w.total_cost) || 0), 0);
  }, [selectedWorkers]);

  // Detectar orientación
  const [isLandscape, setIsLandscape] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return width > height;
  });

  useEffect(() => {
    loadInitialData();
    
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setIsLandscape(window.width > window.height);
    });

    return () => subscription?.remove();
  }, []);

  const loadInitialData = async () => {
    try {
      setLoadingData(true);
      const promises = [
        dypai.api.get("obtener_parcels", { params: { sort_by: "name", order: "ASC", limit: 1000 } }),
        dypai.api.get("obtener_workers", { params: { sort_by: "name", order: "ASC", limit: 1000 } }),
        dypai.api.get("obtener_task_types", { params: { sort_by: "name", order: "ASC", limit: 1000 } }),
      ];

      if (editId) {
        promises.push(dypai.api.get("obtener_work_events_completos", { params: { id: editId } }));
      }

      const [parcelsRes, workersRes, taskTypesRes, eventRes] = await Promise.all(promises);

      const parcelsData = Array.isArray(parcelsRes) ? parcelsRes : parcelsRes?.data || [];
      const workersData = Array.isArray(workersRes) ? workersRes : workersRes?.data || [];
      const taskTypesData = Array.isArray(taskTypesRes) ? taskTypesRes : taskTypesRes?.data || [];

      setParcels(parcelsData);
      setWorkers(workersData);
      setTaskTypes(taskTypesData);

      if (editId && eventRes) {
        console.log("🔍 Edit Mode - eventRes:", JSON.stringify(eventRes, null, 2));
        
        let eventData = null;
        if (Array.isArray(eventRes)) eventData = eventRes[0];
        else if (eventRes?.result?.data?.[0]) eventData = eventRes.result.data[0];
        else if (eventRes?.result?.[0]) eventData = eventRes.result[0];
        else if (eventRes?.data?.[0]) eventData = eventRes.data[0];
        else if (eventRes?.data) eventData = eventRes.data;

        if (eventData) {
          console.log("🔍 eventData found:", JSON.stringify(eventData, null, 2));
          
          setConcept(eventData.concept || "");
          setDescription(eventData.description || "");
          
          // Preseleccionar Tipo de Trabajo
          if (eventData.task_type) {
            setSelectedTaskType(eventData.task_type);
          }

          if (eventData.date) setDate(new Date(eventData.date));

          // Preseleccionar Parcela
          const targetParcelId = eventData.parcel_id || (eventData.details?.[0]?.parcel_id);
          if (targetParcelId) {
            const parcela = parcelsData.find(p => p.id === targetParcelId);
            if (parcela) setSelectedParcela(parcela);
          }

          const details = eventData.details || [];
          setOriginalDetails(details);
          setSelectedWorkers(details.map(d => {
            const work_days = parseFloat(d.work_days) || 0;
            const work_days_price = parseFloat(d.work_days_price) || 0;
            const work_hours = parseFloat(d.work_hours) || 0;
            const work_hours_price = parseFloat(d.work_hours_price) || 0;
            const area_qty = parseFloat(d.area_qty) || 0;
            const area_price = parseFloat(d.area_price) || 0;

            return {
              id: d.id,
              rowId: d.id || Math.random().toString(),
              worker_id: d.worker_id,
              worker_name: d.worker_name,
              parcel_id: d.parcel_id || eventData.parcel_id,
              parcel_name: d.parcel_name || parcelsData.find(p => p.id === d.parcel_id)?.name,
              task_type: d.task_type || eventData.task_type,
              work_days: work_days,
              work_days_price: work_days_price,
              work_hours: work_hours,
              work_hours_price: work_hours_price,
              area_qty: area_qty,
              area_price: area_price,
              area_unit: d.area_unit || 'fanegas',
              total_cost: parseFloat(d.total_cost) || 
                         (work_days * work_days_price) + 
                         (work_hours * work_hours_price) + 
                         (area_qty * area_price),
            };
          }));
        }
      }
    } catch (error) {
      console.error("Error inicial:", error);
      Alert.alert("Error", "No se pudieron cargar los datos");
    } finally {
      setLoadingData(false);
    }
  };

  // Creación "On-the-fly"
  const createWorkerOnTheFly = async (name) => {
    try {
      setCreatingItem(true);
      const res = await dypai.api.post("crear_worker", { name });
      const newWorkerId = res?.id || res?.data?.id || res?.result?.id;
      if (!newWorkerId) throw new Error("No se pudo crear el trabajador");
      
      const newWorker = { id: String(newWorkerId), name };
      setWorkers(prev => [...prev, newWorker]);
      toggleWorker(newWorker);
      Alert.alert("Éxito", `Trabajador "${name}" creado`);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo crear el trabajador");
    } finally {
      setCreatingItem(false);
    }
  };

  const createTaskTypeOnTheFly = async (name, targetRowId = null) => {
    try {
      setCreatingItem(true);
      const res = await dypai.api.post("crear_task_type", { name });
      const newTaskId = res?.id || res?.data?.id || res?.result?.id;
      if (!newTaskId) throw new Error("No se pudo crear la tarea");
      
      const newTask = { id: name, name };
      setTaskTypes(prev => [...prev, { id: name, name }]);
      
      if (targetRowId) {
        updateWorkerDetail(targetRowId, 'task_type', name);
      } else {
        setSelectedTaskType(name);
      }
      Alert.alert("Éxito", `Tarea "${name}" creada`);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo crear la tarea");
    } finally {
      setCreatingItem(false);
    }
  };

  const createParcelOnTheFly = async (name, targetRowId = null) => {
    try {
      setCreatingItem(true);
      // Capitalizar el nombre como en la versión web
      const capitalizedName = name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
      
      const res = await dypai.api.post("crear_parcela", { name: capitalizedName });
      const newParcelId = res?.id || res?.[0]?.id || res?.result?.id || res?.data?.id;
      if (!newParcelId) throw new Error("No se pudo crear la parcela");
      
      const newParcel = { id: String(newParcelId), name: capitalizedName };
      setParcels(prev => [...prev, newParcel]);
      
      if (targetRowId) {
        updateWorkerDetail(targetRowId, 'parcel_id', String(newParcelId));
        updateWorkerDetail(targetRowId, 'parcel_name', capitalizedName);
      } else {
        setSelectedParcela(newParcel);
      }
      Alert.alert("Éxito", `Parcela "${capitalizedName}" creada`);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "No se pudo crear la parcela");
    } finally {
      setCreatingItem(false);
    }
  };

  const toggleWorker = (worker) => {
    setSelectedWorkers(prev => {
      const dailyWage = parseFloat(worker.default_daily_wage) || 60;
      return [...prev, {
        rowId: Math.random().toString(), // Generar ID único para esta fila
        worker_id: worker.id,
        worker_name: worker.name,
        parcel_id: selectedParcela?.id, // Heredar parcela global
        parcel_name: selectedParcela?.name,
        task_type: selectedTaskType, // Heredar tarea global
        work_days: 1,
        work_days_price: dailyWage,
        work_hours: 0,
        work_hours_price: parseFloat(worker.default_extra_price) || 10,
        area_qty: 0,
        area_price: 0,
        area_unit: 'fanegas',
        total_cost: dailyWage,
      }];
    });
  };

  const removeWorkerRow = (rowId) => {
    setSelectedWorkers(prev => prev.filter(w => w.rowId !== rowId));
  };

  const updateWorkerDetail = (rowId, field, value) => {
    setSelectedWorkers(prev => prev.map(w => {
      if (w.rowId === rowId) {
        let updated = { ...w, [field]: value };
        
        // Si el valor debe ser numérico
        if (!['task_type', 'area_unit', 'parcel_id', 'parcel_name'].includes(field)) {
          updated[field] = parseFloat(value) || 0;
        }

        // Si se actualizó la parcela, también actualizar el nombre
        if (field === 'parcel_id') {
          const p = parcels.find(p => p.id === value);
          updated.parcel_name = p?.name;
        }

        // Recalcular total
        if (!['task_type', 'area_unit', 'parcel_id', 'parcel_name'].includes(field)) {
          updated.total_cost = 
            (updated.work_days * updated.work_days_price) + 
            (updated.work_hours * updated.work_hours_price) + 
            (updated.area_qty * updated.area_price);
        }
        return updated;
      }
      return w;
    }));
  };

  const renderExcelTable = () => {
    const renderRow = (worker) => (
      <View key={`row-${worker.rowId}`} style={styles.excelRow}>
        {/* Operario - Solo en vertical, dentro del scroll */}
        {!isLandscape && (
          <View style={[styles.excelCell, { width: 120 }]}>
            <Text style={styles.excelWorkerName} numberOfLines={1}>{worker.worker_name}</Text>
          </View>
        )}

        {/* Parcela */}
        <TouchableOpacity 
          style={[styles.excelCell, styles.excelCellSelector, { width: 180 }]}
          onPress={() => setActiveRowParcelSelector(worker.rowId)}
        >
          <Text style={[styles.excelSelectorText, !worker.parcel_name && styles.placeholder]} numberOfLines={1}>
            {worker.parcel_name || "Seleccionar..."}
          </Text>
        </TouchableOpacity>

        {/* Labor */}
        <TouchableOpacity 
          style={[styles.excelCell, styles.excelCellSelector, { width: 180 }]}
          onPress={() => setActiveRowTaskSelector(worker.rowId)}
        >
          <Text style={[styles.excelSelectorText, !worker.task_type && styles.placeholder]} numberOfLines={1}>
            {worker.task_type || "Seleccionar..."}
          </Text>
        </TouchableOpacity>

        {/* Jornales */}
        <View style={[styles.excelCell, { width: 70 }]}>
          <TextInput
            style={styles.excelInput}
            keyboardType="numeric"
            value={worker.work_days.toString()}
            onChangeText={(val) => updateWorkerDetail(worker.rowId, 'work_days', val)}
          />
        </View>
        <View style={[styles.excelCell, { width: 85 }]}>
          <TextInput
            style={styles.excelInput}
            keyboardType="numeric"
            value={worker.work_days_price.toString()}
            onChangeText={(val) => updateWorkerDetail(worker.rowId, 'work_days_price', val)}
          />
        </View>

        {/* Horas */}
        <View style={[styles.excelCell, { width: 70 }]}>
          <TextInput
            style={styles.excelInput}
            keyboardType="numeric"
            value={worker.work_hours.toString()}
            onChangeText={(val) => updateWorkerDetail(worker.rowId, 'work_hours', val)}
          />
        </View>
        <View style={[styles.excelCell, { width: 85 }]}>
          <TextInput
            style={styles.excelInput}
            keyboardType="numeric"
            value={worker.work_hours_price.toString()}
            onChangeText={(val) => updateWorkerDetail(worker.rowId, 'work_hours_price', val)}
          />
        </View>

        {/* Superficie */}
        <View style={[styles.excelCell, { width: 70 }]}>
          <TextInput
            style={styles.excelInput}
            keyboardType="numeric"
            value={worker.area_qty.toString()}
            onChangeText={(val) => updateWorkerDetail(worker.rowId, 'area_qty', val)}
          />
        </View>
        <View style={[styles.excelCell, { width: 85 }]}>
          <TextInput
            style={styles.excelInput}
            keyboardType="numeric"
            value={worker.area_price.toString()}
            onChangeText={(val) => updateWorkerDetail(worker.rowId, 'area_price', val)}
          />
        </View>

        {/* Total */}
        <View style={[styles.excelCell, { width: 100 }]}>
          <Text style={styles.excelTotalText}>{worker.total_cost.toFixed(2)}€</Text>
        </View>

        {/* Borrar */}
        <TouchableOpacity 
          style={[styles.excelCell, { width: 60, justifyContent: 'center', alignItems: 'center' }]}
          onPress={() => removeWorkerRow(worker.rowId)}
        >
          <Ionicons name="trash-outline" size={22} color="#ef4444" />
        </TouchableOpacity>
      </View>
    );

    return (
      <View style={styles.excelContainer}>
        <View style={styles.excelTableWrapper}>
          {isLandscape ? (
            <>
              {/* COLUMNA FIJA (OPERARIO) - Solo en horizontal */}
              <View style={styles.fixedColumn}>
                <View style={[styles.excelHeader, styles.fixedHeader]}>
                  <Text style={[styles.excelHeaderCell, { width: 120 }]}>OPERARIO</Text>
                </View>
                {selectedWorkers.map((worker) => (
                  <View key={`fixed-${worker.rowId}`} style={[styles.excelRow, styles.fixedRow, { width: 120 }]}>
                    <Text style={styles.excelWorkerName} numberOfLines={1}>{worker.worker_name}</Text>
                  </View>
                ))}
              </View>

              {/* COLUMNAS CON SCROLL HORIZONTAL */}
              <ScrollView horizontal showsHorizontalScrollIndicator={true} persistentScrollbar={true}>
                <View>
                  {/* CABECERA SCROLLABLE */}
                  <View style={styles.excelHeader}>
                    <Text style={[styles.excelHeaderCell, { width: 180 }]}>PARCELA</Text>
                    <Text style={[styles.excelHeaderCell, { width: 180 }]}>LABOR / TAREA</Text>
                    <Text style={[styles.excelHeaderCell, { width: 70, textAlign: 'center' }]}>JORN.</Text>
                    <Text style={[styles.excelHeaderCell, { width: 85, textAlign: 'center' }]}>€ / JORN.</Text>
                    <Text style={[styles.excelHeaderCell, { width: 70, textAlign: 'center' }]}>HORAS</Text>
                    <Text style={[styles.excelHeaderCell, { width: 85, textAlign: 'center' }]}>€ / HORA</Text>
                    <Text style={[styles.excelHeaderCell, { width: 70, textAlign: 'center' }]}>SUP.</Text>
                    <Text style={[styles.excelHeaderCell, { width: 85, textAlign: 'center' }]}>€ / SUP.</Text>
                    <Text style={[styles.excelHeaderCell, { width: 100, textAlign: 'right' }]}>TOTAL</Text>
                    <View style={{ width: 60 }} />
                  </View>

                  {/* FILAS SCROLLABLES */}
                  {selectedWorkers.map(renderRow)}
                </View>
              </ScrollView>
            </>
          ) : (
            /* MODO VERTICAL - Todo dentro del scroll, sin columna fija */
            <ScrollView horizontal showsHorizontalScrollIndicator={true} persistentScrollbar={true}>
              <View>
                {/* CABECERA */}
                <View style={styles.excelHeader}>
                  <Text style={[styles.excelHeaderCell, { width: 120 }]}>OPERARIO</Text>
                  <Text style={[styles.excelHeaderCell, { width: 180 }]}>PARCELA</Text>
                  <Text style={[styles.excelHeaderCell, { width: 180 }]}>LABOR / TAREA</Text>
                  <Text style={[styles.excelHeaderCell, { width: 70, textAlign: 'center' }]}>JORN.</Text>
                  <Text style={[styles.excelHeaderCell, { width: 85, textAlign: 'center' }]}>€ / JORN.</Text>
                  <Text style={[styles.excelHeaderCell, { width: 70, textAlign: 'center' }]}>HORAS</Text>
                  <Text style={[styles.excelHeaderCell, { width: 85, textAlign: 'center' }]}>€ / HORA</Text>
                  <Text style={[styles.excelHeaderCell, { width: 70, textAlign: 'center' }]}>SUP.</Text>
                  <Text style={[styles.excelHeaderCell, { width: 85, textAlign: 'center' }]}>€ / SUP.</Text>
                  <Text style={[styles.excelHeaderCell, { width: 100, textAlign: 'right' }]}>TOTAL</Text>
                  <View style={{ width: 60 }} />
                </View>

                {/* FILAS */}
                {selectedWorkers.map(renderRow)}
              </View>
            </ScrollView>
          )}
        </View>
        {/* BOTÓN AÑADIR FILA - Pegado debajo de la tabla */}
        <TouchableOpacity style={styles.addButtonTable} onPress={() => setShowWorkerSelector(true)}>
          <Ionicons name="person-add" size={16} color="#2e7d32" />
          <Text style={styles.addButtonText}>AÑADIR FILA</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const handleSave = async () => {
    // Validar que cada fila tenga worker_name, parcel_id y task_type (igual que en web)
    const validRows = selectedWorkers.filter(r => r.worker_name !== "" && r.parcel_id && r.task_type);
    
    if (validRows.length === 0) {
      Alert.alert("Error", "Por favor, rellena al menos una fila completa.");
      return;
    }

    if (!currentCampaignId) {
      Alert.alert("Error", "No hay una campaña activa seleccionada.");
      return;
    }

    try {
      setLoading(true);
      const dateString = date.toISOString().split("T")[0];
      let workEventId = editId;

      if (editId) {
        // 1. Actualizar la Cabecera (sin parcel_id ni task_type, igual que en web)
        await dypai.api.put("actualizar_work_event", {
          id: editId,
          date: dateString,
          concept: concept.trim() || null,
          description: description.trim() || null
        });

        // 2. Identificar qué filas son nuevas, cuáles editar y cuáles borrar
        const rowsToDelete = originalDetails.filter(orig => !validRows.find(r => r.id === orig.id));
        const rowsToUpdate = validRows.filter(r => r.id); // Filas que tienen ID de BD (existentes)
        const rowsToCreate = validRows.filter(r => !r.id); // Filas nuevas sin ID

        await Promise.all([
          // Borrar filas eliminadas
          ...rowsToDelete.map(r => dypai.api.delete("eliminar_work_event_detail", { params: { id: r.id } })),
          
          // Actualizar filas existentes
          ...rowsToUpdate.map(w => {
            const total = ((w.work_hours || 0) * (w.work_hours_price || 0)) + 
                          ((w.work_days || 0) * (w.work_days_price || 0)) + 
                          ((w.area_qty || 0) * (w.area_price || 0));
            
            return dypai.api.put("actualizar_work_event_detail", {
              id: w.id,
              work_days: w.work_days || 0,
              work_days_price: w.work_days_price || 0,
              work_hours: w.work_hours || 0,
              work_hours_price: w.work_hours_price || 0,
              area_qty: w.area_qty || 0,
              area_price: w.area_price || 0,
              area_unit: w.area_unit || 'fanegas',
              total_cost: total,
              quantity: w.work_hours || w.work_days || w.area_qty || 0,
              unit_cost: w.work_hours ? w.work_hours_price : (w.work_days ? w.work_days_price : w.area_price)
            });
          }),

          // Crear nuevas filas
          ...rowsToCreate.map(w => {
            const total = ((w.work_hours || 0) * (w.work_hours_price || 0)) + 
                          ((w.work_days || 0) * (w.work_days_price || 0)) + 
                          ((w.area_qty || 0) * (w.area_price || 0));

            return dypai.api.post("crear_work_event_detail", {
              work_event_id: editId,
              worker_id: w.worker_id,
              parcel_id: w.parcel_id,
              task_type: w.task_type,
              work_days: w.work_days || null,
              work_days_price: w.work_days_price || null,
              work_hours: w.work_hours || null,
              work_hours_price: w.work_hours_price || null,
              area_qty: w.area_qty || null,
              area_price: w.area_price || null,
              area_unit: w.area_unit || 'fanegas',
              total_cost: total,
              quantity: w.work_hours || w.work_days || w.area_qty || 0,
              unit: w.work_hours ? "hours" : (w.work_days ? "jornal" : "area"),
              unit_cost: w.work_hours ? w.work_hours_price : (w.work_days ? w.work_days_price : w.area_price),
              is_paid: false
            });
          })
        ]);
      } else {
        // Crear nuevo evento (sin parcel_id ni task_type en la cabecera)
        const res = await dypai.api.post("crear_work_event", {
          campaign_id: currentCampaignId,
          date: dateString,
          concept: concept.trim() || null,
          description: description.trim() || null
        });
        
        workEventId = res?.id || res?.data?.id || res?.result?.id;
        if (!workEventId) throw new Error("No se pudo crear el evento de trabajo");

        // Crear todos los detalles
        await Promise.all(validRows.map(w => {
          const total = ((w.work_hours || 0) * (w.work_hours_price || 0)) + 
                        ((w.work_days || 0) * (w.work_days_price || 0)) + 
                        ((w.area_qty || 0) * (w.area_price || 0));

          return dypai.api.post("crear_work_event_detail", {
            work_event_id: String(workEventId),
            worker_id: w.worker_id,
            parcel_id: w.parcel_id,
            task_type: w.task_type,
            work_days: w.work_days || null,
            work_days_price: w.work_days_price || null,
            work_hours: w.work_hours || null,
            work_hours_price: w.work_hours_price || null,
            area_qty: w.area_qty || null,
            area_price: w.area_price || null,
            area_unit: w.area_unit || 'fanegas',
            total_cost: total,
            quantity: w.work_hours || w.work_days || w.area_qty || 0,
            unit: w.work_hours ? "hours" : (w.work_days ? "jornal" : "area"),
            unit_cost: w.work_hours ? w.work_hours_price : (w.work_days ? w.work_days_price : w.area_price),
            is_paid: false
          });
        }));
      }

      navigation.goBack();
      setTimeout(() => Alert.alert("Éxito", "Trabajo guardado correctamente"), 300);
    } catch (error) {
      console.error("Error saving work:", error);
      Alert.alert("Error", "Error al guardar los datos.");
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2e7d32" />
        <Text style={styles.loadingText}>Cargando sistema...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : null} style={styles.container}>
      <View style={{ paddingTop: insets.top, backgroundColor: "#fff" }}>
        <AddWorkHeader onBack={() => navigation.goBack()} isEdit={!!editId} />
      </View>

        <ScrollView
        style={styles.content} 
        contentContainerStyle={[
          styles.scrollPadding,
          isLandscape && {
            paddingLeft: Math.max(insets.left, 16),
            paddingRight: Math.max(insets.right, 16),
          }
        ]} 
          showsVerticalScrollIndicator={false}
        >
        
        {/* SECCIÓN 1: GENERAL */}
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={[styles.field, { flex: 0.4 }]}>
              <Text style={styles.label}>FECHA</Text>
              <TouchableOpacity style={styles.dateSelector} onPress={() => setShowDatePicker(true)}>
                <Ionicons name="calendar-outline" size={18} color="#2e7d32" />
                <Text style={styles.dateText}>{date.toLocaleDateString('es-ES')}</Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.field, { flex: 0.6 }]}>
              <Text style={styles.label}>TÍTULO / CONCEPTO</Text>
              <TextInput
                style={styles.input}
                placeholder="Ej: Poda Semanal"
                value={concept}
                onChangeText={setConcept}
              />
            </View>
          </View>
        </View>

        {/* SECCIÓN 3: TRABAJADORES (EXCEL STYLE) */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>TRABAJADORES Y COSTES</Text>
        </View>

        {selectedWorkers.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="grid-outline" size={40} color="#e2e8f0" />
            <Text style={styles.emptyText}>Pulsa 'AÑADIR FILA' para empezar</Text>
            <TouchableOpacity style={[styles.addButton, { marginTop: 16 }]} onPress={() => setShowWorkerSelector(true)}>
              <Ionicons name="person-add" size={16} color="#2e7d32" />
              <Text style={styles.addButtonText}>AÑADIR FILA</Text>
            </TouchableOpacity>
          </View>
        ) : (
          renderExcelTable()
        )}

        {/* SECCIÓN 4: OBSERVACIONES */}
        <View style={[styles.card, { marginTop: 10 }]}>
          <Text style={styles.label}>OBSERVACIONES</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Añade detalles adicionales aquí..."
            multiline
            numberOfLines={3}
            value={description}
            onChangeText={setDescription}
          />
        </View>

        {/* FOOTER DENTRO DEL SCROLL EN HORIZONTAL */}
        {isLandscape && (
          <View style={[
            styles.footerInline, 
            { 
              paddingBottom: Math.max(insets.bottom, 16),
              paddingLeft: Math.max(insets.left, 0),
              paddingRight: Math.max(insets.right, 0),
              marginTop: 20,
              marginLeft: 0,
              marginRight: 0,
            }
          ]}>
            <View style={styles.totalContainer}>
              <Text style={styles.totalLabelFooter}>COSTE TOTAL</Text>
              <Text style={styles.totalAmount}>{totalCost.toFixed(2)}€</Text>
            </View>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : (
                <>
                  <Text style={styles.saveButtonText}>{editId ? "GUARDAR CAMBIOS" : "REGISTRAR TRABAJO"}</Text>
                  <Ionicons name="checkmark-done" size={20} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={{ height: isLandscape ? 20 : 100 }} />
      </ScrollView>

      {/* FOOTER PERSISTENTE SOLO EN VERTICAL */}
      {!isLandscape && (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.totalContainer}>
            <Text style={styles.totalLabelFooter}>COSTE TOTAL</Text>
            <Text style={styles.totalAmount}>{totalCost.toFixed(2)}€</Text>
          </View>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : (
              <>
                <Text style={styles.saveButtonText}>{editId ? "GUARDAR CAMBIOS" : "REGISTRAR TRABAJO"}</Text>
                <Ionicons name="checkmark-done" size={20} color="#fff" />
              </>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* SELECTORES */}
      <SearchableSelector
        visible={showWorkerSelector}
        onClose={() => setShowWorkerSelector(false)}
        items={workers}
        onSelect={toggleWorker}
        title="Añadir Trabajador"
        onCreateNew={createWorkerOnTheFly}
        loading={creatingItem}
      />

      <SearchableSelector
        visible={!!activeRowTaskSelector}
        onClose={() => setActiveRowTaskSelector(null)}
        items={taskTypes.map(t => ({ id: t.name, name: t.name, icon: "construct-outline" }))}
        onSelect={(t) => {
          updateWorkerDetail(activeRowTaskSelector, 'task_type', t.id);
          setActiveRowTaskSelector(null);
        }}
        selectedId={selectedWorkers.find(w => w.rowId === activeRowTaskSelector)?.task_type}
        title="Cambiar Tarea (Fila)"
        onCreateNew={(name) => createTaskTypeOnTheFly(name, activeRowTaskSelector)}
        loading={creatingItem}
      />

      <SearchableSelector
        visible={!!activeRowParcelSelector}
        onClose={() => setActiveRowParcelSelector(null)}
        items={parcels}
        onSelect={(p) => {
          updateWorkerDetail(activeRowParcelSelector, 'parcel_id', p.id);
          setActiveRowParcelSelector(null);
        }}
        selectedId={selectedWorkers.find(w => w.rowId === activeRowParcelSelector)?.parcel_id}
        title="Cambiar Parcela (Fila)"
        onCreateNew={(name) => createParcelOnTheFly(name, activeRowParcelSelector)}
        loading={creatingItem}
      />

      <DatePickerModal
        visible={showDatePicker}
        date={date}
        onDateChange={(event, selectedDate) => {
          if (Platform.OS === 'android') setShowDatePicker(false);
          if (selectedDate) setDate(selectedDate);
        }}
        onDone={() => setShowDatePicker(false)}
        onCancel={() => setShowDatePicker(false)}
        styles={pickerStyles}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#fff" },
  loadingText: { marginTop: 12, color: "#64748b", fontWeight: "600" },
  content: { flex: 1 },
  scrollPadding: { padding: 16 },
  card: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 8 },
  row: { flexDirection: "row", gap: 12 },
  field: { gap: 6 },
  label: { fontSize: 10, fontWeight: "800", color: "#94a3b8", letterSpacing: 0.5 },
  dateSelector: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#f1f5f9", padding: 10, borderRadius: 10, height: 44 },
  dateText: { fontSize: 14, fontWeight: "700", color: "#1e293b" },
  input: { backgroundColor: "#f1f5f9", paddingHorizontal: 12, borderRadius: 10, height: 44, fontSize: 14, fontWeight: "600", color: "#1e293b" },
  selectorField: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 4 },
  selectorValue: { fontSize: 15, fontWeight: "700", color: "#1e293b", marginTop: 4 },
  placeholder: { color: "#cbd5e1" },
  divider: { height: 1, backgroundColor: "#f1f5f9", marginVertical: 12 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 8, marginBottom: 12, paddingHorizontal: 4 },
  sectionTitle: { fontSize: 11, fontWeight: "900", color: "#64748b", letterSpacing: 1 },
  addButton: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#ecfdf5", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  addButtonText: { fontSize: 11, fontWeight: "800", color: "#2e7d32" },
  addButtonTable: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 4, 
    backgroundColor: "#ecfdf5", 
    paddingHorizontal: 12, 
    paddingVertical: 8, 
    borderRadius: 8,
    marginTop: 8,
    alignSelf: 'flex-start'
  },
  
  // Estilos Excel
  excelContainer: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    borderWidth: 1,
    borderColor: "#f1f5f9"
  },
  excelTableWrapper: {
    flexDirection: "row",
  },
  fixedColumn: {
    backgroundColor: "#fff",
    zIndex: 10,
    borderRightWidth: 1,
    borderRightColor: "#e2e8f0",
  },
  fixedHeader: {
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  fixedRow: {
    justifyContent: "center",
  },
  excelHeader: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingBottom: 8,
    marginBottom: 8,
    height: 35,
    alignItems: "center",
  },
  excelHeaderCell: {
    fontSize: 11,
    fontWeight: "900",
    color: "#94a3b8",
    letterSpacing: 0.5,
    paddingHorizontal: 8,
  },
  excelRow: {
    flexDirection: "row",
    alignItems: "center",
    height: 65,
    borderBottomWidth: 1,
    borderBottomColor: "#f8fafc",
  },
  excelCell: {
    paddingHorizontal: 4,
  },
  excelCellSelector: {
    backgroundColor: "#f8fafc",
    borderRadius: 8,
    height: 44,
    justifyContent: "center",
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  excelWorkerName: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1e293b",
    paddingHorizontal: 8,
  },
  excelSelectorText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#475569",
    paddingHorizontal: 8,
  },
  excelInput: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    height: 40,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "700",
    color: "#1e293b",
  },
  excelTotalText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#2e7d32",
    textAlign: "right",
    paddingRight: 8,
  },
  workerItem: { backgroundColor: "#fff", borderRadius: 16, padding: 16, marginBottom: 12, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  workerHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  workerInfo: { flexDirection: "row", alignItems: "baseline", gap: 8 },
  workerName: { fontSize: 16, fontWeight: "800", color: "#1e293b" },
  workerTotalText: { fontSize: 14, fontWeight: "700", color: "#2e7d32" },
  taskSelectorMini: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 6, 
    backgroundColor: "#f1f5f9", 
    paddingHorizontal: 10, 
    paddingVertical: 6, 
    borderRadius: 8, 
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#e2e8f0"
  },
  taskSelectorMiniText: { fontSize: 13, fontWeight: "700", color: "#475569" },
  deleteWorkerBtn: { padding: 4 },
  computationGrid: { gap: 4 },
  gridHeader: { flexDirection: "row", paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: "#f8fafc" },
  gridLabel: { fontSize: 8, fontWeight: "900", color: "#94a3b8", letterSpacing: 0.5 },
  gridRow: { flexDirection: "row", alignItems: "center", gap: 8, paddingVertical: 4 },
  rowTitle: { flex: 1, fontSize: 13, fontWeight: "600", color: "#64748b" },
  rowTitleBtn: { flex: 1 },
  gridInput: { width: 65, backgroundColor: "#f8fafc", borderWidth: 1, borderColor: "#f1f5f9", borderRadius: 6, height: 30, textAlign: "center", fontSize: 13, fontWeight: "700", color: "#1e293b" },
  rowSubtotal: { width: 60, textAlign: "right", fontSize: 13, fontWeight: "700", color: "#1e293b" },
  textArea: { backgroundColor: "#fff", borderRadius: 12, padding: 14, marginTop: 8, height: 100, textAlignVertical: "top", fontSize: 14, color: "#1e293b", borderSize: 1, borderColor: "#f1f5f9" },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#fff", padding: 20, borderTopWidth: 1, borderTopColor: "#f1f5f9", flexDirection: "row", alignItems: "center", gap: 16 },
  footerInline: { 
    backgroundColor: "#fff", 
    padding: 20, 
    borderTopWidth: 1, 
    borderTopColor: "#f1f5f9", 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 16,
    borderRadius: 16, 
    elevation: 2, 
    shadowColor: "#000", 
    shadowOffset: { width: 0, height: 2 }, 
    shadowOpacity: 0.05, 
    shadowRadius: 8 
  },
  totalContainer: { flex: 0.4 },
  totalLabelFooter: { fontSize: 10, fontWeight: "800", color: "#94a3b8" },
  totalAmount: { fontSize: 22, fontWeight: "900", color: "#1e293b" },
  saveButton: { flex: 0.6, backgroundColor: "#2e7d32", height: 54, borderRadius: 14, flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 8, elevation: 4 },
  saveButtonText: { color: "#fff", fontSize: 13, fontWeight: "900" },
  emptyState: { alignItems: "center", justifyContent: "center", padding: 40, gap: 12 },
  emptyText: { color: "#94a3b8", fontSize: 14, fontWeight: "500" },
});

const pickerStyles = StyleSheet.create({
  iosPickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  iosPickerContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
  },
  iosPickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  iosPickerCancelText: {
    fontSize: 16,
    color: "#64748b",
    fontWeight: "600",
  },
  iosPickerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e293b",
  },
  iosPickerDoneText: {
    fontSize: 16,
    color: "#2e7d32",
    fontWeight: "700",
  },
  androidPickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  androidPickerContainer: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
  },
});
