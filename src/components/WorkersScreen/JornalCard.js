import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatEuro } from '../../utils/formatters';

const JornalCard = ({ jornal }) => {

  const isPaid = jornal.is_paid;
  const statusColor = isPaid ? "#2e7d32" : "#e67e22";

  return (
    <View 
      style={{ 
        flexDirection: "row", 
        alignItems: "center", 
        paddingVertical: 14, 
        borderBottomWidth: 1, 
        borderBottomColor: "#f1f5f9" 
      }}
    >
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 16, fontWeight: "700", color: "#1e293b", marginBottom: 2 }}>
          {jornal.worker}
        </Text>
        <View style={{ gap: 2 }}>
          <Text style={{ fontSize: 12, color: "#94a3b8", fontWeight: "600" }}>
            {jornal.dateDisplay} • {jornal.parcela}
          </Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          {jornal.task_type && (
              <Text style={{ fontSize: 11, fontWeight: "800", color: "#64748b", textTransform: "uppercase", backgroundColor: "#f1f5f9", paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 }}>
              {jornal.task_type}
            </Text>
          )}
          {jornal.concept && (
            <Text style={{ fontSize: 12, color: "#64748b", fontWeight: "500" }} numberOfLines={1}>
              {jornal.concept}
            </Text>
          )}
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 6, marginTop: 6, flexWrap: "wrap" }}>
            {jornal.work_days > 0 && jornal.work_days_price > 0 && (
              <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#ecfdf5", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, gap: 4, borderSize: 1, borderColor: "#d1fae5" }}>
                <MaterialCommunityIcons name="calendar-check" size={12} color="#059669" />
                <Text style={{ fontSize: 11, fontWeight: "800", color: "#059669" }}>
                  {jornal.work_days === 1 ? "1 jornal" : `${jornal.work_days} jornales`} <Text style={{ color: "#94a3b8", fontWeight: "400" }}>×</Text> {jornal.work_days_price}€
                </Text>
              </View>
            )}
            {jornal.hours > 0 && jornal.work_hours_price > 0 && (
              <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#eff6ff", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, gap: 4, borderSize: 1, borderColor: "#dbeafe" }}>
                <MaterialCommunityIcons name="clock-outline" size={12} color="#2563eb" />
                <Text style={{ fontSize: 11, fontWeight: "800", color: "#2563eb" }}>
                  {jornal.hours === 1 ? "1 hora" : `${jornal.hours} horas`} <Text style={{ color: "#94a3b8", fontWeight: "400" }}>×</Text> {jornal.work_hours_price}€
                </Text>
              </View>
            )}
            {jornal.area_qty > 0 && jornal.area_price > 0 && (
              <View style={{ flexDirection: "row", alignItems: "center", backgroundColor: "#fff7ed", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6, gap: 4, borderSize: 1, borderColor: "#ffedd5" }}>
                <MaterialCommunityIcons name="ruler-square" size={12} color="#ea580c" />
                <Text style={{ fontSize: 11, fontWeight: "800", color: "#ea580c" }}>
                  {jornal.area_qty} {jornal.area_unit === 'fanegas' ? 'f' : 'h'} <Text style={{ color: "#94a3b8", fontWeight: "400" }}>×</Text> {jornal.area_price}€
                  </Text>
              </View>
            )}
          </View>
        </View>
      </View>
      
      <View style={{ alignItems: "flex-end" }}>
        <Text style={{ fontSize: 16, fontWeight: "800", color: "#1b1f23" }}>
          {formatEuro(jornal.cost)}
        </Text>
        <View style={{ 
          marginTop: 4, 
          paddingHorizontal: 8, 
          paddingVertical: 2, 
          borderRadius: 6, 
          backgroundColor: isPaid ? "#e8f5e9" : "#fff3e0" 
        }}>
          <Text style={{ 
            fontSize: 10, 
            fontWeight: "700", 
            color: isPaid ? "#2e7d32" : "#ef6c00",
            textTransform: "uppercase"
          }}>
            {isPaid ? "Pagado" : "Pendiente"}
          </Text>
        </View>
      </View>
    </View>
  );
};

export default JornalCard;
