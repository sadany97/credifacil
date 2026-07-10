// CrediFácil - Timeline de estado del crédito
import React from 'react';
import Animated, { FadeInLeft } from 'react-native-reanimated';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, CREDIT_STATUSES, getCreditStatusById } from '../constants';

// Estados para mostrar en el timeline del usuario (simplificado)
const USER_TIMELINE_STATUSES = [
  { id: 'solicitud_recibida', label: 'Solicitud Recibida', icon: 'document-text' },
  { id: 'en_revision', label: 'En Revisión', icon: 'search' },
  { id: 'aprobado', label: 'Crédito Aprobado', icon: 'checkmark-circle' },
  { id: 'en_desembolso', label: 'En Desembolso', icon: 'trending-up' },
  { id: 'credito_otorgado', label: 'Crédito Otorgado', icon: 'cash' },
];

// Mapeo de estados a posición en timeline
const STATUS_POSITION_MAP: { [key: string]: number } = {
  'solicitud_recibida': 0,
  'en_revision': 1,
  'documentacion_pendiente': 1,
  'aprobado': 2,
  'aprobado_garantia': 2,
  'aprobado_mensualidad': 2,
  'en_desembolso': 3,
  'credito_otorgado': 4,
  'rechazado': -1,
  'rechazado_documentacion': -1,
  'cancelado_cliente': -1,
  // Legacy mappings
  'received': 0,
  'review': 1,
  'processing': 1,
  'recovering': 3,
  'completed': 4,
  'funds_recovered': 4,
  'funds_sent': 4,
  'cancelled': -1,
};

interface CaseTimelineProps {
  currentStatus: string;
  notes?: string;
  updatedAt?: string;
}

export const CaseTimeline: React.FC<CaseTimelineProps> = ({ 
  currentStatus = 'solicitud_recibida',
  notes,
  updatedAt 
}) => {
  const position = STATUS_POSITION_MAP[currentStatus] ?? 0;
  const statusInfo = getCreditStatusById(currentStatus);
  const isNegativeStatus = position === -1;

  // Si es estado negativo, mostrar vista especial
  if (isNegativeStatus && statusInfo) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Ionicons name="git-branch-outline" size={22} color={COLORS.primary} />
          <Text style={styles.title}>Estado de tu Crédito</Text>
        </View>

        <View style={styles.negativeStatusContainer}>
          <View style={[styles.negativeIconContainer, { backgroundColor: statusInfo.color + '20' }]}>
            <Ionicons name={statusInfo.icon as any} size={40} color={statusInfo.color} />
          </View>
          <Text style={[styles.negativeStatusLabel, { color: statusInfo.color }]}>
            {statusInfo.label}
          </Text>
          <Text style={styles.negativeStatusDescription}>
            {statusInfo.description}
          </Text>
        </View>

        {notes && (
          <View style={styles.notesBox}>
            <Ionicons name="document-text-outline" size={16} color={COLORS.accent} />
            <Text style={styles.notesText}>{notes}</Text>
          </View>
        )}

        {updatedAt && (
          <Text style={styles.updatedText}>
            Última actualización: {new Date(updatedAt).toLocaleDateString('es-MX')}
          </Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="git-branch-outline" size={22} color={COLORS.primary} />
        <Text style={styles.title}>Estado de tu Crédito</Text>
      </View>

      <View style={styles.timeline}>
        {USER_TIMELINE_STATUSES.map((status, index) => {
          const isCompleted = index <= position;
          const isCurrent = index === position;
          
          return (
            <Animated.View 
              key={status.id}
              entering={FadeInLeft.delay(index * 100)}
              style={styles.timelineItem}
            >
              <View style={styles.leftSection}>
                <View style={[
                  styles.iconCircle,
                  isCompleted && styles.iconCircleCompleted,
                  isCurrent && styles.iconCircleCurrent
                ]}>
                  <Ionicons 
                    name={isCompleted ? 'checkmark' : status.icon as any} 
                    size={18} 
                    color={isCompleted ? '#fff' : COLORS.textMuted} 
                  />
                </View>
                {index < USER_TIMELINE_STATUSES.length - 1 && (
                  <View style={[
                    styles.line,
                    isCompleted && styles.lineCompleted
                  ]} />
                )}
              </View>

              <View style={[
                styles.contentBox,
                isCurrent && styles.contentBoxCurrent
              ]}>
                <Text style={[
                  styles.statusLabel,
                  isCompleted && styles.statusLabelCompleted,
                  isCurrent && styles.statusLabelCurrent
                ]}>
                  {status.label}
                </Text>
                {isCurrent && (
                  <View style={styles.currentBadge}>
                    <Text style={styles.currentBadgeText}>Actual</Text>
                  </View>
                )}
              </View>
            </Animated.View>
          );
        })}
      </View>

      {/* Estado específico si es diferente del timeline */}
      {statusInfo && !USER_TIMELINE_STATUSES.find(s => s.id === currentStatus) && (
        <View style={[styles.specificStatusBox, { borderColor: statusInfo.color }]}>
          <Ionicons name={statusInfo.icon as any} size={20} color={statusInfo.color} />
          <View style={styles.specificStatusContent}>
            <Text style={[styles.specificStatusLabel, { color: statusInfo.color }]}>
              {statusInfo.label}
            </Text>
            <Text style={styles.specificStatusDescription}>
              {statusInfo.description}
            </Text>
          </View>
        </View>
      )}

      {notes && (
        <View style={styles.notesBox}>
          <Ionicons name="document-text-outline" size={16} color={COLORS.accent} />
          <Text style={styles.notesText}>{notes}</Text>
        </View>
      )}

      {updatedAt && (
        <Text style={styles.updatedText}>
          Última actualización: {new Date(updatedAt).toLocaleDateString('es-MX')}
        </Text>
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
  timeline: {
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  leftSection: {
    alignItems: 'center',
    marginRight: 16,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircleCompleted: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  iconCircleCurrent: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    transform: [{ scale: 1.1 }],
  },
  line: {
    width: 2,
    height: 30,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },
  lineCompleted: {
    backgroundColor: COLORS.success,
  },
  contentBox: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: COLORS.background,
    borderRadius: 10,
    marginBottom: 12,
  },
  contentBoxCurrent: {
    backgroundColor: COLORS.primary + '15',
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  statusLabel: {
    fontSize: 14,
    color: COLORS.textMuted,
    flex: 1,
  },
  statusLabelCompleted: {
    color: COLORS.success,
    fontWeight: '500',
  },
  statusLabelCurrent: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  currentBadge: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  currentBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  specificStatusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.background,
    padding: 14,
    borderRadius: 12,
    marginTop: 12,
    borderLeftWidth: 4,
  },
  specificStatusContent: {
    flex: 1,
  },
  specificStatusLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  specificStatusDescription: {
    fontSize: 12,
    color: COLORS.textLight,
  },
  negativeStatusContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  negativeIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  negativeStatusLabel: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  negativeStatusDescription: {
    fontSize: 14,
    color: COLORS.textLight,
    textAlign: 'center',
  },
  notesBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: COLORS.accent + '10',
    padding: 14,
    borderRadius: 12,
    marginTop: 16,
  },
  notesText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.textLight,
    lineHeight: 18,
  },
  updatedText: {
    fontSize: 11,
    color: COLORS.textMuted,
    textAlign: 'center',
    marginTop: 12,
  },
});

export default CaseTimeline;
