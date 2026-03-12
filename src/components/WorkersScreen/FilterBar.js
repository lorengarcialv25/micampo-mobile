import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDate } from '../../utils/formatters';

const FilterBar = ({ dateFrom, dateTo, selectedWorker, selectedParcela, onPress }) => {
  const hasFilters = selectedWorker && selectedWorker !== 'Todos' || selectedParcela && selectedParcela !== 'Todas';
  
  return (
    <TouchableOpacity 
      activeOpacity={0.9}
      onPress={onPress}
      className="flex-row items-center bg-[#f8fafc] px-4 py-3 rounded-2xl border border-[#e2e8f0]"
    >
      <View className="w-10 h-10 rounded-xl bg-white justify-center items-center shadow-sm border border-[#f1f5f9]">
        <Ionicons name="search-outline" size={20} color="#64748b" />
      </View>
      
      <View className="flex-1 ml-3">
        <View className="flex-row items-center">
          <Text className="text-[14px] text-[#1e293b] font-bold" numberOfLines={1}>
            {hasFilters ? 'Filtros aplicados' : 'Filtrar por fecha o trabajador'}
          </Text>
          {hasFilters && (
            <View className="w-2 h-2 rounded-full bg-[#2e7d32] ml-2" />
          )}
        </View>
        <Text className="text-[12px] text-[#64748b] font-medium mt-0.5" numberOfLines={1}>
          {hasFilters 
            ? `${selectedWorker !== 'Todos' ? selectedWorker : 'Todos'} • ${selectedParcela !== 'Todas' ? selectedParcela : 'Todas'}`
            : `${formatDate(dateFrom)} - ${formatDate(dateTo)}`
          }
        </Text>
      </View>

      <View className="w-10 h-10 rounded-xl bg-[#e8f5e9] justify-center items-center">
        <Ionicons name="options-outline" size={20} color="#2e7d32" />
      </View>
    </TouchableOpacity>
  );
};

export default FilterBar;
