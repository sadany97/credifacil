import React, { useState, useRef, useEffect } from 'react';
import Animated, { FadeIn, FadeInUp, FadeInDown, FadeInLeft, FadeInRight, FadeOut } from 'react-native-reanimated';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const AUTO_RESPONSES: { [key: string]: string } = {
  'hola': '¡Hola! Bienvenido al soporte de CrediFácil. ¿En qué puedo ayudarte hoy?',
  'ayuda': 'Claro, estoy aquí para ayudarte. Puedes preguntarme sobre:\n• Estado de tu caso\n• Documentos necesarios\n• Tiempos de crédito\n• Comisiones y costos',
  'estado': 'Para consultar el estado de tu caso, ve a la sección "Mi Caso" en el menú principal. Ahí podrás ver todos los detalles y actualizaciones.',
  'documentos': 'Los documentos que generalmente necesitamos son:\n• Identificación oficial\n• Comprobante de domicilio\n• Estados de cuenta\n• Comprobantes de transacciones',
  'tiempo': 'El tiempo de crédito varía según el caso. En promedio:\n• Casos simples: 2-4 semanas\n• Casos complejos: 8-12 semanas',
  'costo': 'Solo cobramos si recuperamos tu dinero. Nuestra comisión se define según la complejidad del caso. No hay pagos adelantados.',
  'gracias': '¡De nada! Estamos aquí para servirte. ¿Hay algo más en lo que pueda ayudarte?',
};

interface ChatSupportProps {
  visible: boolean;
  onClose: () => void;
}

export const ChatSupport: React.FC<ChatSupportProps> = ({ visible, onClose }) => {
  const { colors } = useTheme();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: '¡Hola! Soy el asistente virtual de CrediFácil. ¿En qué puedo ayudarte hoy?',
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (visible) {
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages, visible]);

  const getAutoResponse = (text: string): string => {
    const lowerText = text.toLowerCase();
    for (const [key, response] of Object.entries(AUTO_RESPONSES)) {
      if (lowerText.includes(key)) {
        return response;
      }
    }
    return 'Gracias por tu mensaje. Un asesor revisará tu consulta y te responderá a la brevedad. Mientras tanto, puedes consultar nuestras Preguntas Frecuentes para respuestas inmediatas.';
  };

  const sendMessage = () => {
    if (inputText.trim() === '') return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');

    // Auto response after delay
    setTimeout(() => {
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: getAutoResponse(inputText),
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMessage]);
    }, 1000);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.primary }]}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <View style={styles.avatarContainer}>
              <Ionicons name="chatbubbles" size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={styles.headerTitle}>Soporte en Vivo</Text>
              <View style={styles.onlineStatus}>
                <View style={styles.onlineDot} />
                <Text style={styles.onlineText}>En línea</Text>
              </View>
            </View>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message, index) => (
            <Animated.View
              key={message.id}
              entering={message.isUser ? FadeInRight : FadeInUp}
              style={[
                styles.messageWrapper,
                message.isUser ? styles.userMessageWrapper : styles.botMessageWrapper,
              ]}
            >
              {!message.isUser && (
                <View style={[styles.messageAvatar, { backgroundColor: colors.accent }]}>
                  <Ionicons name="person" size={16} color="#fff" />
                </View>
              )}
              <View
                style={[
                  styles.messageBubble,
                  message.isUser
                    ? [styles.userBubble, { backgroundColor: colors.accent }]
                    : [styles.botBubble, { backgroundColor: colors.card }],
                ]}
              >
                <Text
                  style={[
                    styles.messageText,
                    { color: message.isUser ? '#fff' : colors.text },
                  ]}
                >
                  {message.text}
                </Text>
                <Text
                  style={[
                    styles.messageTime,
                    { color: message.isUser ? 'rgba(255,255,255,0.7)' : colors.textMuted },
                  ]}
                >
                  {formatTime(message.timestamp)}
                </Text>
              </View>
            </Animated.View>
          ))}
        </ScrollView>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View style={[styles.inputContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
            <View style={[styles.inputWrapper, { backgroundColor: colors.inputBg }]}>
              <TextInput
                style={[styles.input, { color: colors.text }]}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Escribe tu mensaje..."
                placeholderTextColor={colors.textMuted}
                multiline
                maxLength={500}
              />
            </View>
            <TouchableOpacity
              style={[styles.sendBtn, { backgroundColor: colors.accent }]}
              onPress={sendMessage}
              disabled={inputText.trim() === ''}
            >
              <Ionicons name="send" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backBtn: {
    padding: 8,
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  onlineStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4CAF50',
    marginRight: 6,
  },
  onlineText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
  },
  userMessageWrapper: {
    justifyContent: 'flex-end',
  },
  botMessageWrapper: {
    justifyContent: 'flex-start',
  },
  messageAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 16,
  },
  userBubble: {
    borderBottomRightRadius: 4,
  },
  botBubble: {
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 12,
    borderTopWidth: 1,
  },
  inputWrapper: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
  },
  input: {
    fontSize: 16,
    maxHeight: 80,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});

export default ChatSupport;
