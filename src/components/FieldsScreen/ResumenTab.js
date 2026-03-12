import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { formatNumber } from "../../utils/formatters";

export default function ResumenTab({ field, members = [] }) {
  if (!field) return null;

  return (
    <View style={styles.container}>
      {/* Sección: Información General */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Información General</Text>
            <Text style={styles.sectionSubtitle}>Detalles técnicos y de cultivo</Text>
          </View>
          <View style={styles.iconCircle}>
            <Ionicons name="information-circle-outline" size={20} color="#2e7d32" />
          </View>
        </View>

        <View style={styles.grid}>
          <InfoItem label="SUPERFICIE (HA)" value={`${formatNumber(field.area_ha)} ha`} />
          <InfoItem 
            label="SUPERFICIE (FANEGAS)" 
            value={field.area_fanegas ? `${formatNumber(field.area_fanegas)} fanegas` : "N/A"} 
          />
          <InfoItem label="VARIEDAD" value={field.variety || "No especificada"} />
          <InfoItem label="TIPO DE RIEGO" value={field.irrigation_type || "Secano"} />
          
          <View style={styles.fullWidthItem}>
            <Text style={styles.itemLabel}>MARCO DE PLANTACIÓN</Text>
            <Text style={styles.itemValue}>
              {field.planting_frame ? `${formatNumber(field.planting_frame)} plantas/ha` : "No especificado"}
            </Text>
            {field.distance_between_rows && field.distance_between_plants && (
              <Text style={styles.itemSubvalue}>
                ({formatNumber(field.distance_between_rows)}m x {formatNumber(field.distance_between_plants)}m)
              </Text>
            )}
          </View>

          <InfoItem 
            label="TOTAL PLANTAS (EST.)" 
            value={field.area_ha && field.planting_frame 
              ? `${formatNumber(Math.round(field.area_ha * field.planting_frame))} plantas` 
              : "N/A"}
            highlight
          />
          <InfoItem label="POLÍGONO / PARCELA" value={field.cadastral_reference || "N/A"} />
        </View>

        {field.sigpac_province && (
          <View style={styles.sigpacBox}>
            <View style={styles.sigpacInfo}>
              <Text style={styles.sigpacLabel}>REFERENCIA SIGPAC</Text>
              <Text style={styles.sigpacValue}>
                Prov: {field.sigpac_province} | Mun: {field.sigpac_municipality} | Pol: {field.sigpac_polygon} | Par: {field.sigpac_parcel}
              </Text>
            </View>
          </View>
        )}

        <View style={styles.divider} />
        <InfoItem label="FECHA DE PLANTACIÓN" value={field.planting_date || "Desconocida"} />
      </View>

      {/* Sección: Arrendamiento (si aplica) */}
      {field.is_leased && (
        <View style={[styles.sectionCard, styles.leaseCard]}>
          <View style={styles.leaseHeader}>
            <View style={styles.leaseIconBox}>
              <Ionicons name="person-outline" size={20} color="#b45309" />
            </View>
            <View>
              <Text style={styles.leaseTitle}>Estado de Arrendamiento</Text>
              <Text style={styles.leaseSubtitle}>Parcela Arrendada</Text>
            </View>
          </View>
          
          <View style={styles.leaseGrid}>
            <View style={styles.leaseItem}>
              <Text style={styles.leaseLabel}>ARRENDATARIO</Text>
              <Text style={styles.leaseValue}>{field.lessee_name || "No especificado"}</Text>
            </View>
            <View style={styles.leaseItem}>
              <Text style={styles.leaseLabel}>% PROD. ARRENDADOR</Text>
              <Text style={styles.leaseValue}>
                {field.lease_percentage ? `${formatNumber(field.lease_percentage)}%` : "N/A"}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Sección: Observaciones */}
      {field.observations && (
        <View style={styles.sectionCard}>
          <View style={styles.obsHeader}>
            <Ionicons name="document-text-outline" size={18} color="#94a3b8" />
            <Text style={styles.obsTitle}>OBSERVACIONES</Text>
          </View>
          <Text style={styles.obsText}>{field.observations}</Text>
        </View>
      )}

      {/* Sección: Acceso */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Acceso</Text>
        <Text style={styles.sectionSubtitle}>Usuarios con acceso a esta parcela</Text>
        
        <View style={styles.membersList}>
          {members.length === 0 ? (
            <Text style={styles.emptyMembersText}>Solo tú tienes acceso.</Text>
          ) : (
            members.map((member, i) => (
              <View key={i} style={styles.memberItem}>
                <Image 
                  source={{ uri: `https://ui-avatars.com/api/?name=Usuario&background=random` }} 
                  style={styles.memberAvatar} 
                />
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>Usuario {member.user_id?.substring(0, 6)}</Text>
                  <Text style={styles.memberRole}>{member.role || "Colaborador"}</Text>
                </View>
              </View>
            ))
          )}
        </View>
      </View>
    </View>
  );
}

function InfoItem({ label, value, highlight }) {
  return (
    <View style={styles.gridItem}>
      <Text style={styles.itemLabel}>{label}</Text>
      <Text style={[styles.itemValue, highlight && styles.highlightValue]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  sectionCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#1e293b", letterSpacing: -0.5 },
  sectionSubtitle: { fontSize: 13, color: "#64748b", fontWeight: "500", marginTop: 2 },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f0fdf4",
    justifyContent: "center",
    alignItems: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -10,
  },
  gridItem: {
    width: "50%",
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  fullWidthItem: {
    width: "100%",
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  itemLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#94a3b8",
    letterSpacing: 1,
    marginBottom: 4,
  },
  itemValue: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1e293b",
  },
  itemSubvalue: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "500",
    marginTop: 2,
  },
  highlightValue: {
    color: "#2e7d32",
  },
  sigpacBox: {
    backgroundColor: "#eff6ff",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#dbeafe",
    marginBottom: 20,
  },
  sigpacLabel: {
    fontSize: 9,
    fontWeight: "900",
    color: "#3b82f6",
    letterSpacing: 1,
    marginBottom: 4,
  },
  sigpacValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1e40af",
  },
  divider: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginBottom: 20,
  },
  leaseCard: {
    backgroundColor: "#fffbeb",
    borderColor: "#fef3c7",
  },
  leaseHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 20,
  },
  leaseIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#fef3c7",
    justifyContent: "center",
    alignItems: "center",
  },
  leaseTitle: { fontSize: 15, fontWeight: "800", color: "#92400e" },
  leaseSubtitle: { fontSize: 12, color: "#b45309", fontWeight: "600" },
  leaseGrid: {
    flexDirection: "row",
    gap: 20,
  },
  leaseItem: { flex: 1 },
  leaseLabel: { fontSize: 9, fontWeight: "900", color: "#b45309", letterSpacing: 0.5, marginBottom: 4 },
  leaseValue: { fontSize: 14, fontWeight: "700", color: "#78350f" },
  obsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  obsTitle: {
    fontSize: 10,
    fontWeight: "900",
    color: "#94a3b8",
    letterSpacing: 1,
  },
  obsText: {
    fontSize: 14,
    color: "#334155",
    lineHeight: 20,
    fontWeight: "500",
  },
  membersList: { marginTop: 16 },
  memberItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  memberAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 12,
  },
  memberInfo: { flex: 1 },
  memberName: { fontSize: 14, fontWeight: "700", color: "#1e293b" },
  memberRole: { fontSize: 11, color: "#64748b", fontWeight: "600", textTransform: "uppercase" },
  emptyMembersText: { fontSize: 14, color: "#64748b", fontStyle: "italic", marginTop: 10 },
});
