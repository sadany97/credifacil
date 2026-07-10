import React, { useState, useEffect, useRef } from 'react';
import Animated, { FadeIn, FadeInUp, FadeInDown, FadeInLeft, FadeInRight, FadeOut } from 'react-native-reanimated';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';
import { apiCall } from '../services/api';

interface Message {
  id: string;
  content: string;
  is_mine: boolean;
  created_at: string;
  sender_name: string;
}

interface ChatModalProps {
  visible: boolean;
  onClose: () => void;
  token: string;
  otherUserId: string;
  otherUserName: string;
  isAdmin?: boolean;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  visible,
  onClose,
  token,
  otherUserId,
  otherUserName,
  isAdmin = false,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const fetchMessages = async () => {
    if (!otherUserId) return;
    try {
      const data = await apiCall(`/messages/${otherUserId}`, 'GET', null, token);
      setMessages(data || []);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (error) {
      console.log('Error fetching messages');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    
    setLoading(true);
    try {
      await apiCall('/messages', 'POST', {
        receiver_id: otherUserId,
        content: newMessage.trim()
      }, token);
      
      setNewMessage('');
      await fetchMessages();
    } catch (error) {
      console.log('Error sending message');
    }
    setLoading(false);
  };

  useEffect(() => {
    if (visible) {
      fetchMessages();
      const interval = setInterval(fetchMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [visible, otherUserId]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.overlay}
      >
        <Animated.View entering={FadeInUp} style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color={COLORS.text} />
            </TouchableOpacity>
            <View style={styles.headerInfo}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{otherUserName.charAt(0).toUpperCase()}</Text>
              </View>
              <View>
                <Text style={styles.userName}>{otherUserName}</Text>
                <Text style={styles.userStatus}>
                  {isAdmin ? 'Cliente' : 'Soporte'}
                </Text>
              </View>
            </View>
          </View>

          <ScrollView 
            ref={scrollRef}
            style={styles.messagesList}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
          >
            {messages.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="chatbubbles-outline" size={60} color={COLORS.textMuted} />
                <Text style={styles.emptyText}>Inicia la conversación</Text>
              </View>
            ) : (
              messages.map((message, index) => (
                <Animated.View
                  key={message.id}
                  entering={FadeInRight.delay(index * 30)}
                  style={[
                    styles.messageBubble,
                    message.is_mine ? styles.myMessage : styles.theirMessage
                  ]}
                >
                  <Text style={[
                    styles.messageText,
                    message.is_mine ? styles.myMessageText : styles.theirMessageText
                  ]}>
                    {message.content}
                  </Text>
                  <Text style={[
                    styles.messageTime,
                    message.is_mine ? styles.myMessageTime : styles.theirMessageTime
                  ]}>
                    {formatTime(message.created_at)}
                  </Text>
                </Animated.View>
              ))
            )}
          </ScrollView>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Escribe un mensaje..."
              placeholderTextColor={COLORS.textMuted}
              value={newMessage}
              onChangeText={setNewMessage}
              multiline
              maxLength={500}
            />
            <TouchableOpacity 
              style={[styles.sendBtn, !newMessage.trim() && styles.sendBtnDisabled]}
              onPress={sendMessage}
              disabled={loading || !newMessage.trim()}
            >
              <Ionicons 
                name="send" 
                size={22} 
                color={newMessage.trim() ? '#fff' : COLORS.textMuted} 
              />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
    marginTop: 50,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backBtn: {
    padding: 8,
    marginRight: 8,
  },
  headerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  userStatus: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 20,
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
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 18,
    marginBottom: 10,
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: COLORS.primary,
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: COLORS.card,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myMessageText: {
    color: '#fff',
  },
  theirMessageText: {
    color: COLORS.text,
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
  },
  myMessageTime: {
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'right',
  },
  theirMessageTime: {
    color: COLORS.textMuted,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    paddingBottom: 30,
    backgroundColor: COLORS.card,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 24,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.text,
    maxHeight: 100,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: COLORS.border,
  },
});

export default ChatModal;
