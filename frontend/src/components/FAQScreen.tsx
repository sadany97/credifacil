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
    question: '¿Qué es CrediFácil Financiero?',
    answer: 'Somos una empresa especializada en la crédito de fondos perdidos, fraudes bancarios, inversiones fallidas y cargos no reconocidos. Contamos con más de 10 años de experiencia ayudando a mexicanos a recuperar su dinero.',
    category: 'general',
  },
  {
    id: '2',
    question: '¿Cuánto tiempo tarda el proceso de crédito?',
    answer: 'El tiempo varía según la complejidad del caso. En promedio, los casos simples se resuelven en 2-4 semanas, mientras que casos más complejos pueden tomar 8-12 semanas. Te mantenemos informado en cada paso del proceso.',
    category: 'proceso',
  },
  {
    id: '3',
    question: '¿Cuánto cobran por sus servicios?',
    answer: 'Trabajamos con un modelo de éxito: solo cobramos si recuperamos tu dinero. Nuestra comisión es un porcentaje del monto recuperado, que se define según la complejidad del caso. No hay pagos por adelantado.',
    category: 'costos',
  },
  {
    id: '4',
    question: '¿Qué documentos necesito para iniciar mi caso?',
    answer: 'Generalmente necesitamos: identificación oficial, comprobante de domicilio, estados de cuenta o comprobantes de la transacción en disputa, y cualquier comunicación con la institución financiera. Te guiamos en cada paso.',
    category: 'proceso',
  },
  {
    id: '5',
    question: '¿Están regulados por alguna autoridad?',
    answer: 'Sí, estamos sujetos a supervisión de la SHCP (Secretaría de Hacienda y Crédito Público) y cumplimos con todas las normativas aplicables para servicios financieros en México.',
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
    question: '¿Qué tipos de casos manejan?',
    answer: 'Manejamos: fraudes bancarios, cargos no reconocidos, inversiones fraudulentas, phishing y robo de identidad, transferencias no autorizadas, y crédito de fondos de empresas fraudulentas.',
    category: 'servicios',
  },
  {
    id: '8',
    question: '¿Cómo puedo dar seguimiento a mi caso?',
    answer: 'A través de nuestra app puedes ver el estado de tu caso en tiempo real, recibir notificaciones de avances, comunicarte con tu asesor asignado y descargar documentos relacionados.',
    category: 'proceso',
  },
  {
    id: '9',
    question: '¿Qué pasa si no logran recuperar mi dinero?',
    answer: 'Si después de agotar todas las vías legales y administrativas no logramos recuperar tu dinero, no te cobramos nada. Nuestro compromiso es trabajar solo por resultados.',
    category: 'costos',
  },
  {
    id: '10',
    question: '¿Puedo cancelar el servicio en cualquier momento?',
    answer: 'Sí, puedes cancelar en cualquier momento sin penalización. Sin embargo, te recomendamos comunicarte con tu asesor antes de tomar esta decisión para evaluar el estado de tu caso.',
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
