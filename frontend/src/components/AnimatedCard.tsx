import React from 'react';
import { ViewStyle, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
} from 'react-native-reanimated';

interface AnimatedCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  enable3D?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  style,
  onPress,
  enable3D = true,
}) => {
  const pressed = useSharedValue(0);
  const rotateX = useSharedValue(0);
  const rotateY = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(pressed.value, [0, 1], [1, 0.98]);
    
    if (enable3D) {
      return {
        transform: [
          { perspective: 1000 },
          { scale },
          { rotateX: `${rotateX.value}deg` },
          { rotateY: `${rotateY.value}deg` },
        ],
      };
    }
    
    return {
      transform: [{ scale }],
    };
  });

  const handlePressIn = () => {
    pressed.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    pressed.value = withSpring(0, { damping: 15, stiffness: 150 });
    rotateX.value = withSpring(0);
    rotateY.value = withSpring(0);
  };

  return (
    <AnimatedPressable
      style={[style, animatedStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
    >
      {children}
    </AnimatedPressable>
  );
};

export default AnimatedCard;
