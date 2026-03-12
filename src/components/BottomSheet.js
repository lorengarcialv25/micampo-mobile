import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from "react-native";
import Modal from "react-native-modal";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function BottomSheet({
  visible,
  onClose,
  children,
  title,
  showHandle = true,
  snapPoints = ["75%"],
}) {
  const insets = useSafeAreaInsets();
  const [closeButtonPressed, setCloseButtonPressed] = useState(false);
  const [isLandscape, setIsLandscape] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return width > height;
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      setIsLandscape(window.width > window.height);
    });

    return () => subscription?.remove();
  }, []);

  const { width, height } = Dimensions.get('window');
  const sheetHeight = isLandscape 
    ? height - insets.top - insets.bottom
    : undefined;

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      onSwipeComplete={onClose}
      swipeDirection={["down"]}
      style={styles.modal}
      backdropOpacity={0.5}
      backdropTransitionOutTiming={0}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      animationInTiming={300}
      animationOutTiming={250}
      useNativeDriver={true}
      hideModalContentWhileAnimating={true}
      propagateSwipe={true}
      avoidKeyboard={false}
    >
      <View style={[
        styles.sheet, 
        isLandscape && styles.sheetLandscape,
        { 
          paddingBottom: Math.max(insets.bottom, 16),
          paddingTop: isLandscape ? Math.max(insets.top, 0) : 0,
          paddingLeft: isLandscape ? Math.max(insets.left, 0) : 0,
          paddingRight: isLandscape ? Math.max(insets.right, 0) : 0,
          height: isLandscape ? sheetHeight : (snapPoints && snapPoints[0] ? snapPoints[0] : "75%"),
          maxHeight: isLandscape ? undefined : "80%",
        }
      ]}>
        {/* Header con handle y título */}
          <View style={styles.headerSection}>
            {showHandle && (
              <View style={styles.handleContainer}>
                <View style={styles.handleBar} />
              </View>
            )}

            {title && (
              <View style={[
                styles.header,
                isLandscape && {
                  paddingLeft: Math.max(insets.left, 20),
                  paddingRight: Math.max(insets.right, 20),
                }
              ]}>
                <View style={styles.headerContent}>
                  {typeof title === "string" ? (
                    <Text style={styles.title}>{title}</Text>
                  ) : (
                    title
                  )}
                </View>
                <TouchableOpacity
                  onPress={onClose}
                  onPressIn={() => setCloseButtonPressed(true)}
                  onPressOut={() => setCloseButtonPressed(false)}
                  style={[
                    styles.closeButton,
                    closeButtonPressed && styles.closeButtonPressed,
                  ]}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Contenido */}
          <View style={styles.content}>{children}</View>
        </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modal: {
    justifyContent: "flex-end",
    margin: 0,
  },
  keyboardAvoid: {
    justifyContent: "flex-end",
  },
  sheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
    // Sombra para iOS
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    // Elevación para Android
    elevation: 24,
  },
  sheetLandscape: {
    // Mantener bordes superiores redondeados ya que se abre desde abajo
    // Solo ajustar altura para aprovechar espacio
  },
  headerSection: {
    backgroundColor: "#ffffff",
  },
  handleContainer: {
    alignItems: "center",
    paddingVertical: 12,
  },
  handleBar: {
    width: 40,
    height: 4,
    backgroundColor: "#D1D5DB",
    borderRadius: 2,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1F2937",
    letterSpacing: 0.3,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  closeButtonPressed: {
    backgroundColor: "#E5E7EB",
    transform: [{ scale: 0.95 }],
  },
  content: {
    flex: 1,
  },
});
