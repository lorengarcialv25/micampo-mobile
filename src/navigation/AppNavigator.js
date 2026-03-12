import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation, useNavigationState } from "@react-navigation/native";

// Screens
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import FieldsScreen from "../screens/FieldsScreen";
import FieldDetailScreen from "../screens/FieldDetailScreen";
import WorkersScreen from "../screens/WorkersScreen";
import WorkerDetailScreen from "../screens/WorkerDetailScreen";
import PendingPaymentsScreen from "../screens/PendingPaymentsScreen";
import TaskDetailScreen from "../screens/TaskDetailScreen";
import TransactionDetailScreen from "../screens/TransactionDetailScreen";
import ActionScreen from "../screens/ActionScreen";
import CropsScreen from "../screens/CropsScreen";
import HarvestTicketDetailScreen from "../screens/HarvestTicketDetailScreen";
import AccountsScreen from "../screens/AccountsScreen";
import AccountAnalysisScreen from "../screens/AccountAnalysisScreen";
import TreatmentsScreen from "../screens/TreatmentsScreen";
import CrewScreen from "../screens/CrewScreen";
import SettingsScreen from "../screens/SettingsScreen";

// Action Screens
import AddWorkScreen from "../screens/Actions/AddWorkScreen";
import AddAlbaranScreen from "../screens/Actions/AddAlbaranScreen";
import AddExpenseScreen from "../screens/Actions/AddExpenseScreen";
import AddTreatmentScreen from "../screens/Actions/AddTreatmentScreen";
import AddParcelScreen from "../screens/Actions/AddParcelScreen";

// Components
import ActionBottomSheet from "../components/ActionBottomSheet";
import TopBar from "../components/TopBar";
import VoiceOverlay from "../components/VoiceOverlay"; 
import { useCampaign } from "../context/CampaignContext";
import { CrewModal } from "../components/CrewModal";
import { useCrew } from "../context/CrewContext";
import { useAuth } from "../context/AuthContext";

const Tab = createBottomTabNavigator();
const FieldsStack = createNativeStackNavigator();
const ActionsStack = createNativeStackNavigator();
const WorkersStack = createNativeStackNavigator();
const AccountsStack = createNativeStackNavigator();
const RecoleccionStack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();

function FieldsStackNavigator() {
  return (
    <FieldsStack.Navigator screenOptions={{ headerShown: false }}>
      <FieldsStack.Screen name="FieldsList" component={FieldsScreen} />
      <FieldsStack.Screen name="FieldDetail" component={FieldDetailScreen} />
      <FieldsStack.Screen name="Treatments" component={TreatmentsScreen} />
    </FieldsStack.Navigator>
  );
}

function ActionsStackNavigator() {
  return (
    <ActionsStack.Navigator screenOptions={{ headerShown: false }}>
      <ActionsStack.Screen name="AddWork" component={AddWorkScreen} />
      <ActionsStack.Screen name="AddAlbaran" component={AddAlbaranScreen} />
      <ActionsStack.Screen name="AddExpense" component={AddExpenseScreen} />
      <ActionsStack.Screen name="AddTreatment" component={AddTreatmentScreen} />
      <ActionsStack.Screen name="AddParcel" component={AddParcelScreen} />
    </ActionsStack.Navigator>
  );
}

function WorkersStackNavigator() {
  return (
    <WorkersStack.Navigator screenOptions={{ headerShown: false }}>
      <WorkersStack.Screen name="WorkersList" component={WorkersScreen} />
      <WorkersStack.Screen name="WorkerDetail" component={WorkerDetailScreen} />
      <WorkersStack.Screen name="PendingPayments" component={PendingPaymentsScreen} />
      <WorkersStack.Screen name="TaskDetail" component={TaskDetailScreen} />
    </WorkersStack.Navigator>
  );
}

function AccountsStackNavigator() {
  return (
    <AccountsStack.Navigator screenOptions={{ headerShown: false }}>
      <AccountsStack.Screen name="AccountsList" component={AccountsScreen} />
      <AccountsStack.Screen name="AccountAnalysis" component={AccountAnalysisScreen} />
      <AccountsStack.Screen name="TransactionDetail" component={TransactionDetailScreen} />
    </AccountsStack.Navigator>
  );
}

