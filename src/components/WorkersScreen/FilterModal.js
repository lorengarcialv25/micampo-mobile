import React, { useState, useMemo } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Pressable,
  ScrollView, 
  StyleSheet, 
  Platform,
  Modal,
  TouchableWithoutFeedback
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { formatDateFull } from '../../utils/formatters';
import BottomSheet from '../BottomSheet';
import SearchableSelector, { SearchableSelectorContent } from '../SearchableSelector';

// DateTimePicker solo para iOS/Android, no para web
let DateTimePicker;
if (Platform.OS !== 'web') {
  DateTimePicker = require('@react-native-community/datetimepicker').default;
}

const FilterModal = ({
  visible,
  onClose,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  selectedWorker,
  onWorkerChange,
  selectedParcela,
  onParcelaChange,
  workerOptions,
  parcelaOptions,
  onReset,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState('from'); // 'from' | 'to'
  const [tempDate, setTempDate] = useState(null); // Para iOS: fecha temporal mientras se selecciona
  
  const [showWorkerSelector, setShowWorkerSelector] = useState(false);
  const [showParcelaSelector, setShowParcelaSelector] = useState(false);

  // Asegurar que "Todas" y "Todos" estén presentes
  const workersForSelector = useMemo(() => {
    const list = [...workerOptions];
    if (!list.includes("Todos")) list.unshift("Todos");
    return list;
  }, [workerOptions]);

  const parcelasForSelector = useMemo(() => {
    const list = [...parcelaOptions];
    if (!list.includes("Todas")) list.unshift("Todas");
    return list;
  }, [parcelaOptions]);

  const onDateChange = (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowPicker(false);
      if (selectedDate) {
        if (pickerMode === 'from') {
          onDateFromChange(selectedDate);
        } else {
          onDateToChange(selectedDate);
        }
      }
    } else if (Platform.OS === 'ios') {
      // En iOS con display="spinner", onChange se dispara mientras el usuario selecciona
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    }
  };

  const handleDatePickerDone = () => {
    // En iOS, confirmamos la fecha temporal cuando el usuario presiona "Listo"
    if (Platform.OS === 'ios' && tempDate) {
      if (pickerMode === 'from') {
        onDateFromChange(tempDate);
      } else {
        onDateToChange(tempDate);
      }
      setTempDate(null);
    }
    setShowPicker(false);
  };

  const handleDatePickerCancel = () => {
    setTempDate(null);
    setShowPicker(false);
  };

  const handleDateInputPress = (mode) => {
    console.log('handleDateInputPress llamado con mode:', mode);
    setPickerMode(mode);
    setTempDate(mode === 'from' ? dateFrom : dateTo);
    setShowPicker(true);
    console.log('showPicker establecido a true');
  };

  const handleReset = () => {
    onReset();
    setShowWorkerSelector(false);
    setShowParcelaSelector(false);
  };

  const handleClose = () => {
    onClose();
    setShowWorkerSelector(false);
    setShowParcelaSelector(false);
  };

  return (
    <>
      <BottomSheet
        visible={visible}
        onClose={handleClose}
        title={showWorkerSelector ? "Seleccionar Trabajador" : showParcelaSelector ? "Seleccionar Parcela" : "Filtros"}
        showHandle={true}
        snapPoints={["85%"]}
        enablePanDownToClose={!showWorkerSelector && !showParcelaSelector}
        onBackdropPress={true}
      >
        <View style={styles.contentWrapper}>
          {showParcelaSelector ? (
            <SearchableSelectorContent 
              items={parcelasForSelector.map(p => ({ id: p, name: p, icon: p === "Todas" ? "apps-outline" : "location-outline" }))}
              onSelect={(item) => {
                onParcelaChange(item.id);
                setShowParcelaSelector(false);
              }}
              onClose={() => setShowParcelaSelector(false)}
              selectedId={selectedParcela}
            />
          ) : showWorkerSelector ? (
            <SearchableSelectorContent 
              items={workersForSelector.map(w => ({ id: w, name: w, icon: w === "Todos" ? "people-outline" : "person-outline" }))}
              onSelect={(item) => {
                onWorkerChange(item.id);
                setShowWorkerSelector(false);
              }}
              onClose={() => setShowWorkerSelector(false)}
              selectedId={selectedWorker}
            />
          ) : (
            <>
              <ScrollView 
                style={styles.modalBody} 
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 20 }}
                nestedScrollEnabled={true}
                keyboardShouldPersistTaps="handled"
              >
                  <Text style={styles.filterSectionTitle}>Rango de Fechas</Text>
                  <View style={styles.dateRow}>
                    <View style={styles.dateCol}>
                      <Text style={styles.dateLabel}>Desde</Text>
                      <Pressable 
                        style={({ pressed }) => [
                          styles.dateInput,
                          pressed && styles.dateInputPressed
                        ]}
                        onPress={() => {
                          console.log('Pressable Desde presionado');
                          handleDateInputPress('from');
                        }}
                      >
                        <Ionicons name="calendar-outline" size={18} color="#2e7d32" />
                        <Text style={styles.dateText}>{formatDateFull(dateFrom)}</Text>
                      </Pressable>
                    </View>
                    <View style={styles.dateCol}>
                      <Text style={styles.dateLabel}>Hasta</Text>
                      <Pressable 
                        style={({ pressed }) => [
                          styles.dateInput,
                          pressed && styles.dateInputPressed
                        ]}
                        onPress={() => {
                          console.log('Pressable Hasta presionado');
                          handleDateInputPress('to');
                        }}
                      >
                        <Ionicons name="calendar-outline" size={18} color="#2e7d32" />
                        <Text style={styles.dateText}>{formatDateFull(dateTo)}</Text>
                      </Pressable>
                    </View>
                  </View>

                  <Text style={styles.filterSectionTitle}>Parcela</Text>
                  <TouchableOpacity 
                    style={styles.selectorTrigger}
                    onPress={() => {
                      console.log('Abriendo selector de parcela');
                      setShowParcelaSelector(true);
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Ionicons name="location-outline" size={20} color="#2e7d32" />
                      <Text style={[
                        styles.selectorTriggerText,
                        selectedParcela === "Todas" && styles.selectorPlaceholder
                      ]}>
                        {selectedParcela}
                      </Text>
                    </View>
                    <Ionicons name="chevron-down" size={18} color="#94a3b8" />
                  </TouchableOpacity>

                  <Text style={styles.filterSectionTitle}>Trabajador</Text>
                  <TouchableOpacity 
                    style={styles.selectorTrigger}
                    onPress={() => {
                      console.log('Abriendo selector de trabajador');
                      setShowWorkerSelector(true);
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Ionicons name="person-outline" size={20} color="#2e7d32" />
                      <Text style={[
                        styles.selectorTriggerText,
                        selectedWorker === "Todos" && styles.selectorPlaceholder
                      ]}>
                        {selectedWorker}
                      </Text>
                    </View>
                    <Ionicons name="chevron-down" size={18} color="#94a3b8" />
                  </TouchableOpacity>

              </ScrollView>

              <View style={styles.modalFooter}>
                <TouchableOpacity 
                  style={styles.resetButton}
                  onPress={handleReset}
                >
                  <Text style={styles.resetButtonText}>Limpiar</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.applyButton}
                  onPress={handleClose}
                >
                  <Text style={styles.applyButtonText}>Aplicar</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </BottomSheet>

      {/* Date Picker - Solo para iOS/Android */}
      {showPicker && Platform.OS !== 'web' && DateTimePicker && (
        <>
          {Platform.OS === 'ios' ? (
            <Modal
              visible={showPicker}
              transparent={true}
              animationType="fade"
              onRequestClose={handleDatePickerCancel}
              statusBarTranslucent={true}
            >
              <TouchableWithoutFeedback onPress={handleDatePickerCancel}>
                <View style={styles.iosPickerOverlay}>
                  <TouchableWithoutFeedback>
                    <View style={styles.iosPickerContainer}>
                      <View style={styles.iosPickerHeader}>
                        <TouchableOpacity onPress={handleDatePickerCancel} activeOpacity={0.7}>
                          <Text style={styles.iosPickerCancelText}>Cancelar</Text>
                        </TouchableOpacity>
                        <Text style={styles.iosPickerTitle}>
                          {pickerMode === 'from' ? 'Fecha desde' : 'Fecha hasta'}
                        </Text>
                        <TouchableOpacity onPress={handleDatePickerDone} activeOpacity={0.7}>
                          <Text style={styles.iosPickerDoneText}>Listo</Text>
                        </TouchableOpacity>
                      </View>
                      <DateTimePicker
                        value={tempDate || (pickerMode === 'from' ? dateFrom : dateTo)}
                        mode="date"
                        display="spinner"
                        onChange={onDateChange}
                        maximumDate={pickerMode === 'to' ? new Date() : dateTo}
                        minimumDate={pickerMode === 'from' ? undefined : dateFrom}
                      />
                    </View>
                  </TouchableWithoutFeedback>
                </View>
              </TouchableWithoutFeedback>
            </Modal>
          ) : (
            <Modal
              visible={showPicker}
              transparent={true}
              animationType="fade"
              onRequestClose={handleDatePickerCancel}
              statusBarTranslucent={true}
            >
              <TouchableWithoutFeedback onPress={handleDatePickerCancel}>
                <View style={styles.androidPickerOverlay}>
                  <View style={styles.androidPickerContainer}>
                    <DateTimePicker
                      value={pickerMode === 'from' ? dateFrom : dateTo}
                      mode="date"
                      display="default"
                      onChange={onDateChange}
                      maximumDate={pickerMode === 'to' ? new Date() : dateTo}
                      minimumDate={pickerMode === 'from' ? undefined : dateFrom}
                    />
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </Modal>
          )}
        </>
      )}
    </>
  );
};

const styles = StyleSheet.create({
  contentWrapper: {
    flex: 1,
  },
  modalBody: {
    padding: 20,
    flex: 1,
  },
  filterSectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#333',
    marginBottom: 12,
    marginTop: 8,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  dateCol: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
    fontWeight: '600',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f7f9f5',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e6df',
    gap: 10,
  },
  dateInputPressed: {
    backgroundColor: '#e8f5e9',
    opacity: 0.8,
  },
  dateText: {
    fontSize: 14,
    color: '#1b1f23',
    fontWeight: '600',
  },
  selectorTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f7f9f5',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e6df',
    marginBottom: 20,
  },
  selectorTriggerText: {
    fontSize: 14,
    color: '#1b1f23',
    fontWeight: '600',
  },
  selectorPlaceholder: {
    color: '#94a3b8',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  resetButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  resetButtonText: {
    color: '#666',
    fontSize: 15,
    fontWeight: '700',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: '#2e7d32',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  iosPickerOverlay: {
    flex: 1,
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
    fontWeight: '600',
  },
  iosPickerDoneText: {
    fontSize: 16,
    color: '#2e7d32',
    fontWeight: '700',
  },
  androidPickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  androidPickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
});

export default FilterModal;
