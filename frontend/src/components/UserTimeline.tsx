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

interface TimelineEvent {
  type: string;
  icon: string;
  title: string;
  description: string;
  timestamp: string;
}

interface UserTimelineProps {
  visible: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  token: string;
}

export const UserTimeline: React.FC<UserTimelineProps> = ({ 
  visible, 
  onClose, 
  userId, 
  userName,
  token 
}) => {
  const [timeline, setTimeline] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const API_URL = 'https://recuperacion-capital-1.onrender.com';

  const fetchTimeline = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/user-timeline/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setTimeline(data.timeline || []);
      }
    } catch (error) {
      console.error('Error fetching timeline:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (visible && userId) {
      fetchTimeline();
    }
  }, [visible, userId]);

  const getIconColor = (type: string): string => {
    const colors: { [key: string]: string } = {
      'registro': '#4CAF50',
      'transaccion': '#9C27B0',
      'notificacion': '#2196F3',
      'cambio': '#FF9800',
      'login': '#00BCD4',
    };
    return colors[type] || COLORS.primary;
  };

  const formatDate = (timestamp: string) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Datos de demostración
  const demoTimeline: TimelineEvent[] = [
    { type: 'registro', icon: 'person-add', title: 'Usuario registrado', description: 'Se creó la cuenta', timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() },
    { type: 'transaccion', icon: 'cash', title: 'Depósito inicial', description: '$125,000.00 MXN', timestamp: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString() },
    { type: 'notificacion', icon: 'notifications', title: 'Notificación enviada', description: 'Bienvenido a CrediFácil', timestamp: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000).toISOString() },
    { type: 'cambio', icon: 'create', title: 'Perfil actualizado', description: 'Por: Admin Principal', timestamp: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000).toISOString() },
    { type: 'transaccion', icon: 'cash', title: 'Retención aplicada', description: '$12,500.00 MXN', timestamp: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString() },
    { type: 'notificacion', icon: 'notifications', title: 'Estado actualizado', description: 'Su caso está en revisión', timestamp: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString() },
    { type: 'cambio', icon: 'create', title: 'Saldo modificado', description: 'Por: Sub Admin', timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString() },
    { type: 'login', icon: 'log-in', title: 'Inicio de sesión', description: 'Desde dispositivo Android', timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() },
  ];

  const displayTimeline = timeline.length > 0 ? timeline : demoTimeline;

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <View style={styles.fullScreenContainer}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerSubtitle}>Línea de Tiempo</Text>
            <Text style={styles.headerTitle}>{userName}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
        ) : (
          <ScrollView 
            style={styles.timelineList} 
            showsVerticalScrollIndicator={true}
            contentContainerStyle={{ paddingBottom: 40 }}
          >
            <View style={styles.timelineLine} />
            {displayTimeline.map((event, index) => (
              <Animated.View 
                key={index} 
                entering={FadeInLeft.delay(index * 80)}
                style={styles.timelineItem}
              >
                <View style={[styles.timelineDot, { backgroundColor: getIconColor(event.type) }]}>
                  <Ionicons name={event.icon as any} size={16} color={'#FFFFFF'} />
                </View>
                <View style={styles.timelineContent}>
                  <View style={styles.timelineCard}>
                    <Text style={styles.timelineTitle}>{event.title}</Text>
                    <Text style={styles.timelineDesc}>{event.description}</Text>
                    <Text style={styles.timelineDate}>{formatDate(event.timestamp)}</Text>
                  </View>
                </View>
              </Animated.View>
            ))}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  fullScreenContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
    backgroundColor: COLORS.primary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  closeBtn: {
    padding: 10,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 25,
  },
  loader: {
    padding: 40,
  },
  timelineList: {
    flex: 1,
    padding: 20,
    paddingLeft: 30,
  },
  timelineLine: {
    position: 'absolute',
    left: 39,
    top: 20,
    bottom: 20,
    width: 2,
    backgroundColor: COLORS.border,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  timelineDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    zIndex: 1,
    borderWidth: 3,
    borderColor: COLORS.background,
  },
  timelineContent: {
    flex: 1,
  },
  timelineCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  timelineTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  timelineDesc: {
    fontSize: 14,
    color: COLORS.textMuted,
    marginBottom: 8,
  },
  timelineDate: {
    fontSize: 12,
    color: '#888',
  },
});
