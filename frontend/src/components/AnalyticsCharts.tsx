import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { COLORS } from '../constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AnalyticsData {
  users_by_month: { month: string; count: number }[];
  balance_summary: {
    total_available: number;
    total_retained: number;
    total: number;
  };
  quick_stats: {
    total_users: number;
    active_users: number;
    pending_messages: number;
    total_transactions: number;
  };
}

interface AnalyticsChartsProps {
  token: string;
  apiUrl: string;
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({ token, apiUrl }) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`${apiUrl}/api/admin/analytics`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const result = await response.json();
        setData(result);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Cargando estadísticas...</Text>
      </View>
    );
  }

  if (!data) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>No se pudieron cargar las estadísticas</Text>
      </View>
    );
  }

  const chartConfig = {
    backgroundColor: COLORS.card,
    backgroundGradientFrom: COLORS.card,
    backgroundGradientTo: COLORS.card,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(13, 33, 55, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(100, 116, 139, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: COLORS.primary,
    },
  };

  const lineData = {
    labels: data.users_by_month.map(u => u.month),
    datasets: [
      {
        data: data.users_by_month.map(u => u.count || 1),
        color: (opacity = 1) => `rgba(0, 168, 120, ${opacity})`,
        strokeWidth: 3,
      },
    ],
  };

  const pieData = [
    {
      name: 'Disponible',
      amount: data.balance_summary.total_available || 1,
      color: '#00a878',
      legendFontColor: COLORS.text,
      legendFontSize: 12,
    },
    {
      name: 'Retenido',
      amount: data.balance_summary.total_retained || 1,
      color: '#f59e0b',
      legendFontColor: COLORS.text,
      legendFontSize: 12,
    },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <View style={styles.container}>
      {/* Gráfica de Usuarios por Mes */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>📈 Nuevos Usuarios por Mes</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <LineChart
            data={lineData}
            width={Math.max(SCREEN_WIDTH - 40, 320)}
            height={200}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </ScrollView>
      </View>

      {/* Distribución de Saldos */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>💰 Distribución de Saldos</Text>
        <View style={styles.pieContainer}>
          <PieChart
            data={pieData}
            width={SCREEN_WIDTH - 60}
            height={180}
            chartConfig={chartConfig}
            accessor="amount"
            backgroundColor="transparent"
            paddingLeft="0"
            absolute
          />
        </View>
        <View style={styles.balanceDetails}>
          <View style={styles.balanceRow}>
            <View style={[styles.colorDot, { backgroundColor: '#00a878' }]} />
            <Text style={styles.balanceLabel}>Disponible:</Text>
            <Text style={styles.balanceValue}>{formatCurrency(data.balance_summary.total_available)}</Text>
          </View>
          <View style={styles.balanceRow}>
            <View style={[styles.colorDot, { backgroundColor: '#f59e0b' }]} />
            <Text style={styles.balanceLabel}>Retenido:</Text>
            <Text style={styles.balanceValue}>{formatCurrency(data.balance_summary.total_retained)}</Text>
          </View>
          <View style={[styles.balanceRow, styles.totalRow]}>
            <Text style={styles.totalLabel}>Total:</Text>
            <Text style={styles.totalValue}>{formatCurrency(data.balance_summary.total)}</Text>
          </View>
        </View>
      </View>

      {/* Estadísticas Rápidas */}
      <View style={styles.statsGrid}>
        <View style={[styles.statCard, { backgroundColor: '#E3F2FD' }]}>
          <Text style={styles.statNumber}>{data.quick_stats.total_users}</Text>
          <Text style={styles.statLabel}>Usuarios Total</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#E8F5E9' }]}>
          <Text style={styles.statNumber}>{data.quick_stats.active_users}</Text>
          <Text style={styles.statLabel}>Activos</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#FFF8E1' }]}>
          <Text style={styles.statNumber}>{data.quick_stats.pending_messages}</Text>
          <Text style={styles.statLabel}>Mensajes</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#F3E5F5' }]}>
          <Text style={styles.statNumber}>{data.quick_stats.total_transactions}</Text>
          <Text style={styles.statLabel}>Transacciones</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.textLight,
  },
  errorContainer: {
    padding: 40,
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.danger,
  },
  chartCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 16,
  },
  chart: {
    borderRadius: 12,
  },
  pieContainer: {
    alignItems: 'center',
  },
  balanceDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  balanceLabel: {
    flex: 1,
    fontSize: 14,
    color: COLORS.textLight,
  },
  balanceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  totalRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  totalLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.text,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    width: (SCREEN_WIDTH - 50) / 2,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textLight,
    marginTop: 4,
  },
});

export default AnalyticsCharts;
