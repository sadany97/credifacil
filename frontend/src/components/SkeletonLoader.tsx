import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { COLORS } from '../constants';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
};

// Card Skeleton for User Dashboard
export const CardSkeleton: React.FC = () => (
  <View style={styles.cardSkeletonContainer}>
    <View style={styles.cardSkeleton}>
      <View style={styles.cardSkeletonHeader}>
        <SkeletonLoader width={120} height={24} borderRadius={6} />
        <SkeletonLoader width={60} height={24} borderRadius={6} />
      </View>
      <SkeletonLoader width={50} height={38} borderRadius={8} style={{ marginTop: 20 }} />
      <SkeletonLoader width="80%" height={28} borderRadius={4} style={{ marginTop: 20 }} />
      <View style={styles.cardSkeletonFooter}>
        <View>
          <SkeletonLoader width={100} height={10} borderRadius={4} />
          <SkeletonLoader width={150} height={16} borderRadius={4} style={{ marginTop: 6 }} />
        </View>
        <SkeletonLoader width={70} height={24} borderRadius={12} />
      </View>
    </View>
  </View>
);

// Balance Skeleton
export const BalanceSkeleton: React.FC = () => (
  <View style={styles.balanceSkeletonContainer}>
    <View style={styles.balanceSkeletonItem}>
      <SkeletonLoader width={40} height={40} borderRadius={12} />
      <View style={{ marginLeft: 12, flex: 1 }}>
        <SkeletonLoader width={80} height={12} borderRadius={4} />
        <SkeletonLoader width={120} height={24} borderRadius={4} style={{ marginTop: 6 }} />
      </View>
    </View>
    <View style={styles.balanceSkeletonItem}>
      <SkeletonLoader width={40} height={40} borderRadius={12} />
      <View style={{ marginLeft: 12, flex: 1 }}>
        <SkeletonLoader width={80} height={12} borderRadius={4} />
        <SkeletonLoader width={120} height={24} borderRadius={4} style={{ marginTop: 6 }} />
      </View>
    </View>
  </View>
);

// User Card Skeleton for Admin
export const UserCardSkeleton: React.FC = () => (
  <View style={styles.userCardSkeleton}>
    <SkeletonLoader width={54} height={54} borderRadius={16} />
    <View style={{ flex: 1, marginLeft: 14 }}>
      <SkeletonLoader width="60%" height={18} borderRadius={4} />
      <SkeletonLoader width="80%" height={14} borderRadius={4} style={{ marginTop: 6 }} />
      <View style={{ flexDirection: 'row', marginTop: 10, gap: 8 }}>
        <SkeletonLoader width={100} height={14} borderRadius={4} />
        <SkeletonLoader width={100} height={14} borderRadius={4} />
      </View>
    </View>
  </View>
);

// Stats Skeleton
export const StatsSkeleton: React.FC = () => (
  <View style={styles.statsSkeletonContainer}>
    <View style={styles.statSkeletonItem}>
      <SkeletonLoader width={48} height={48} borderRadius={14} />
      <SkeletonLoader width={40} height={28} borderRadius={4} style={{ marginTop: 10 }} />
      <SkeletonLoader width={60} height={12} borderRadius={4} style={{ marginTop: 6 }} />
    </View>
    <View style={styles.statSkeletonItem}>
      <SkeletonLoader width={48} height={48} borderRadius={14} />
      <SkeletonLoader width={80} height={28} borderRadius={4} style={{ marginTop: 10 }} />
      <SkeletonLoader width={60} height={12} borderRadius={4} style={{ marginTop: 6 }} />
    </View>
  </View>
);

// Full Dashboard Skeleton
export const DashboardSkeleton: React.FC = () => (
  <View style={styles.dashboardSkeleton}>
    <View style={styles.headerSkeleton}>
      <View>
        <SkeletonLoader width={100} height={14} borderRadius={4} />
        <SkeletonLoader width={150} height={22} borderRadius={4} style={{ marginTop: 6 }} />
      </View>
      <SkeletonLoader width={44} height={44} borderRadius={22} />
    </View>
    <CardSkeleton />
    <BalanceSkeleton />
    <View style={styles.actionsSkeleton}>
      <SkeletonLoader width="30%" height={80} borderRadius={16} />
      <SkeletonLoader width="30%" height={80} borderRadius={16} />
      <SkeletonLoader width="30%" height={80} borderRadius={16} />
    </View>
  </View>
);

// Admin Dashboard Skeleton
export const AdminDashboardSkeleton: React.FC = () => (
  <View style={styles.dashboardSkeleton}>
    <View style={styles.headerSkeleton}>
      <View>
        <SkeletonLoader width={100} height={14} borderRadius={4} />
        <SkeletonLoader width={180} height={22} borderRadius={4} style={{ marginTop: 6 }} />
      </View>
      <SkeletonLoader width={44} height={44} borderRadius={22} />
    </View>
    <StatsSkeleton />
    <View style={{ marginTop: 20 }}>
      <SkeletonLoader width={160} height={20} borderRadius={4} style={{ marginBottom: 16 }} />
      <UserCardSkeleton />
      <UserCardSkeleton />
      <UserCardSkeleton />
    </View>
  </View>
);

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: COLORS.border,
  },
  cardSkeletonContainer: {
    marginHorizontal: 20,
    marginTop: 20,
  },
  cardSkeleton: {
    backgroundColor: COLORS.primary + '20',
    borderRadius: 24,
    padding: 24,
    minHeight: 220,
  },
  cardSkeletonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardSkeletonFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 20,
  },
  balanceSkeletonContainer: {
    marginHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
  balanceSkeletonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 16,
  },
  userCardSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },
  statsSkeletonContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginTop: 20,
    gap: 12,
  },
  statSkeletonItem: {
    flex: 1,
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 20,
    alignItems: 'center',
  },
  dashboardSkeleton: {
    flex: 1,
    padding: 20,
  },
  headerSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionsSkeleton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    gap: 10,
  },
});

export default SkeletonLoader;
