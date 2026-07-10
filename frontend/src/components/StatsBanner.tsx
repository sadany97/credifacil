import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS } from '../constants';

export const StatsBanner: React.FC = () => (
  <View style={styles.statsBanner}>
    <View style={styles.statItem}>
      <Text style={styles.statNumber}>+2,500</Text>
      <Text style={styles.statLabel}>Clientes Satisfechos</Text>
    </View>
    <View style={styles.statDivider} />
    <View style={styles.statItem}>
      <Text style={styles.statNumber}>$45M+</Text>
      <Text style={styles.statLabel}>Créditos Otorgados</Text>
    </View>
    <View style={styles.statDivider} />
    <View style={styles.statItem}>
      <Text style={styles.statNumber}>98%</Text>
      <Text style={styles.statLabel}>Tasa de Éxito</Text>
    </View>
  </View>
);

const styles = StyleSheet.create({
  statsBanner: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.gold,
  },
  statLabel: {
    fontSize: 10,
    color: COLORS.platinum,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: COLORS.secondary,
  },
});

export default StatsBanner;
