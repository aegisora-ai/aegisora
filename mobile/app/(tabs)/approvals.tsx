import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen } from '../../src/components/Screen';
import { Badge } from '../../src/components/Badge';
import { colors } from '../../src/theme/colors';
import { mockApprovals } from '../../src/api/mockData';

export default function ApprovalsScreen() {
  const router = useRouter();
  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>Approvals</Text>
        <Badge label={`Pending ${mockApprovals.length}`} variant="warning" />
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        {mockApprovals.map(app => (
          <Pressable key={app.id} style={styles.card} onPress={() => router.push(`/approvals/${app.id}`)}>
            <View style={styles.cardHeader}>
              <Text style={styles.agent}>{app.agent}</Text>
              <Text style={styles.time}>{app.timestamp}</Text>
            </View>
            <Text style={styles.action}>{app.action}</Text>
            <Text style={styles.amount}>{app.amount}</Text>
            <View style={styles.footer}>
              <Badge label={app.risk} variant={app.risk === 'HIGH' ? 'high' : 'default'} />
              <Text style={styles.requires}>Requires approval</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </Screen>
  );
}
const styles = StyleSheet.create({
  header: { padding: 24, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  title: { color: colors.text, fontSize: 24, fontWeight: '700' },
  list: { padding: 16, gap: 16 },
  card: { backgroundColor: colors.surface, padding: 16, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  agent: { color: colors.text, fontWeight: '600' },
  time: { color: colors.secondary, fontSize: 12 },
  action: { color: colors.cyan, fontFamily: 'monospace', marginBottom: 4 },
  amount: { color: colors.text, fontSize: 16, marginBottom: 16 },
  footer: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  requires: { color: colors.secondary, fontSize: 12 }
});
