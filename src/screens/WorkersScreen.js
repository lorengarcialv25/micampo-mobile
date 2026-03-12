import React, { useState, useEffect, useRef, useCallback } from "react";
import { ScrollView, View, ActivityIndicator, Text, RefreshControl, TouchableOpacity } from "react-native";
import { useCrew } from "../context/CrewContext";
import { useCampaign } from "../context/CampaignContext";
import { useAuth } from "../context/AuthContext";
import { dypai } from "../lib/dypai";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import FilterBar from "../components/WorkersScreen/FilterBar";
import FilterModal from "../components/WorkersScreen/FilterModal";
import JornalesList from "../components/WorkersScreen/JornalesList";
import TasksList from "../components/WorkersScreen/TasksList";
import useWorkersFilters from "../hooks/useWorkersFilters";
import { formatDateFull } from "../utils/formatters";
import { useNavigation, useFocusEffect } from "@react-navigation/native";

export default function WorkersScreen() {
  const navigation = useNavigation();
  const [tabIndex, setTabIndex] = useState(0); // 0: Jornales, 1: Tareas
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [jornales, setJornales] = useState([]);
  const [tareas, setTareas] = useState([]);
  const [workers, setWorkers] = useState([]);
  const [parcels, setParcels] = useState([]);
  const hasLoadedInitial = useRef(false);
  const { openCrewModal } = useCrew();
  const { currentCampaignId } = useCampaign();
  const { isAuthenticated } = useAuth();
  
  // Función para cargar datos desde la API
  const loadData = useCallback(async (isRefresh = false) => {
      try {
        if (!isRefresh) {
          setLoading(true);
        }
        
        // Cargar trabajadores y parcelas en paralelo
        const [workersRes, parcelsRes, detailsRes, eventsRes] = await Promise.all([
          dypai.api.get('obtener_workers', { params: { sort_by: 'name', order: 'ASC' } }),
          dypai.api.get('obtener_parcels', { params: { sort_by: 'name', order: 'ASC' } }),
          dypai.api.get('obtener_work_event_details', {
            params: {
              sort_by: 'created_at',
              order: 'DESC',
              limit: 1000
            }
          }),
          dypai.api.get('obtener_work_events_completos', {
            params: {
              campaign_id: currentCampaignId,
              limit: 1000,
              offset: 0
            }
          })
        ]);

        // Check for errors
        if (workersRes.error) throw workersRes.error;
        if (parcelsRes.error) throw parcelsRes.error;
        if (detailsRes.error) throw detailsRes.error;
        if (eventsRes.error) throw eventsRes.error;

        // Procesar trabajadores
        const workersData = Array.isArray(workersRes.data) ? workersRes.data : [];
        setWorkers(workersData);

        // Procesar parcelas
        const parcelsData = Array.isArray(parcelsRes.data) ? parcelsRes.data : [];
        setParcels(parcelsData);

        // Crear mapas para búsqueda rápida
        const workersMap = {};
        workersData.forEach(w => { workersMap[w.id] = w; });

        const parcelsMap = {};
        parcelsData.forEach(p => { parcelsMap[p.id] = p; });

        // Procesar jornales (work_event_details)
        const detailsData = Array.isArray(detailsRes.data) ? detailsRes.data : [];

        // Transformar jornales al formato esperado
        const transformedJornales = detailsData.map(detail => {
          const worker = workersMap[detail.worker_id];
          return {
            id: detail.id,
            date: detail.created_at ? detail.created_at.split('T')[0] : new Date().toISOString().split('T')[0],
            dateDisplay: detail.created_at ? formatDateFull(new Date(detail.created_at)) : formatDateFull(new Date()),
            worker: detail.worker_name || worker?.name || 'Trabajador desconocido',
            worker_id: detail.worker_id,
            parcela: detail.parcel_name || 'Parcela desconocida',
            hours: detail.work_hours || 0,
            work_days: detail.work_days || 0,
            task_type: detail.task_type || null,
            concept: detail.concept || detail.work_event_concept || null,
            work_hours_price: detail.work_hours_price || 0,
            work_days_price: detail.work_days_price || 0,
            area_qty: detail.area_qty || 0,
            area_unit: detail.area_unit || 'fanegas',
            area_price: detail.area_price || 0,
            cost: parseFloat(detail.total_cost) || 0,
            is_paid: detail.is_paid === true || detail.is_paid === 'true',
            work_event_id: detail.work_event_id,
          };
        }).filter(j => j.cost > 0 || j.hours > 0 || j.work_days > 0 || j.area_qty > 0);

        setJornales(transformedJornales);

        // Procesar tareas (work_events)
        const eventsData = Array.isArray(eventsRes.data) ? eventsRes.data : [];

        // Transformar tareas al formato esperado
        const transformedTareas = eventsData.map(event => {
          const parcel = parcelsMap[event.parcel_id];
          
          // Usar los nombres que vienen del endpoint o fallback al mapa local
          const parcelName = event.parcel_names || event.parcel_name || parcel?.name || 'Parcela desconocida';
          const cropType = event.crop_types || event.crop_type || parcel?.crop_type || '';
          
          const date = new Date(event.date || event.created_at);
          const today = new Date();
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);
          
          let dateDisplay = '';
          if (date.toDateString() === today.toDateString()) {
            dateDisplay = `Hoy · ${formatDateFull(date)}`;
          } else if (date.toDateString() === yesterday.toDateString()) {
            dateDisplay = `Ayer · ${formatDateFull(date)}`;
          } else {
            dateDisplay = formatDateFull(date);
          }

          // Procesar detalles (workers asignados)
          const details = event.details || [];
          const workersAssigned = details
            .map(d => d.worker_name)
            .filter(Boolean)
            .filter((name, index, arr) => arr.indexOf(name) === index); // Únicos
          
          const workersCount = workersAssigned.length;
          const assignedTo = workersCount > 0 
            ? workersCount === 1 
              ? workersAssigned[0]
              : `${workersAssigned[0]} +${workersCount - 1}`
            : 'Por asignar';

          // Extraer tipos de tarea únicos de los detalles
          const taskTypes = details
            .map(d => d.task_type)
            .filter(Boolean)
            .filter((type, index, arr) => arr.indexOf(type) === index); // Únicos

          // Calcular costo total
          const cost = parseFloat(event.total_cost) || 0;

          return {
            id: event.id,
            concept: event.concept || event.description || event.task_type || 'Tarea',
            date: dateDisplay,
            dateRaw: event.date || event.created_at,
            parcela: cropType ? `${parcelName} · ${cropType}` : parcelName,
            parcelName: parcelName,
            cropType: cropType,
            assignedTo,
            workersCount,
            workersNames: workersAssigned,
            cost,
            task_type: event.task_type, // Tipo principal
            task_types: taskTypes, // Array de todos los tipos
            parcel_id: event.parcel_id,
            details: details, // Guardar detalles por si se necesitan después
          };
        });
        setTareas(transformedTareas);

      } catch (error) {
        console.error('Error cargando datos de trabajos:', error);
        // Mantener arrays vacíos en caso de error
        setJornales([]);
        setTareas([]);
        setWorkers([]);
        setParcels([]);
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
  }, [currentCampaignId, isAuthenticated]);

  // Cargar datos desde la API
  useEffect(() => {
    if (!isAuthenticated || !currentCampaignId) {
      setLoading(false);
      return;
    }

    loadData(false);
    hasLoadedInitial.current = true;
  }, [loadData, isAuthenticated, currentCampaignId]);

  // Recargar datos cuando se cambia al tab de tareas
  useEffect(() => {
    if (tabIndex === 1 && isAuthenticated && currentCampaignId && hasLoadedInitial.current) {
      // Recargar datos cuando se cambia al tab de tareas para asegurar que estén actualizados
      setRefreshing(true);
      loadData(true); // Usar refresh para no mostrar loading completo
    }
  }, [tabIndex, loadData, isAuthenticated, currentCampaignId]);

  // Refrescar automáticamente cuando la pantalla vuelve a estar enfocada
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated && currentCampaignId) {
        loadData(true); // Usar refresh para no mostrar loading completo
      }
    }, [loadData, isAuthenticated, currentCampaignId])
  );

  // Función para manejar el refresh
  const handleRefresh = () => {
    setRefreshing(true);
    loadData(true);
  };
  
  const {
    dateFrom,
    dateTo,
    selectedWorker,
    selectedParcela,
    workerOptions,
    parcelaOptions,
    filteredJornales,
    setDateFrom,
    setDateTo,
    setSelectedWorker,
    setSelectedParcela,
    resetFilters,
  } = useWorkersFilters(jornales);

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#fff", justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="small" color="#2e7d32" />
        <Text style={{ marginTop: 12, color: "#94a3b8", fontSize: 14, fontWeight: "500" }}>Cargando trabajos...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={{ paddingHorizontal: 20, paddingVertical: 12, backgroundColor: "#fff" }}>
        <View style={{ 
          flexDirection: 'row', 
          backgroundColor: '#f1f5f9', 
          borderRadius: 10, 
          padding: 3 
        }}>
          <TouchableOpacity 
            style={{ 
              flex: 1, 
              paddingVertical: 8, 
              alignItems: 'center', 
              borderRadius: 8,
              backgroundColor: tabIndex === 0 ? '#fff' : 'transparent',
            }}
            onPress={() => setTabIndex(0)}
          >
            <Text style={{ 
              fontSize: 12, 
              fontWeight: '700', 
              color: tabIndex === 0 ? '#1e293b' : '#94a3b8',
            }}>Jornales</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={{ 
              flex: 1, 
              paddingVertical: 8, 
              alignItems: 'center', 
              borderRadius: 8,
              backgroundColor: tabIndex === 1 ? '#fff' : 'transparent',
            }}
            onPress={() => setTabIndex(1)}
          >
            <Text style={{ 
              fontSize: 12, 
              fontWeight: '700', 
              color: tabIndex === 1 ? '#1e293b' : '#94a3b8',
            }}>Tareas</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={handleRefresh}
            tintColor="#2e7d32"
          />
        }
      >
        {tabIndex === 0 ? (
          <JornalesList 
            jornales={filteredJornales} 
            onOpenCrewModal={openCrewModal}
            onNavigateToPayments={() => navigation.navigate('PendingPayments')}
            dateFrom={dateFrom}
            dateTo={dateTo}
            selectedWorker={selectedWorker}
            selectedParcela={selectedParcela}
            onFilterPress={() => setShowFilterModal(true)}
          />
        ) : (
          <TasksList tasks={tareas} />
        )}
      </ScrollView>

      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        selectedWorker={selectedWorker}
        onWorkerChange={setSelectedWorker}
        selectedParcela={selectedParcela}
        onParcelaChange={setSelectedParcela}
        workerOptions={workers.map(w => w.name)}
        parcelaOptions={parcels.map(p => p.crop_type ? `${p.name} · ${p.crop_type}` : p.name)}
        onReset={resetFilters}
      />
    </View>
  );
}
