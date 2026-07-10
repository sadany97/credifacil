import React from 'react';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, Testimonio } from '../constants';
import { StarRating } from './StarRating';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 80;

interface TestimonialCardProps {
  testimonial: Testimonio;
  index?: number;
}

// Colores para avatares
const AVATAR_COLORS = [
  '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
  '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
  '#F8B500', '#00CED1', '#FF7F50', '#9370DB', '#20B2AA'
];

export const TestimonialCard: React.FC<TestimonialCardProps> = ({ testimonial, index = 0 }) => {
  const avatarColor = AVATAR_COLORS[index % AVATAR_COLORS.length];
  
  // Obtener iniciales del nombre
  const getInitials = (name: string): string => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };
  
  return (
    <Animated.View 
      entering={FadeInUp.delay(index * 100).springify()}
      style={styles.testimonialCard}
    >
      {/* Header con gradiente */}
      <View style={styles.cardHeader}>
        <View style={styles.quoteIcon}>
          <Ionicons name="chatbox-ellipses" size={20} color={COLORS.accent} />
        </View>
      </View>

      <View style={styles.testimonialHeader}>
        <View style={[styles.testimonialAvatar, { backgroundColor: avatarColor }]}>
          <Text style={styles.testimonialAvatarText}>{getInitials(testimonial.nombre)}</Text>
        </View>
        <View style={styles.testimonialInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.testimonialName}>{testimonial.nombre}</Text>
            {testimonial.verificado && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#1DA1F2" />
              </View>
            )}
          </View>
          <View style={styles.testimonialLocation}>
            <Ionicons name="location-outline" size={12} color={COLORS.textMuted} />
            <Text style={styles.testimonialLocationText}>{testimonial.ciudad}</Text>
          </View>
        </View>
      </View>

      {/* Amount destacado */}
      <View style={styles.amountContainer}>
        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>Crédito Aprobado</Text>
          <Text style={styles.amountValue}>{testimonial.montoFormateado}</Text>
          <View style={styles.amountBadge}>
            <Ionicons name="checkmark-circle" size={12} color="#fff" />
            <Text style={styles.amountBadgeText}>Aprobado</Text>
          </View>
        </View>
      </View>

      {/* Propósito */}
      <View style={styles.purposeContainer}>
        <Ionicons name="ribbon" size={14} color={COLORS.primary} />
        <Text style={styles.purposeText}>{testimonial.proposito}</Text>
      </View>
      
      <StarRating rating={testimonial.estrellas} />
      
      <Text style={styles.testimonialComment}>"{testimonial.testimonio}"</Text>
      
      <View style={styles.testimonialFooter}>
        <View style={styles.verifiedReview}>
          <Ionicons name="shield-checkmark" size={16} color={COLORS.success} />
          <Text style={styles.verifiedText}>Cliente Verificado</Text>
        </View>
        <View style={styles.dateContainer}>
          <Ionicons name="calendar-outline" size={12} color={COLORS.textMuted} />
          <Text style={styles.testimonialDate}>{testimonial.fechaRelativa}</Text>
        </View>
      </View>

      {/* Decoración inferior */}
      <View style={styles.cardDecoration} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  testimonialCard: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    width: CARD_WIDTH,
    marginHorizontal: 10,
    padding: 0,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 8,
  },
  cardHeader: {
    height: 12,
    backgroundColor: COLORS.primary,
  },
  quoteIcon: {
    position: 'absolute',
    top: 20,
    right: 20,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.accent + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  testimonialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },
  testimonialAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    borderWidth: 3,
    borderColor: COLORS.card,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  testimonialAvatarText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#fff',
  },
  testimonialInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  testimonialName: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.text,
    marginRight: 6,
  },
  verifiedBadge: {
    marginLeft: 2,
  },
  testimonialLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  testimonialLocationText: {
    fontSize: 12,
    color: COLORS.textMuted,
  },
  amountContainer: {
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  amountBox: {
    backgroundColor: COLORS.success + '10',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.success + '20',
  },
  amountLabel: {
    fontSize: 11,
    color: COLORS.success,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  amountValue: {
    fontSize: 28,
    fontWeight: '800',
    color: COLORS.success,
    letterSpacing: -0.5,
  },
  amountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: COLORS.success,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginTop: 8,
  },
  amountBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  purposeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  purposeText: {
    fontSize: 13,
    color: COLORS.primary,
    fontWeight: '500',
    fontStyle: 'italic',
  },
  testimonialComment: {
    fontSize: 15,
    color: COLORS.textLight,
    lineHeight: 24,
    paddingHorizontal: 20,
    marginTop: 10,
    marginBottom: 16,
    fontStyle: 'italic',
  },
  testimonialFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  verifiedReview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: COLORS.success + '10',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  verifiedText: {
    fontSize: 11,
    color: COLORS.success,
    fontWeight: '600',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  testimonialDate: {
    fontSize: 11,
    color: COLORS.textMuted,
  },
  cardDecoration: {
    height: 4,
    backgroundColor: COLORS.success,
  },
});

export default TestimonialCard;
