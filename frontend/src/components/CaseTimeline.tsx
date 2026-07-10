import React from 'react';
import Animated, { FadeIn, FadeInUp, FadeInDown, FadeInLeft, FadeInRight, FadeOut } from 'react-native-reanimated';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

const CASE_STATUSES = [
  { id: 'received', label: 'Caso Recibido', icon: 'document-text' },
  { id: 'review', label: 'En Revisión', icon: 'search' },
  { id: 'processing', label: 'Procesando', icon: 'hourglass' },
  { id: 'recovering', label: 'Recuperando', icon: 'trending-up' },
  { id: 'completed', label: 'Completado', icon: 'checkmark-circle' },
];

interface CaseTimelineProps {
  currentStatus: string;
  notes?: string;
  updatedAt?: string;
}

export const CaseTimeline: React.FC<CaseTimelineProps> = ({ 
  currentStatus = 'received',
  notes,
  updatedAt 
}) => {
  const currentIndex = CASE_STATUSES.findIndex(s => s.id === currentStatus);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="git-branch-outline" size={22} color={COLORS.primary} />
        <Text style={styles.title}>Estado de tu Caso</Text>
      </View>

      <View style={styles.timeline}>
        {CASE_STATUSES.map((status, index) => {
          const isCompleted = index <= currentIndex;
          const isCurrent = index === currentIndex;
          
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
                {index < CASE_STATUSES.length - 1 && (
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
