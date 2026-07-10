import React, { useState, useEffect } from 'react';
import Animated, { FadeIn, FadeInUp, FadeInDown, FadeInLeft, FadeInRight, FadeOut } from 'react-native-reanimated';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

interface LiveActivityItem {
  id: string;
  type: string;
  user_name: string;
  description: string;
  icon: string;
  timestamp: string;
}

interface CommandCenterProps {
  visible: boolean;
  onClose: () => void;
  token: string;
}

export const CommandCenter: React.FC<CommandCenterProps> = ({ visible, onClose, token }) => {
  const [activities, setActivities] = useState<LiveActivityItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const API_URL = 'https://credifacil-api-cr8u.onrender.com';

  const fetchActivities = async () => {
    try {
      const response = await fetch(`${API_URL}/api/admin/live-activity?limit=30`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setActivities(data);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchActivities();
      if (autoRefresh) {
        const interval = setInterval(fetchActivities, 5000);
        return () => clearInterval(interval);
      }
    }
  }, [visible, autoRefresh]);

  const getIconName = (type: string): string => {
    const icons: { [key: string]: string } = {
      'login': 'log-in',
      'logout': 'log-out',
      'view_balance': 'eye',
      'transaction': 'cash',
      'profile_update': 'create',
      'notification': 'notifications',
      'admin_action': 'shield',
    };
    return icons[type] || 'activity';
  };

  const getTypeColor = (type: string): string => {
    const colors: { [key: string]: string } = {
      'login': '#4CAF50',
      'logout': '#FF9800',
      'view_balance': '#2196F3',
      'transaction': '#9C27B0',
      'profile_update': '#00BCD4',
      'admin_action': '#F44336',
    };
    return colors[type] || COLORS.primary;
  };

  const formatTime = (timestamp: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diff < 60) return `hace ${diff}s`;
    if (diff < 3600) return `hace ${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`;
    return date.toLocaleDateString('es-MX');
  };

  // Datos simulados para demostración
  const demoActivities: LiveActivityItem[] = [
    { id: '1', type: 'login', user_name: 'María García H.', description: 'Inició sesión', icon: 'log-in', timestamp: new Date(Date.now() - 30000).toISOString() },
    { id: '2', type: 'view_balance', user_name: 'Carlos López R.', description: 'Consultó su saldo', icon: 'eye', timestamp: new Date(Date.now() - 120000).toISOString() },
    { id: '3', type: 'transaction', user_name: 'Ana Martínez P.', description: 'Recibió $45,230.00', icon: 'cash', timestamp: new Date(Date.now() - 300000).toISOString() },
    { id: '4', type: 'login', user_name: 'Roberto Sánchez M.', description: 'Inició sesión', icon: 'log-in', timestamp: new Date(Date.now() - 450000).toISOString() },
    { id: '5', type: 'profile_update', user_name: 'Laura Hernández V.', description: 'Actualizó su perfil', icon: 'create', timestamp: new Date(Date.now() - 600000).toISOString() },
    { id: '6', type: 'notification', user_name: 'Pedro Ramírez G.', description: 'Leyó notificación', icon: 'notifications', timestamp: new Date(Date.now() - 900000).toISOString() },
    { id: '7', type: 'login', user_name: 'Sofía Torres B.', description: 'Inició sesión', icon: 'log-in', timestamp: new Date(Date.now() - 1200000).toISOString() },
    { id: '8', type: 'view_balance', user_name: 'Miguel Ángel C.', description: 'Consultó su saldo', icon: 'eye', timestamp: new Date(Date.now() - 1500000).toISOString() },
  ];

  const displayActivities = activities.length > 0 ? activities : demoActivities;

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <Animated.View entering={FadeIn} style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <View style={styles.liveIndicator}>
                <View style={styles.liveDot} />
                <Text style={styles.liveText}>EN VIVO</Text>
              </View>
              <Text style={styles.title}>Centro de Comando</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.controls}>
            <TouchableOpacity 
              style={[styles.controlBtn, autoRefresh && styles.controlBtnActive]}
              onPress={() => setAutoRefresh(!autoRefresh)}
            >
              <Ionicons name={autoRefresh ? "pause" : "play"} size={16} color={autoRefresh ? '#FFFFFF' : COLORS.text} />
              <Text style={[styles.controlText, autoRefresh && styles.controlTextActive]}>
                {autoRefresh ? 'Pausar' : 'Reanudar'}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.controlBtn} onPress={fetchActivities}>
              <Ionicons name="refresh" size={16} color={COLORS.text} />
              <Text style={styles.controlText}>Actualizar</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
          ) : (
            <ScrollView style={styles.activityList} showsVerticalScrollIndicator={false}>
              {displayActivities.map((activity, index) => (
                <Animated.View 
                  key={activity.id} 
                  entering={FadeInDown.delay(index * 50)}
                  style={styles.activityItem}
                >
                  <View style={[styles.activityIcon, { backgroundColor: getTypeColor(activity.type) + '20' }]}>
                    <Ionicons name={getIconName(activity.type) as any} size={20} color={getTypeColor(activity.type)} />
                  </View>
                  <View style={styles.activityContent}>
                    <Text style={styles.activityUser}>{activity.user_name}</Text>
                    <Text style={styles.activityDesc}>{activity.description}</Text>
                  </View>
                  <Text style={styles.activityTime}>{formatTime(activity.timestamp)}</Text>
                </Animated.View>
              ))}
            </ScrollView>
          )}

          <View style={styles.footer}>
            <Text style={styles.footerText}>
              {displayActivities.length} actividades recientes
            </Text>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'flex-end',
  },
  container: {
    width: '100%',
    height: '92%',
    backgroundColor: '#0a0a0f',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#1a1a2e',
    borderBottomWidth: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a2e',
    backgroundColor: '#0d0d12',
  },
  headerLeft: {
    flexDirection: 'column',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  liveDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#f44336',
    marginRight: 8,
  },
  liveText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#f44336',
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeBtn: {
    padding: 10,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
  },
  controls: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a2e',
  },
  controlBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 10,
    backgroundColor: '#1a1a2e',
    gap: 8,
  },
  controlBtnActive: {
    backgroundColor: COLORS.primary,
  },
  controlText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  controlTextActive: {
    color: '#FFFFFF',
  },
  loader: {
    padding: 60,
  },
  activityList: {
    flex: 1,
    padding: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#12121a',
    borderRadius: 14,
    marginBottom: 10,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
  },
  activityIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  activityContent: {
    flex: 1,
  },
  activityUser: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  activityDesc: {
    fontSize: 14,
    color: COLORS.textMuted,
  },
  activityTime: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#1a1a2e',
    alignItems: 'center',
    backgroundColor: '#0d0d12',
  },
  footerText: {
    fontSize: 14,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
});
