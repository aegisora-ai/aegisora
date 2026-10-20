import React from 'react';
import { SafeAreaView, StyleSheet, ViewProps } from 'react-native';
import { colors } from '../theme/colors';

export const Screen = ({ children, style, ...props }: ViewProps) => (
  <SafeAreaView style={[styles.safeArea, style]} {...props}>
    {children}
  </SafeAreaView>
);
const styles = StyleSheet.create({ safeArea: { flex: 1, backgroundColor: colors.background } });
