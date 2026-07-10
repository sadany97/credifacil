import React, { useState } from 'react';
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

interface Message {
  _id: string;
  sender_id: string;
  sender_name: string;
  sender_email: string;
  content: string;
  created_at: string;
  read?: boolean;
}

interface AdminMessagesModalProps {
  visible: boolean;
  onClose: () => void;
  messages: Message[];
  loading: boolean;
  onRefresh: () => void;
  onOpenChat: (userId: string, userName: string) => void;
}

export const AdminMessagesModal: React.FC<AdminMessagesModalProps> = ({
  visible,
  onClose,
  messages,
  loading,
  onRefresh,
  onOpenChat,
}) => {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Justo ahora';
    if (diffMins < 60) return `Hace ${diffMins} min`;
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays} días`;
    
    return date.toLocaleDateString('es-MX', {
      day: '2-digit',
      month: 'short',
    });
  };

  const truncateMessage = (message: string, maxLength: number = 80) => {
    if (message.length <= maxLength) return message;
    return message.substring(0, maxLength) + '...';
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="mail" size={24} color={COLORS.primary} />
              <View>
                <Text style={styles.title}>Mensajes de Clientes</Text>
                <Text style={styles.subtitle}>{messages.length} mensajes</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          {loading && !refreshing ? (
            <ActivityIndicator size="large" color={COLORS.primary} style={styles.loader} />
          ) : messages.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="mail-open-outline" size={60} color={COLORS.textMuted} />
              <Text style={styles.emptyTitle}>Sin mensajes</Text>
              <Text style={styles.emptySubtitle}>
                Los mensajes de tus clientes aparecerán aquí
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.messagesList}
              showsVerticalScrollIndicator={false}
              refreshControl={
                <RefreshControl
                  refreshing={refreshing}
                  onRefresh={handleRefresh}
                  colors={[COLORS.primary]}
                />
              }
            >
              {messages.map((message, index) => (
                <TouchableOpacity
                  key={message._id || index}
                  style={[
                    styles.messageCard,
                    !message.read && styles.messageCardUnread
                  ]}
                  onPress={() => onOpenChat(message.sender_id, message.sender_name)}
                >
                  <View style={styles.messageHeader}>
                    <View style={styles.senderInfo}>
                      <View style={[
                        styles.avatar,
                        !message.read && { backgroundColor: COLORS.primary }
                      ]}>
                        <Text style={[
                          styles.avatarText,
                          !message.read && { color: 'white' }
                        ]}>
                          {message.sender_name?.charAt(0)?.toUpperCase() || 'U'}
                        </Text>
                      </View>
                      <View style={styles.senderDetails}>
                        <Text style={styles.senderName} numberOfLines={1}>
                          {message.sender_name || 'Usuario'}
                        </Text>
                        <Text style={styles.senderEmail} numberOfLines={1}>
                          {message.sender_email || ''}
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.messageTime}>
                      {formatDate(message.created_at)}
                    </Text>
                  </View>
                  
                  <Text style={styles.messageContent} numberOfLines={2}>
                    {truncateMessage(message.content)}
                  </Text>
                  
                  <View style={styles.messageFooter}>
                    <TouchableOpacity
                      style={styles.replyBtn}
                      onPress={() => onOpenChat(message.sender_id, message.sender_name)}
                    >
                      <Ionicons name="chatbubble-outline" size={16} color={COLORS.primary} />
                      <Text style={styles.replyBtnText}>Responder</Text>
                    </TouchableOpacity>
                    {!message.read && (
                      <View style={styles.unreadBadge}>
                        <Text style={styles.unreadBadgeText}>Nuevo</Text>
                      </View>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
              <View style={{ height: 20 }} />
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
    maxHeight: '90%',
    minHeight: '60%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    padding: 8,
    backgroundColor: COLORS.background,
    borderRadius: 20,
  },
  loader: {
    padding: 60,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 8,
  },
  messagesList: {
    flex: 1,
    padding: 16,
  },
  messageCard: {
    backgroundColor: COLORS.background,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  messageCardUnread: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    backgroundColor: COLORS.primary + '08',
  },
  messageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  senderInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textMuted,
  },
  senderDetails: {
    flex: 1,
  },
  senderName: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
  senderEmail: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginTop: 1,
  },
  messageTime: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  messageContent: {
    fontSize: 14,
    color: COLORS.textLight,
    lineHeight: 20,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  replyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: COLORS.primary + '15',
    borderRadius: 8,
  },
  replyBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  unreadBadge: {
    backgroundColor: COLORS.danger,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  unreadBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'white',
  },
});
