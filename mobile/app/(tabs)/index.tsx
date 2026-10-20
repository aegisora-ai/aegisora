import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { Badge } from '../../src/components/Badge';
import { colors } from '../../src/theme/colors';

export default function HomeScreen() {
  return (
    <Screen>
      <View style={styles.header}>
        <Text style={styles.title}>AEGISORA</Text>
        <Badge label="Protection Operational" variant="success" />
      </View>
      <View style={styles.statsContainer}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>24</Text>
          <Text style={styles.statLabel}>Protected Agents</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>3</Text>
          <Text style={styles.statLabel}>High Risk Approvals</Text>
        </View>
      </View>
    </Screen>
  );
}
const styles = StyleSheet.create({
  header: { padding: 24, paddingBottom: 16, gap: 12 },
  title: { color: colors.text, fontSize: 22, fontWeight: '700', letterSpacing: 2 },
  statsContainer: { flexDirection: 'row', padding: 24, gap: 16 },
  statBox: { flex: 1, backgroundColor: colors.surface, padding: 16, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  statValue: { color: colors.text, fontSize: 24, fontWeight: '700', marginBottom: 4 },
  statLabel: { color: colors.secondary, fontSize: 12, fontWeight: '500' }
});
