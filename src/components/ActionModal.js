import React, { useRef, useEffect } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Modal, 
  TouchableWithoutFeedback,
  Animated,
  PanResponder,
  Dimensions,
  Easing
} from "react-native";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function ActionModal({ visible, onClose, onAction }) {
  const panY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      // Abrir el modal con animación
      Animated.parallel([
        Animated.spring(translateY, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
      panY.setValue(0);
    } else {
      // Cerrar el modal con animación
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (e, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (e, gestureState) => {
        if (gestureState.dy > 100) {
          handleClose();
        } else {
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: true,
            bounciness: 10
          }).start();
        }
      }
    })
  ).current;

  const handleClose = () => {
    // Resetear panY antes de animar el cierre
    panY.setValue(0);
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 350,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  return (
    <Modal
      animationType="none"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        {/* Backdrop animado */}
        <TouchableWithoutFeedback onPress={handleClose}>
          <Animated.View 
            style={[
              styles.backdrop,
              {
                opacity: opacity,
              },
            ]} 
          />
        </TouchableWithoutFeedback>
        
        {/* Sheet animado */}
        <Animated.View 
          style={[
            styles.sheetContainer,
            { 
              transform: [
                { translateY: Animated.add(translateY, panY) }
              ] 
            }
          ]}
          {...panResponder.panHandlers}
        >
          <View style={styles.handleContainer}>
             <View style={styles.handleBar} />
          </View>
          
          <Text style={styles.sheetTitle}>¿Qué quieres hacer?</Text>

          {/* BOTÓN IA DESTACADO */}
          <TouchableOpacity 
            style={styles.aiButton} 
            onPress={() => onAction('voice_ai')}
            activeOpacity={0.9}
          >
            <View style={styles.aiIconBox}>
              <MaterialCommunityIcons name="microphone" size={28} color="#fff" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.aiTitle}>Asistente de Voz</Text>
              <Text style={styles.aiSubtitle}>"He echado gasoil y podado..."</Text>
            </View>
            <View style={styles.aiBadge}>
              <Text style={styles.aiBadgeText}>IA</Text>
            </View>
          </TouchableOpacity>

          <View style={styles.separator} />

          {/* OPCIONES MANUALES */}
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => onAction('trabajo')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#e8f5e9' }]}>
              <MaterialCommunityIcons name="hard-hat" size={24} color="#2e7d32" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.actionTitle}>Añadir Trabajo</Text>
              <Text style={styles.actionSubtitle}>Registrar trabajo con trabajadores</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => onAction('albaran')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#fff3e0' }]}>
              <MaterialCommunityIcons name="truck-delivery" size={24} color="#ef6c00" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.actionTitle}>Registrar Albarán</Text>
              <Text style={styles.actionSubtitle}>Entrada de cosecha</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => onAction('transaccion')}
            activeOpacity={0.7}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#e3f2fd' }]}>
              <Ionicons name="wallet" size={24} color="#1976d2" />
            </View>
            <View style={styles.textContainer}>
              <Text style={styles.actionTitle}>Gastos e Ingresos</Text>
              <Text style={styles.actionSubtitle}>Registrar transacciones financieras</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheetContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    paddingTop: 10,
    elevation: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  handleContainer: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 5,
  },
  handleBar: {
    width: 40,
    height: 5,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1b1f23',
    marginBottom: 15,
    marginLeft: 5,
  },
  
  // Estilos Botón IA
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1b1f23', // Negro/Gris oscuro muy pro
    padding: 16,
    borderRadius: 16,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 5,
  },
  aiIconBox: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  aiTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 2,
  },
  aiSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontStyle: 'italic',
  },
  aiBadge: {
    backgroundColor: '#2e7d32',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  aiBadgeText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 10,
  },

  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginBottom: 20,
    marginHorizontal: 10,
  },

  // Estilos Botones Normales
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff', 
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginBottom: 8,
    borderRadius: 12,
  },
  iconContainer: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  textContainer: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 13,
    color: '#757575',
  }
});
