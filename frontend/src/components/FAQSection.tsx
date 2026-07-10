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
    question: '¿Cuánto tiempo tarda el proceso de crédito?',
    answer: 'El tiempo varía según cada caso. Generalmente, los casos simples se resuelven en 2-4 semanas, mientras que casos más complejos pueden tomar de 4-8 semanas. Te mantendremos informado del progreso en todo momento.',
    icon: 'time-outline',
  },
  {
    id: '2',
    question: '¿Es seguro el proceso?',
    answer: 'Absolutamente. Utilizamos encriptación de nivel bancario para proteger tu información. Todos nuestros procesos están regulados y supervisados por las autoridades correspondientes.',
    icon: 'shield-checkmark-outline',
  },
  {
    id: '3',
    question: '¿Cuál es la comisión por el servicio?',
    answer: 'Nuestra comisión es del 5% sobre el monto recuperado, solo si logramos recuperar tu dinero. Si no recuperamos nada, no pagas nada.',
    icon: 'cash-outline',
  },
  {
    id: '4',
    question: '¿Qué documentos necesito?',
    answer: 'Generalmente necesitamos: identificación oficial (INE/Pasaporte), comprobantes de las transacciones, y cualquier comunicación que tengas relacionada con el caso.',
    icon: 'document-text-outline',
  },
  {
    id: '5',
    question: '¿Cómo puedo ver el estado de mi caso?',
    answer: 'Puedes ver el estado actualizado de tu caso en la sección "Estado del Caso" dentro de la aplicación. Ahí verás una línea de tiempo con el progreso actual.',
    icon: 'git-branch-outline',
  },
  {
    id: '6',
    question: '¿Puedo cancelar el proceso?',
    answer: 'Sí, puedes cancelar en cualquier momento antes de que se complete la crédito. Sin embargo, te recomendamos comunicarte con nosotros antes para entender las implicaciones.',
    icon: 'close-circle-outline',
  },
  {
    id: '7',
    question: '¿Cómo me contacto con soporte?',
    answer: 'Puedes usar el chat integrado en la aplicación, enviarnos un mensaje por WhatsApp, o llamarnos directamente. Nuestro equipo está disponible de lunes a viernes de 9am a 6pm.',
    icon: 'chatbubbles-outline',
  },
  {
    id: '8',
    question: '¿Qué pasa si mi saldo aparece retenido?',
    answer: 'El saldo retenido indica fondos que están en proceso de liberación o que requieren alguna acción adicional. Revisa la sección de "Saldo Retenido" para ver los detalles y requisitos específicos.',
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