function RecoleccionStackNavigator() {
  return (
    <RecoleccionStack.Navigator screenOptions={{ headerShown: false }}>
      <RecoleccionStack.Screen name="RecoleccionList" component={CropsScreen} />
      <RecoleccionStack.Screen name="HarvestTicketDetail" component={HarvestTicketDetailScreen} />
    </RecoleccionStack.Navigator>
  );
}

// Botón Central (Vuelve a ser + y sin long press obligatorio)
const CustomTabBarButton = ({ children, onPress }) => (
  <TouchableOpacity
    style={{
      justifyContent: "center",
      alignItems: "center",
      height: 60,
      top: -15, // Vuelve a sobresalir un poco para el efecto "incrustado"
    }}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <View
      style={{
        width: 58,
        height: 58,
        borderRadius: 29,
        backgroundColor: "#2e7d32",
        justifyContent: "center",
        alignItems: "center",
        shadowColor: "#2e7d32",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.4,
        shadowRadius: 5,
        elevation: 6,
        // Pequeño borde para separar visualmente si se superpone
        borderWidth: 3,
        borderColor: '#ffffff', 
      }}
    >
      {children}
    </View>
  </TouchableOpacity>
);

function MainTabsNavigator() {
  const [actionModalVisible, setActionModalVisible] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const { currentCampaign } = useCampaign();
  const { isModalVisible, closeCrewModal } = useCrew();
  const navigation = useNavigation();
  
  // Detectar si estamos en FieldDetailScreen o TaskDetailScreen para ocultar TopBar
  const currentRouteName = useNavigationState(state => {
    console.log('🔍 Navigation State:', JSON.stringify(state, null, 2));
    
    // Necesitamos ir más profundo en la estructura de navegación
    // MainStack -> MainTabs -> Tab (Trabajo/Parcelas) -> Stack Screen
    
    if (!state || !state.routes) return null;
    
    // Nivel 1: MainStack (puede tener MainTabs)
    const mainRoute = state.routes[state.index];
    if (!mainRoute) return null;
    console.log('🔍 Main Route:', mainRoute.name);
    
    // Si no es MainTabs, retornar
    if (mainRoute.name !== 'MainTabs' || !mainRoute.state) return mainRoute.name;
    
    // Nivel 2: MainTabs (tiene los tabs: Trabajo, Parcelas, etc)
    const tabState = mainRoute.state;
    const tabRoute = tabState.routes[tabState.index];
    if (!tabRoute) return null;
    console.log('🔍 Tab Route:', tabRoute.name);
    
    // Nivel 3: Stack dentro del tab (WorkersList -> TaskDetail o FieldsList -> FieldDetail)
    if (tabRoute.state?.routes) {
      const stackRoute = tabRoute.state.routes[tabRoute.state.index];
      console.log('🔍 Stack Route:', stackRoute?.name);
      return stackRoute?.name;
    }
    
    return tabRoute.name;
  });
  
  const isFieldDetail = currentRouteName === "FieldDetail";
  const isTaskDetail = currentRouteName === "TaskDetail";
  const isTransactionDetail = currentRouteName === "TransactionDetail";
  
  console.log('🔍 Final Current Route:', currentRouteName);
  console.log('🔍 Is TaskDetail?', isTaskDetail);
  console.log('🔍 Is TransactionDetail?', isTransactionDetail);
  console.log('🔍 Should hide TopBar?', isModalVisible || isFieldDetail || isTaskDetail || isTransactionDetail);

  const handleAction = (actionType) => {
    // Solo manejamos voice_ai aquí, las demás acciones se manejan en ActionBottomSheet
    if (actionType === 'voice_ai') {
      setIsListening(true);
    }
  };

  return (
    <>
      {/* Solo mostrar TopBar si el modal de cuadrilla NO está visible Y no estamos en FieldDetail, TaskDetail o TransactionDetail */}
      {!isModalVisible && !isFieldDetail && !isTaskDetail && !isTransactionDetail && (
        <TopBar 
          onSettingsPress={() => navigation.navigate('Settings')}
        />
      )}

      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarShowLabel: true,
          tabBarLabelStyle: {
              fontSize: 10,
              marginBottom: 5,
              fontWeight: '600'
          },
          tabBarActiveTintColor: "#2e7d32",
          tabBarInactiveTintColor: "#a0b0a0",
          // ESTILO FLOTANTE RESTAURADO
          tabBarStyle: {
            position: "absolute",
            bottom: 10,
            left: 20,
            right: 20,
            elevation: 0,
            backgroundColor: "#ffffff",
            borderRadius: 20, // Más redondeado
            height: 70,
            paddingBottom: 10,
            paddingTop: 10,
            ...styles.shadow,
          },
        }}
      >
        {/* 1. TRABAJO */}
        <Tab.Screen
          name="Trabajo"
          component={WorkersStackNavigator}
          options={{
            tabBarIcon: ({ focused }) => (
              <MaterialCommunityIcons 
                name={focused ? "hard-hat" : "hard-hat"} 
                size={26} 
                color={focused ? "#2e7d32" : "#a0b0a0"} 
              />
            ),
          }}
        />

        {/* 2. PARCELAS */}
        <Tab.Screen
          name="Parcelas"
          component={FieldsStackNavigator}
          options={{
            tabBarIcon: ({ focused }) => (
              <Ionicons 
                name={focused ? "location" : "location-outline"} 
                size={26} 
                color={focused ? "#2e7d32" : "#a0b0a0"} 
              />
            ),
          }}
        />
        
        {/* 3. BOTÓN CENTRAL + */}
        <Tab.Screen
          name="Accion"
          component={ActionScreen}
          options={{
            tabBarLabel: () => null, // Sin etiqueta
            tabBarIcon: ({ focused }) => (
              <Ionicons name="add" size={32} color="#ffffff" />
            ),
            tabBarButton: (props) => (
              <CustomTabBarButton 
                {...props} 
                onPress={() => setActionModalVisible(true)} 
              />
            ),
          }}
        />

        {/* 4. RECOLECCIÓN */}
        <Tab.Screen
          name="Recolección"
          component={RecoleccionStackNavigator}
          options={{
            tabBarIcon: ({ focused }) => (
              <MaterialCommunityIcons 
                name={focused ? "truck" : "truck-outline"} 
                size={26} 
                color={focused ? "#2e7d32" : "#a0b0a0"} 
              />
            ),
          }}
        />

        {/* 5. CUENTAS */}
        <Tab.Screen
          name="Cuentas"
          component={AccountsStackNavigator}
          options={{
            tabBarIcon: ({ focused }) => (
              <Ionicons 
                name={focused ? "wallet" : "wallet-outline"} 
                size={26} 
                color={focused ? "#2e7d32" : "#a0b0a0"} 
              />
            ),
          }}
        />
      </Tab.Navigator>

      <ActionBottomSheet 
        visible={actionModalVisible} 
        onClose={() => setActionModalVisible(false)}
        onAction={handleAction}
      />

      <VoiceOverlay 
        visible={isListening}
        onClose={() => setIsListening(false)}
      />

      <CrewModal 
        visible={isModalVisible}
        onClose={closeCrewModal}
      />
    </>
  );
}

