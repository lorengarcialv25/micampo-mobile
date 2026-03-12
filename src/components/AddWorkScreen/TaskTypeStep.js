import React from "react";
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Image, ActivityIndicator } from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { formatDateFull } from "../../utils/formatters";
import DatePickerModal from "./DatePickerModal";

const TASK_TYPES = [
  { value: "poda", label: "Poda", icon: "tree" },
  { value: "recoleccion", label: "Recolección", icon: "basket" },
  { value: "tratamiento", label: "Tratamiento", icon: "spray" },
  { value: "riego", label: "Riego", icon: "water" },
  { value: "otros", label: "Otros", icon: "tools" },
];

export default function TaskTypeStep({
  selectedTaskType,
  setSelectedTaskType,
  date,
  setDate,
  showDatePicker,
  setShowDatePicker,
  description,
  setDescription,
  concept,
  setConcept,
  handleDateChange,
  handleDatePickerDone,
  handleDatePickerCancel,
  fileUri,
  fileName,
  fileType,
  uploadingFile,
  onPickImage,
  onTakePhoto,
  onPickDocument,
  onRemoveFile,
}) {
  return (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Tipo de trabajo</Text>
      <Text style={styles.stepSubtitle}>¿Qué tipo de trabajo se realizó?</Text>

      <View style={styles.taskTypesGrid}>
        {TASK_TYPES.map((task) => (
          <TouchableOpacity
            key={task.value}
            style={[
              styles.taskTypeCard,
              selectedTaskType === task.value && styles.taskTypeCardSelected,
            ]}
            onPress={() => setSelectedTaskType(task.value)}
          >
            <MaterialCommunityIcons
              name={task.icon}
              size={32}
              color={selectedTaskType === task.value ? "#2e7d32" : "#607463"}
            />
            <Text
              style={[
                styles.taskTypeLabel,
                selectedTaskType === task.value && styles.taskTypeLabelSelected,
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
          activeOpacity={0.7}
        >
          <Ionicons name="calendar" size={20} color="#2e7d32" />
          <Text style={styles.dateButtonText}>
            {date instanceof Date ? formatDateFull(date) : formatDateFull(new Date(date))}
          </Text>
          <Ionicons name="chevron-down" size={18} color="#9ba9a0" />
        </TouchableOpacity>
      </View>

      <DatePickerModal
        visible={showDatePicker}
        date={date}
        onDateChange={handleDateChange}
        onDone={handleDatePickerDone}
        onCancel={handleDatePickerCancel}
        styles={styles}
      />

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

      {/* Sección de archivos */}
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Documento adjunto (opcional)</Text>
        {fileUri ? (
          <View style={styles.filePreview}>
            {fileType === "image" ? (
              <Image source={{ uri: fileUri }} style={styles.fileImage} resizeMode="cover" />
            ) : (
              <View style={styles.fileIconContainer}>
                <Ionicons name="document-text" size={32} color="#2e7d32" />
                <Text style={styles.fileName}>{fileName}</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.removeFileButton}
              onPress={onRemoveFile}
            >
              <Ionicons name="close-circle" size={24} color="#d32f2f" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.fileButtons}>
            <TouchableOpacity style={styles.fileButton} onPress={onTakePhoto}>
              <Ionicons name="camera-outline" size={20} color="#2e7d32" />
              <Text style={styles.fileButtonText}>Cámara</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.fileButton} onPress={onPickImage}>
              <Ionicons name="image-outline" size={20} color="#2e7d32" />
              <Text style={styles.fileButtonText}>Galería</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.fileButton} onPress={onPickDocument}>
              <Ionicons name="document-outline" size={20} color="#2e7d32" />
              <Text style={styles.fileButtonText}>PDF</Text>
            </TouchableOpacity>
          </View>
        )}
        {uploadingFile && (
          <View style={styles.uploadingIndicator}>
            <ActivityIndicator size="small" color="#2e7d32" />
            <Text style={styles.uploadingText}>Subiendo archivo...</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
    justifyContent: "space-between",
  },
  dateButtonText: {
    fontSize: 16,
    color: "#1b1f23",
    marginLeft: 10,
    flex: 1,
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
  iosPickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  iosPickerContainer: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  iosPickerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e0e0e0",
  },
  iosPickerTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1b1f23",
  },
  iosPickerCancelText: {
    fontSize: 16,
    color: "#666",
    fontWeight: "600",
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
    borderRadius: 12,
    padding: 20,
  },
  fileButtons: {
    flexDirection: "row",
    gap: 12,
    marginTop: 8,
  },
  fileButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f7f9f5",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e0e0e0",
    gap: 6,
  },
  fileButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2e7d32",
  },
  filePreview: {
    marginTop: 8,
    position: "relative",
  },
  fileImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    backgroundColor: "#f7f9f5",
  },
  fileIconContainer: {
    width: "100%",
    height: 120,
    backgroundColor: "#f7f9f5",
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  fileName: {
    marginTop: 8,
    fontSize: 14,
    color: "#607463",
    fontWeight: "500",
  },
  removeFileButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "#fff",
    borderRadius: 20,
  },
  uploadingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    gap: 8,
  },
  uploadingText: {
    fontSize: 13,
    color: "#607463",
  },
});
