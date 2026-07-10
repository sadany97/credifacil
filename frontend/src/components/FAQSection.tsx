import React, { useState } from 'react';
import Animated, { FadeIn, FadeInUp, FadeInDown, FadeInLeft, FadeInRight, FadeOut } from 'react-native-reanimated';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

const FAQ_DATA = [
  {
    id: '1',
    question: '¿Cuánto tiempo tarda en aprobarse mi crédito?',
    answer: 'La aprobación es rápida. Una vez que envías tu solicitud completa, recibes respuesta en 24-48 horas hábiles. El depósito se realiza en 1-3 días hábiles tras la firma del contrato.',
    icon: 'time-outline',
  },
  {
    id: '2',
    question: '¿Es seguro solicitar mi crédito?',
    answer: 'Absolutamente. Utilizamos encriptación de nivel bancario para proteger tu información. Todos nuestros procesos están regulados por CONDUSEF y supervisados por las autoridades.',
    icon: 'shield-checkmark-outline',
  },
  {
    id: '3',
    question: '¿Cuál es la tasa de interés?',
    answer: 'Nuestras tasas son competitivas, desde 2% mensual dependiendo de tu perfil crediticio. Te mostramos el CAT y costo total antes de firmar, sin letra chica.',
    icon: 'cash-outline',
  },
  {
    id: '4',
    question: '¿Qué documentos necesito?',
    answer: 'Necesitas: INE vigente, comprobante de domicilio (menos de 3 meses), comprobante de ingresos y datos de tu cuenta bancaria.',
    icon: 'document-text-outline',
  },
  {
    id: '5',
    question: '¿Cómo puedo ver el estado de mi solicitud?',
    answer: 'Puedes ver el estado actualizado de tu solicitud en la app. Verás una línea de tiempo con el progreso: solicitud, revisión, aprobación y depósito.',
    icon: 'git-branch-outline',
  },
  {
    id: '6',
    question: '¿Puedo pagar antes de tiempo?',
    answer: 'Sí, puedes liquidar anticipadamente sin penalización. Además te hacemos descuento en los intereses no devengados. ¡Premiamos tu buen comportamiento!',
    icon: 'close-circle-outline',
  },
  {
    id: '7',
    question: '¿Cómo me contacto con soporte?',
    answer: 'Puedes usar el chat integrado en la app, enviarnos un mensaje por WhatsApp, o llamarnos. Nuestro equipo está disponible de lunes a viernes de 9am a 6pm.',
    icon: 'chatbubbles-outline',
  },
  {
    id: '8',
    question: '¿Qué pasa si no puedo pagar?',
    answer: 'Contáctanos antes de tu fecha de pago. Podemos ofrecerte opciones como reestructuración o extensión de plazo. Queremos ayudarte, no complicarte.',
    icon: 'lock-closed-outline',
  },
];

interface FAQSectionProps {
  compact?: boolean;
}

export const FAQSection: React.FC<FAQSectionProps> = ({ compact = false }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const displayData = compact ? FAQ_DATA.slice(0, 4) : FAQ_DATA;

  return (
    <View style={[styles.container, compact && styles.containerCompact]}>
      <View style={styles.header}>
        <Ionicons name="help-circle" size={24} color={COLORS.primary} />
        <Text style={styles.title}>Preguntas Frecuentes</Text>
      </View>

      <ScrollView 
        showsVerticalScrollIndicator={false}
        style={compact ? { maxHeight: 400 } : undefined}
      >
        {displayData.map((item, index) => (
          <Animated.View
            key={item.id}
            entering={FadeInDown.delay(index * 50)}
          >
            <TouchableOpacity
              style={[
                styles.faqItem,
                expandedId === item.id && styles.faqItemExpanded
              ]}
              onPress={() => toggleExpand(item.id)}
              activeOpacity={0.7}
            >
              <View style={styles.questionRow}>
                <View style={[
                  styles.iconContainer,
                  expandedId === item.id && styles.iconContainerActive
                ]}>
                  <Ionicons 
                    name={item.icon as any} 
                    size={20} 
                    color={expandedId === item.id ? COLORS.primary : COLORS.textMuted} 
                  />
                </View>
                <Text style={[
                  styles.questionText,
                  expandedId === item.id && styles.questionTextActive
                ]}>
                  {item.question}
                </Text>
                <Ionicons 
                  name={expandedId === item.id ? 'chevron-up' : 'chevron-down'} 
                  size={20} 
                  color={COLORS.textMuted} 
                />
              </View>

              {expandedId === item.id && (
                <Animated.View 
                  entering={FadeInDown.duration(200)}
                  style={styles.answerContainer}
                >
                  <Text style={styles.answerText}>{item.answer}</Text>
                </Animated.View>
              )}
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>

      {compact && (
        <TouchableOpacity style={styles.viewAllBtn}>
          <Text style={styles.viewAllText}>Ver todas las preguntas</Text>
          <Ionicons name="arrow-forward" size={16} color={COLORS.primary} />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  containerCompact: {
    marginHorizontal: 0,
    borderRadius: 0,
    marginVertical: 0,
    paddingVertical: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  faqItem: {
    backgroundColor: COLORS.background,
    borderRadius: 14,
    marginBottom: 10,
    overflow: 'hidden',
  },
  faqItemExpanded: {
    backgroundColor: COLORS.primary + '08',
    borderWidth: 1,
    borderColor: COLORS.primary + '30',
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: COLORS.card,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainerActive: {
    backgroundColor: COLORS.primary + '20',
  },
  questionText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    lineHeight: 20,
  },
  questionTextActive: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  answerContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    paddingTop: 4,
    marginLeft: 48,
  },
  answerText: {
    fontSize: 13,
    color: COLORS.textLight,
    lineHeight: 20,
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingTop: 16,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  },
});

export default FAQSection;
