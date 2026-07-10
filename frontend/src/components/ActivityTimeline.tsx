import React from 'react';
import Animated, { FadeIn, FadeInUp, FadeInDown, FadeInLeft, FadeInRight, FadeOut } from 'react-native-reanimated';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../constants';

interface TimelineItem {
  id: string;
  title: string;
  description: string;
  date: string;
  type: 'success' | 'pending' | 'info' | 'warning';
  icon: string;
}

interface ActivityTimelineProps {
  items: TimelineItem[];
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({ items }) => {
  const getTypeColor = (type: TimelineItem['type']) => {
    switch (type) {
      case 'success': return COLORS.success;
      case 'pending': return COLORS.warning;
      case 'warning': return COLORS.danger;
      default: return COLORS.accent;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="time" size={20} color={COLORS.accent} />
        <Text style={styles.title}>Actividad Reciente</Text>
      </View>

      <View style={styles.timeline}>
        {items.map((item, index) => (
          <Animated.View
            key={item.id}
            entering={FadeInLeft.delay(index * 100)}
            style={styles.timelineItem}
          >
            <View style={styles.timelineLeft}>
              <View style={[styles.iconContainer, { backgroundColor: getTypeColor(item.type) + '20' }]}>
                <Ionicons name={item.icon as any} size={16} color={getTypeColor(item.type)} />
              </View>
              {index < items.length - 1 && (
                <View style={styles.line} />
              )}
            </View>
            <View style={styles.timelineContent}>
              <View style={styles.contentHeader}>
                <Text style={styles.itemTitle}>{item.title}</Text>
                <Text style={styles.itemDate}>{item.date}</Text>
              </View>
              <Text style={styles.itemDescription}>{item.description}</Text>
            </View>
          </Animated.View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  timeline: {
    paddingLeft: 4,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  timelineLeft: {
    alignItems: 'center',
    marginRight: 12,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  line: {
    width: 2,
    flex: 1,
    marginVertical: 4,
    backgroundColor: COLORS.border,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 20,
  },
  contentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    color: COLORS.text,
  },
  itemDate: {
    fontSize: 11,
    marginLeft: 8,
    color: COLORS.textMuted,
  },
  itemDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: COLORS.textLight,
  },
});

export default ActivityTimeline;
