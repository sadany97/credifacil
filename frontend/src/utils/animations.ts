// Simple animation helpers using React Native's built-in Animated
import { Animated, Easing } from 'react-native';

export const withSpring = (toValue: number) => {
  return Animated.spring(new Animated.Value(0), {
    toValue,
    useNativeDriver: true,
  });
};

export const withTiming = (toValue: number, duration: number = 300) => {
  return Animated.timing(new Animated.Value(0), {
    toValue,
    duration,
    useNativeDriver: true,
    easing: Easing.ease,
  });
};

// Re-export Animated from react-native
export { Animated };
export default Animated;