// Stack Navigator que envuelve los tabs y permite navegar a Settings y Actions
function MainStackNavigator() {
  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      <MainStack.Screen name="MainTabs" component={MainTabsNavigator} />
      <MainStack.Screen name="Settings" component={SettingsScreen} />
      <MainStack.Screen name="ActionsStack" component={ActionsStackNavigator} />
    </MainStack.Navigator>
  );
}

const styles = StyleSheet.create({
  shadow: {
    shadowColor: "#2e7d32",
    shadowOffset: {
      width: 0,
      height: 8,
    },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 10,
  },
});

export default function AppNavigator() {
  const { isAuthenticated, user } = useAuth();

  // Log para depuración
  React.useEffect(() => {
    console.log('AppNavigator: isAuthenticated cambió a:', isAuthenticated);
    console.log('AppNavigator: user es:', user);
  }, [isAuthenticated, user]);

  return (
    <RootStack.Navigator screenOptions={{ headerShown: false }}>
      {isAuthenticated ? (
        <RootStack.Screen name="MainStack" component={MainStackNavigator} />
      ) : (
        <>
          <RootStack.Screen name="Login" component={LoginScreen} />
          <RootStack.Screen name="Register" component={RegisterScreen} />
        </>
      )}
    </RootStack.Navigator>
  );
}
