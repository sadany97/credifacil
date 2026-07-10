import React, { useState } from 'react';
import Animated, { FadeIn, FadeInUp, FadeInDown, FadeInLeft, FadeInRight, FadeOut } from 'react-native-reanimated';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { COLORS } from '../constants';
import { apiCall } from '../services/api';

interface AdminAnalyticsProps {
  token: string;
  analytics: {
    total_users: number;
    users_this_month: number;
    total_recovered: number;
    total_retained: number;
    active_users: number;
    unread_messages: number;
  };
  onExport: () => void;
}

export const AdminAnalytics: React.FC<AdminAnalyticsProps> = ({ 
  token, 
  analytics,
  onExport 
}) => {
  const [exporting, setExporting] = useState(false);
  
  const formatCurrency = (value: number) => {
    return '$' + (value || 0).toLocaleString('es-MX', { minimumFractionDigits: 0 });
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      const data = await apiCall('/admin/export/users', 'GET', null, token);
      
      if (data.pdf) {
        // Guardar PDF y compartir
        const filename = data.filename || `clientes_${Date.now()}.pdf`;
        const fileUri = FileSystem.documentDirectory + filename;
        
        await FileSystem.writeAsStringAsync(fileUri, data.pdf, {
          encoding: 'base64',
        });
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'application/pdf',
            dialogTitle: 'Exportar Clientes PDF',
            UTI: 'com.adobe.pdf'
          });
        } else {
          Alert.alert('Éxito', `PDF guardado: ${filename}`);
        }
      } else if (data.csv) {
        // Fallback a CSV
        const filename = data.filename || `clientes_${Date.now()}.csv`;
        const fileUri = FileSystem.documentDirectory + filename;
        
        await FileSystem.writeAsStringAsync(fileUri, data.csv);
        
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(fileUri, {
            mimeType: 'text/csv',
            dialogTitle: 'Exportar Clientes CSV'
          });
        }
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Error', 'No se pudo exportar los datos');
    } finally {
      setExporting(false);
    }
  };

  const stats = [
    {
      id: 'total_users',
      label: 'Total Usuarios',
      value: analytics?.total_users || 0,
      icon: 'people',
      color: COLORS.primary,
      format: 'number'
    },
    {
      id: 'users_month',
      label: 'Nuevos este mes',
      value: analytics?.users_this_month || 0,
      icon: 'person-add',
      color: COLORS.success,
      format: 'number'
    },
    {
      id: 'recovered',
      label: 'Total Otorgado',
      value: analytics?.total_recovered || 0,
      icon: 'trending-up',
      color: COLORS.success,
      format: 'currency'
    },
    {
      id: 'retained',
      label: 'Total Retenido',
      value: analytics?.total_retained || 0,
      icon: 'lock-closed',
      color: COLORS.warning,
      format: 'currency'
    },
    {
      id: 'active',
      label: 'Usuarios Activos',
      value: analytics?.active_users || 0,
      icon: 'pulse',
      color: COLORS.accent,
      format: 'number'
    },
    {
      id: 'messages',
      label: 'Mensajes sin leer',
      value: analytics?.unread_messages || 0,
      icon: 'chatbubble-ellipses',
      color: COLORS.danger,
      format: 'number'
    },
  ];

  return (
    <Animated.View entering={FadeInUp} style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="analytics" size={22} color={COLORS.primary} />
          <Text style={styles.title}>Dashboard Analytics</Text>
        </View>
        <TouchableOpacity style={styles.exportBtn} onPress={handleExport} disabled={exporting}>
          {exporting ? (
            <ActivityIndicator size="small" color={COLORS.primary} />
          ) : (
            <>
              <Ionicons name="document-text-outline" size={18} color={COLORS.primary} />
              <Text style={styles.exportText}>Exportar PDF</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <Animated.View
            key={stat.id}
            entering={FadeInUp.delay(index * 50)}
            style={styles.statCard}
          >
            <View style={[styles.statIcon, { backgroundColor: stat.color + '15' }]}>
              <Ionicons name={stat.icon as any} size={22} color={stat.color} />
            </View>
            <Text style={styles.statValue}>
              {stat.format === 'currency' ? formatCurrency(stat.value) : stat.value}
            </Text>
            <Text style={styles.statLabel}>{stat.label}</Text>
          </Animated.View>
        ))}
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  exportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.primary + '15',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  exportText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  statCard: {
    width: '47%',
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textMuted,
    textAlign: 'center',
  },
});

export default AdminAnalytics;
