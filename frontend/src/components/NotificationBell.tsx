import React, { useState, useEffect } from 'react';
import Animated, { FadeIn, FadeInUp, FadeInDown, FadeInLeft, FadeInRight, FadeOut } from 'react-native-reanimated';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { apiCall } from '../services/api';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'urgent';
  read: boolean;
  created_at: string;
}

interface NotificationBellProps {
  token: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ token }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [modalVisible, setModalVisible] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUnreadCount = async () => {
    try {
      const data = await apiCall('/notifications/unread-count', 'GET', null, token);
      setUnreadCount(data.count || 0);
    } catch (error) {
      console.log('Error fetching unread count');
    }
  };

  const fetchNotifications = async () => {
    try {
      const data = await apiCall('/notifications', 'GET', null, token);
      setNotifications(data || []);
    } catch (error) {
      console.log('Error fetching notifications');
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await apiCall(`/notifications/${notificationId}/read`, 'PUT', {}, token);
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.log('Error marking as read');
    }
  };

  useEffect(() => {
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [token]);

  const openModal = () => {
    setModalVisible(true);
    fetchNotifications();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchNotifications();
    setRefreshing(false);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'success': return { name: 'checkmark-circle', color: COLORS.success };
      case 'warning': return { name: 'warning', color: COLORS.warning };
      case 'urgent': return { name: 'alert-circle', color: COLORS.danger };
      default: return { name: 'information-circle', color: COLORS.accent };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    
    if (hours < 1) return 'Hace un momento';
    if (hours < 24) return `Hace ${hours}h`;
    if (hours < 48) return 'Ayer';
    return date.toLocaleDateString('es-MX');
  };

  return (
    <>
      <TouchableOpacity style={styles.bellContainer} onPress={openModal}>
        <Ionicons name="notifications-outline" size={26} color={COLORS.text} />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <Animated.View entering={FadeInDown} style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notificaciones</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={28} color={COLORS.text} />
              </TouchableOpacity>
            </View>

            <ScrollView
              style={styles.notificationsList}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
              }
            >
              {notifications.length === 0 ? (
                <View style={styles.emptyState}>
                  <Ionicons name="notifications-off-outline" size={60} color={COLORS.textMuted} />
                  <Text style={styles.emptyText}>No tienes notificaciones</Text>
                </View>
              ) : (
                notifications.map((notification, index) => {
                  const icon = getTypeIcon(notification.type);
                  return (
                    <Animated.View
                      key={notification.id}
                      entering={FadeInRight.delay(index * 50)}
                    >
                      <TouchableOpacity
                        style={[
                          styles.notificationItem,
                          !notification.read && styles.unreadItem
                        ]}
                        onPress={() => markAsRead(notification.id)}
                      >
                        <View style={[styles.notifIcon, { backgroundColor: icon.color + '20' }]}>
                          <Ionicons name={icon.name as any} size={22} color={icon.color} />
                        </View>
                        <View style={styles.notifContent}>
                          <Text style={styles.notifTitle}>{notification.title}</Text>
                          <Text style={styles.notifMessage}>{notification.message}</Text>
                          <Text style={styles.notifDate}>{formatDate(notification.created_at)}</Text>
                        </View>
                        {!notification.read && <View style={styles.unreadDot} />}
                      </TouchableOpacity>
                    </Animated.View>
                  );
                })
              )}
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  bellContainer: {
    position: 'relative',
    padding: 8,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: COLORS.danger,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 34,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  notificationsList: {
    padding: 16,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: COLORS.textMuted,
  },
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  unreadItem: {
    backgroundColor: COLORS.primary + '08',
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  notifIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  notifContent: {
    flex: 1,
  },
  notifTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  notifMessage: {
    fontSize: 13,
    color: COLORS.textLight,
    lineHeight: 18,
    marginBottom: 6,
  },
  notifDate: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
    marginLeft: 8,
    marginTop: 4,
  },
});

export default NotificationBell;
