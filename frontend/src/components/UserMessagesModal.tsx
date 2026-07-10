import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { apiCall } from '../services/api';

interface UserMessagesModalProps {
  visible: boolean;
  onClose: () => void;
  token: string;
}

export const UserMessagesModal: React.FC<UserMessagesModalProps> = ({
  visible,
  onClose,
  token,
}) => {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadMessages = async () => {
    try {
      const data = await apiCall('/user/messages', 'GET', null, token);
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (visible) {
      loadMessages();
    }
  }, [visible]);

  const markAsRead = async (messageId: string) => {
    try {
      await apiCall(`/user/messages/${messageId}/read`, 'POST', null, token);
      setMessages(messages.map(m => 
        m._id === messageId ? { ...m, read: true } : m
      ));
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('es-MX', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.title}>Mis Mensajes</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={{ marginTop: 40 }} />
          ) : messages.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="mail-outline" size={60} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No tienes mensajes</Text>
            </View>
          ) : (
            <ScrollView 
              style={styles.messagesList}
              refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={() => {
                  setRefreshing(true);
                  loadMessages();
                }} />
              }
            >
              {messages.map((msg) => (
                <TouchableOpacity 
                  key={msg._id} 
                  style={[styles.messageCard, !msg.read && styles.unread]}
                  onPress={() => markAsRead(msg._id)}
                >
                  <View style={styles.messageHeader}>
                    <Ionicons 
                      name={msg.read ? "mail-open" : "mail"} 
                      size={20} 
                      color={msg.read ? COLORS.textMuted : COLORS.primary} 
                    />
                    <Text style={styles.messageTitle}>{msg.title}</Text>
                  </View>
                  <Text style={styles.messageBody}>{msg.message}</Text>
                  <Text style={styles.messageDate}>{formatDate(msg.created_at)}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  messagesList: {
    maxHeight: 500,
  },
  messageCard: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  unread: {
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  messageTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginLeft: 8,
  },
  messageBody: {
    fontSize: 14,
    color: COLORS.textLight,
    lineHeight: 20,
  },
  messageDate: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textMuted,
    marginTop: 16,
  },
});
