import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import JornalCard from './JornalCard';
import FilterBar from './FilterBar';
import { dypai } from '../../lib/dypai';
import { useAuth } from '../../context/AuthContext';

const JornalesList = ({ jornales, onOpenCrewModal, onNavigateToPayments, dateFrom, dateTo, selectedWorker, selectedParcela, onFilterPress }) => {
  const { isAuthenticated } = useAuth();
  const [workersCount, setWorkersCount] = useState(0);
  const [loadingCount, setLoadingCount] = useState(true);

  // Cargar conteo de trabajadores
  useEffect(() => {
    const loadWorkersCount = async () => {
      if (!isAuthenticated) {
        setLoadingCount(false);
        return;
      }

      try {
        setLoadingCount(true);
        const { data, error } = await dypai.api.get('obtener_workers', {
          params: { sort_by: 'name', order: 'ASC' }
        });
        if (error) throw error;

        const workersData = Array.isArray(data) ? data : [];
        setWorkersCount(workersData.length);
      } catch (error) {
        console.error('Error cargando conteo de trabajadores:', error);
        setWorkersCount(0);
      } finally {
        setLoadingCount(false);
      }
    };

    loadWorkersCount();
  }, [isAuthenticated]);

  return (
    <>
      {/* Resumen Superior: Cuadrilla y Pagos en paralelo */}
      <View style={{ flexDirection: "row", gap: 12, marginBottom: 16 }}>
        {/* Card Cuadrilla */}
        <TouchableOpacity 
          onPress={onOpenCrewModal}
          activeOpacity={0.8}
          style={{ 
            flex: 1, 
            backgroundColor: "#fff", 
            borderRadius: 16, 
            padding: 14, 
            borderWidth: 1, 
            borderColor: "#f1f5f9",
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
            elevation: 2
          }}
        >
          <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
            <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: "#e8f5e9", justifyContent: "center", alignItems: "center" }}>
              <Ionicons name="people" size={18} color="#2e7d32" />
            </View>
            <Ionicons name="chevron-forward" size={14} color="#cbd5e1" />
          </View>
          <Text style={{ color: "#64748b", fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 }}>Mi Cuadrilla</Text>
          {loadingCount ? (
            <ActivityIndicator size="small" color="#2e7d32" style={{ alignSelf: 'flex-start', marginTop: 4 }} />
          ) : (
            <Text style={{ color: "#1b1f23", fontSize: 20, fontWeight: "800", marginTop: 2 }}>{workersCount} <Text style={{ fontSize: 12, color: "#94a3b8", fontWeight: "600" }}>trab.</Text></Text>
          )}
        </TouchableOpacity>

        {/* Card Pagos */}
        {onNavigateToPayments && (
          <TouchableOpacity 
            onPress={onNavigateToPayments}
            activeOpacity={0.8}
            style={{ 
              flex: 1, 
              backgroundColor: "#fff", 
              borderRadius: 16, 
              padding: 14, 
              borderWidth: 1, 
              borderColor: "#f1f5f9",
              shadowColor: "#000",
              shadowOffset: { width: 0, height: 1 },
              shadowOpacity: 0.05,
              shadowRadius: 2,
              elevation: 2
            }}
          >
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: "#fff3e0", justifyContent: "center", alignItems: "center" }}>
                <MaterialCommunityIcons name="wallet-outline" size={18} color="#e67e22" />
              </View>
              <Ionicons name="chevron-forward" size={14} color="#cbd5e1" />
            </View>
            <Text style={{ color: "#64748b", fontSize: 11, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 }}>Pagos</Text>
            <Text style={{ color: "#1b1f23", fontSize: 14, fontWeight: "800", marginTop: 6 }}>Pendientes</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Barra de filtros integrada */}
      {onFilterPress && (
        <View style={{ marginBottom: 20 }}>
          <FilterBar
            dateFrom={dateFrom}
            dateTo={dateTo}
            selectedWorker={selectedWorker}
            selectedParcela={selectedParcela}
            onPress={onFilterPress}
          />
        </View>
      )}

      <Text style={{ fontSize: 12, fontWeight: "900", color: "#94a3b8", textTransform: "uppercase", letterSpacing: 1, marginBottom: 12 }}>Jornales ({jornales.length})</Text>
      {jornales.length === 0 ? (
        <View style={{ alignItems: "center", justifyContent: "center", paddingVertical: 60 }}>
          <Ionicons name="search-outline" size={48} color="#cbd5e1" />
          <Text style={{ fontSize: 16, fontWeight: "800", color: "#1b1f23", marginTop: 16 }}>No hay jornales con estos filtros</Text>
          <Text style={{ fontSize: 13, color: "#94a3b8", marginTop: 6, textAlign: "center", fontWeight: "500" }}>Ajusta los filtros para ver más resultados</Text>
        </View>
      ) : (
        jornales.map((j) => <JornalCard key={j.id} jornal={j} />)
      )}
    </>
  );
};

export default JornalesList;
