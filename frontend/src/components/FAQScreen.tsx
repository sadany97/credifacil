import React, { useState } from 'react';
import Animated, { FadeIn, FadeInUp, FadeInDown, FadeInLeft, FadeInRight, FadeOut, Layout } from 'react-native-reanimated';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

const FAQ_DATA = [
  {
    id: '1',
    question: '¿Qué es CrediFácil?',
    answer: 'Somos una empresa financiera especializada en otorgar créditos personales de forma rápida, fácil y sin complicaciones. Ofrecemos préstamos desde $5,000 hasta $100,000 MXN.',
    category: 'general',
  },
  {
    id: '2',
    question: '¿Cuánto tiempo tarda en aprobarse mi crédito?',
    answer: 'La aprobación es rápida. Una vez que envías tu solicitud completa con todos los documentos, recibes respuesta en 24-48 horas hábiles. El depósito se realiza en 1-3 días hábiles.',
    category: 'proceso',
  },
  {
    id: '3',
    question: '¿Cuál es la tasa de interés?',
    answer: 'Nuestras tasas de interés son competitivas y varían según tu perfil crediticio. Manejamos tasas desde el 2% mensual. Te damos el costo total antes de firmar, sin sorpresas.',
    category: 'costos',
  },
  {
    id: '4',
    question: '¿Qué documentos necesito para solicitar mi crédito?',
    answer: 'Necesitas: INE vigente, comprobante de domicilio reciente (menos de 3 meses), comprobante de ingresos (nómina, estados de cuenta, o declaración fiscal), y datos de una cuenta bancaria a tu nombre.',
    category: 'proceso',
  },
  {
    id: '5',
    question: '¿Están regulados por alguna autoridad?',
    answer: 'Sí, operamos bajo la supervisión de la CONDUSEF y cumplimos con todas las normativas de la SHCP para servicios financieros en México.',
    category: 'general',
  },
  {
    id: '6',
    question: '¿Cómo protegen mis datos personales?',
    answer: 'Tu información está protegida con encriptación de nivel bancario. Cumplimos con la Ley Federal de Protección de Datos Personales y no compartimos tu información con terceros sin tu consentimiento.',
    category: 'seguridad',
  },
  {
    id: '7',
    question: '¿Qué tipos de créditos ofrecen?',
    answer: 'Ofrecemos: créditos personales, préstamos de nómina, créditos para emprendedores, y préstamos con garantía. Cada producto tiene condiciones adaptadas a tus necesidades.',
    category: 'servicios',
  },
  {
    id: '8',
    question: '¿Cómo puedo dar seguimiento a mi solicitud?',
    answer: 'A través de nuestra app puedes ver el estado de tu solicitud en tiempo real, recibir notificaciones de avances, comunicarte con tu asesor y descargar tu contrato y comprobantes.',
    category: 'proceso',
  },
  {
    id: '9',
    question: '¿Qué pasa si no puedo pagar a tiempo?',
    answer: 'Si tienes dificultades, contáctanos antes de tu fecha de pago. Podemos ofrecerte opciones como reestructuración o extensión de plazo. Queremos ayudarte, no complicarte.',
    category: 'costos',
  },
  {
    id: '10',
    question: '¿Puedo liquidar mi crédito antes de tiempo?',
    answer: 'Sí, puedes liquidar anticipadamente sin penalización. Además, te hacemos un descuento en los intereses no devengados. ¡Premiamos tu buen comportamiento!',
    category: 'general',
  },
];

interface FAQScreenProps {
  visible: boolean;
  onClose: () => void;
}

export const FAQScreen: React.FC<FAQScreenProps> = ({ visible, onClose }) => {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredFAQ = FAQ_DATA.filter(
    (item) =>
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.card }]}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Preguntas Frecuentes</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
          <View style={[styles.searchBox, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
            <Ionicons name="search" size={20} color={colors.textMuted} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder="Buscar pregunta..."
              placeholderTextColor={colors.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')}>
                <Ionicons name="close-circle" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {filteredFAQ.map((item, index) => (
            <Animated.View
              key={item.id}
              entering={FadeInDown.delay(index * 50)}
              layout={Layout.springify()}
            >
              <TouchableOpacity
                style={[styles.faqItem, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => toggleExpand(item.id)}
                activeOpacity={0.7}
              >
                <View style={styles.questionRow}>
                  <Text style={[styles.question, { color: colors.text }]}>{item.question}</Text>
                  <Ionicons
                    name={expandedId === item.id ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={colors.accent}
                  />
                </View>
                {expandedId === item.id && (
                  <Animated.View entering={FadeInDown.duration(200)}>
                    <View style={[styles.divider, { backgroundColor: colors.border }]} />
                    <Text style={[styles.answer, { color: colors.textLight }]}>{item.answer}</Text>
                  </Animated.View>
                )}
              </TouchableOpacity>
            </Animated.View>
          ))}

          {filteredFAQ.length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="search" size={48} color={colors.textMuted} />
              <Text style={[styles.emptyText, { color: colors.textMuted }]}>
                No se encontraron resultados
              </Text>
            </View>
          )}

          <View style={styles.bottomPadding} />
        </ScrollView>
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
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backBtn: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  faqItem: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  questionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  question: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  answer: {
    fontSize: 14,
    lineHeight: 22,
  },
  emptyState: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
  },
  bottomPadding: {
    height: 40,
  },
});

export default FAQScreen;
