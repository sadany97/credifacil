import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

interface StarRatingProps {
  rating: number;
}

export const StarRating: React.FC<StarRatingProps> = ({ rating }) => (
  <View style={styles.starContainer}>
    {[1, 2, 3, 4, 5].map((star) => (
      <Ionicons
        key={star}
        name={star <= rating ? 'star' : 'star-outline'}
        size={14}
        color={COLORS.gold}
        style={{ marginRight: 2 }}
      />
    ))}
  </View>
);

const styles = StyleSheet.create({
  starContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
});

export default StarRating;
