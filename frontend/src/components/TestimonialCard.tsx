import React from 'react';
import Animated, { FadeIn, FadeInUp, FadeInDown, FadeInLeft, FadeInRight, FadeOut } from 'react-native-reanimated';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, Testimonial } from '../constants';
import { StarRating } from './StarRating';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 80;

interface TestimonialCardProps {
  testimonial: Testimonial;
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
          <Text style={styles.testimonialAvatarText}>{testimonial.avatar}</Text>
        </View>
        <View style={styles.testimonialInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.testimonialName}>{testimonial.name}</Text>
            {testimonial.verified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={14} color="#1DA1F2" />
              </View>
            )}
          </View>
          <View style={styles.testimonialLocation}>
            <Ionicons name="location-outline" size={12} color={COLORS.textMuted} />
            <Text style={styles.testimonialLocationText}>{testimonial.location}</Text>
          </View>
        </View>
      </View>

      {/* Amount destacado */}
      <View style={styles.amountContainer}>
        <View style={styles.amountBox}>
          <Text style={styles.amountLabel}>Capital Recuperado</Text>
          <Text style={styles.amountValue}>{testimonial.amount}</Text>
          <View style={styles.amountBadge}>
            <Ionicons name="trending-up" size={12} color="#fff" />
            <Text style={styles.amountBadgeText}>100%</Text>
          </View>
        </View>
      </View>
      
      <StarRating rating={testimonial.rating} />
      
      <Text style={styles.testimonialComment}>"{testimonial.comment}"</Text>
      
      <View style={styles.testimonialFooter}>
        <View style={styles.verifiedReview}>
          <Ionicons name="shield-checkmark" size={16} color={COLORS.success} />
          <Text style={styles.verifiedText}>Cliente Verificado</Text>
        </View>
        <View style={styles.dateContainer}>
          <Ionicons name="calendar-outline" size={12} color={COLORS.textMuted} />
          <Text style={styles.testimonialDate}>{(testimonial as any).timeAgo || testimonial.date}</Text>
        </View>
      </View>

      {/* Decoración inferior */}
      <View style={styles.cardDecoration} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  testimonialCard: {
    width: CARD_WIDTH,
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 20,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
    borderWidth: 1,
    borderColor: 'rgba(201, 162, 39, 0.1)',
    overflow: 'hidden',
  },
  cardHeader: {
    position: 'absolute',
    top: 12,
    right: 12,
    opacity: 0.3,
  },
  quoteIcon: {
    transform: [{ rotate: '180deg' }],
  },
  testimonialHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  testimonialAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  testimonialAvatarText: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '700',
  },
  testimonialInfo: {
    flex: 1,
    marginLeft: 14,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  testimonialName: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.text,
  },
  verifiedBadge: {
    marginLeft: 6,
  },
  testimonialLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  testimonialLocationText: {
    fontSize: 12,
    color: COLORS.textMuted,
    marginLeft: 4,
  },
  amountContainer: {
    marginBottom: 12,
  },
  amountBox: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.success,
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 11,
    color: COLORS.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  amountValue: {
    fontSize: 20,
    fontWeight: '800',
    color: COLORS.success,
    marginLeft: 'auto',
  },
  amountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  amountBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
    marginLeft: 2,
  },
  testimonialComment: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 24,
    fontStyle: 'italic',
    marginTop: 8,
  },
  testimonialFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  verifiedReview: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
  },
  verifiedText: {
    fontSize: 11,
    color: COLORS.success,
    fontWeight: '600',
    marginLeft: 4,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  testimonialDate: {
    fontSize: 11,
    color: COLORS.textMuted,
    fontWeight: '500',
  },
  cardDecoration: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: COLORS.accent,
    opacity: 0.3,
  },
});

export default TestimonialCard;
