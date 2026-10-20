import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export const Badge = ({ label, variant = 'default' }: { label: string, variant?: 'low' | 'medium' | 'high' | 'critical' | 'success' | 'warning' | 'default' }) => {
  const getColors = () => {
    switch (variant) {
      case 'high':
      case 'warning': return { bg: 'rgba(245, 158, 11, 0.15)', text: colors.warning, border: 'rgba(245, 158, 11, 0.3)' };
      case 'critical': return { bg: 'rgba(239, 68, 68, 0.15)', text: colors.danger, border: 'rgba(239, 68, 68, 0.3)' };
      case 'success': return { bg: 'rgba(34, 197, 94, 0.15)', text: colors.success, border: 'rgba(34, 197, 94, 0.3)' };
      case 'medium': return { bg: 'rgba(59, 130, 246, 0.15)', text: colors.primary, border: 'rgba(59, 130, 246, 0.3)' };
      default: return { bg: colors.surfaceElevated, text: colors.secondary, border: colors.border };
    }
  };
  const { bg, text, border } = getColors();
  return (
    <View style={[styles.container, { backgroundColor: bg, borderColor: border }]}>
      <Text style={[styles.text, { color: text }]}>{label}</Text>
    </View>
  );
};
const styles = StyleSheet.create({
  container: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, borderWidth: 1, alignSelf: 'flex-start' },
  text: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }
});
