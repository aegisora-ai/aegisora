import { Tabs } from 'expo-router';
import { Shield, CheckSquare, Bell, Server } from 'lucide-react-native';
import { colors } from '../../src/theme/colors';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border, height: 60, paddingBottom: 8 },
      tabBarActiveTintColor: colors.primary,
      tabBarInactiveTintColor: colors.secondary
    }}>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({color}) => <Shield color={color} size={20}/> }} />
      <Tabs.Screen name="approvals" options={{ title: 'Approvals', tabBarIcon: ({color}) => <CheckSquare color={color} size={20}/> }} />
      <Tabs.Screen name="alerts" options={{ title: 'Alerts', tabBarIcon: ({color}) => <Bell color={color} size={20}/> }} />
      <Tabs.Screen name="agents" options={{ title: 'Agents', tabBarIcon: ({color}) => <Server color={color} size={20}/> }} />
    </Tabs>
  );
}
