import "react-native-gesture-handler";
import "./global.css";
import React from "react";
import { registerRootComponent } from "expo";
import { StatusBar, StyleSheet, View, Platform, ActivityIndicator } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import AppNavigator from "./src/navigation/AppNavigator";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { CampaignProvider } from "./src/context/CampaignContext";
import { CrewProvider } from "./src/context/CrewContext";

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#2e7d32",
    background: "#f7f9f5",
    card: "#ffffff",
    text: "#1b1f23",
    border: "#d6e2d1",
  },
};

function AppContent() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2e7d32" />
      </View>
    );
  }

  return (
    <CampaignProvider>
      <CrewProvider>
        <NavigationContainer theme={navTheme}>
          <View style={styles.container}>
            <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
            <AppNavigator />
          </View>
        </NavigationContainer>
      </CrewProvider>
    </CampaignProvider>
  );
}

function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

export default registerRootComponent(App);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: navTheme.colors.background,
    ...Platform.select({
      web: {
        height: '100vh',
        overflow: 'hidden',
      },
    }),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: navTheme.colors.background,
  },
});
