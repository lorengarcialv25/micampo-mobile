import React from "react";
import { View, Text, TouchableOpacity, Modal, TouchableWithoutFeedback, Platform } from "react-native";

let DateTimePicker;
if (Platform.OS !== "web") {
  try {
    DateTimePicker = require("@react-native-community/datetimepicker").default;
  } catch (e) {
    console.warn("DateTimePicker no disponible:", e);
    DateTimePicker = null;
  }
} else {
  DateTimePicker = null;
}

export default function DatePickerModal({
  visible,
  date,
  onDateChange,
  onDone,
  onCancel,
  styles: customStyles,
}) {
  if (!visible || Platform.OS === "web" || !DateTimePicker) {
    return null;
  }

  return Platform.OS === "ios" ? (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent={true}
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={customStyles.iosPickerOverlay}>
          <TouchableWithoutFeedback>
            <View style={customStyles.iosPickerContainer}>
              <View style={customStyles.iosPickerHeader}>
                <TouchableOpacity onPress={onCancel} activeOpacity={0.7}>
                  <Text style={customStyles.iosPickerCancelText}>Cancelar</Text>
                </TouchableOpacity>
                <Text style={customStyles.iosPickerTitle}>Fecha del trabajo</Text>
                <TouchableOpacity onPress={onDone} activeOpacity={0.7}>
                  <Text style={customStyles.iosPickerDoneText}>Listo</Text>
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={date}
                mode="date"
                display="spinner"
                onChange={onDateChange}
                maximumDate={new Date()}
              />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  ) : (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent={true}
    >
      <TouchableWithoutFeedback onPress={onCancel}>
        <View style={customStyles.androidPickerOverlay}>
          <TouchableWithoutFeedback>
            <View style={customStyles.androidPickerContainer}>
              <DateTimePicker
                value={date}
                mode="date"
                display="default"
                onChange={onDateChange}
                maximumDate={new Date()}
              />
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}
