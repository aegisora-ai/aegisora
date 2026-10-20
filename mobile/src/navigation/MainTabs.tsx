import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { LayoutDashboard, Bot, Bell, Settings } from 'lucide-react-native';
import OverviewScreen from '../screens/OverviewScreen';
import AgentsScreen from '../screens/AgentsScreen';
import AlertsScreen from '../screens/AlertsScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();

export function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textFaint,
      }}
    >
      <Tab.Screen name="Overview" component={OverviewScreen} options={{ tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size} /> }} />
      <Tab.Screen name="Agents" component={AgentsScreen} options={{ tabBarIcon: ({ color, size }) => <Bot color={color} size={size} /> }} />
      <Tab.Screen name="Alerts" component={AlertsScreen} options={{ tabBarIcon: ({ color, size }) => <Bell color={color} size={size} /> }} />
      <Tab.Screen name="Settings" component={SettingsScreen} options={{ tabBarIcon: ({ color, size }) => <Settings color={color} size={size} /> }} />
    </Tab.Navigator>
  );
}