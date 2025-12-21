import { useEffect, useRef, useState } from "react";
import { Animated } from "react-native";

type UsePromptAnimationParams = {
  visible: boolean;
  inDurationMs?: number;
  outDurationMs?: number;
  fromScale?: number;
};

/**
 * Keeps the component mounted during fade-out so the animation can complete.
 * Returns Animated.Values for opacity/scale and a `mounted` flag for render gating.
 */
const usePromptAnimation = ({
  visible,
  inDurationMs = 160,
  outDurationMs = 140,
  fromScale = 0.98,
}: UsePromptAnimationParams) => {
  const [mounted, setMounted] = useState<boolean>(visible);

  const opacity = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const scale = useRef(new Animated.Value(visible ? 1 : fromScale)).current;

  useEffect(() => {
    let cancelled = false;

    if (visible) {
      setMounted(true);
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 1,
          duration: inDurationMs,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: inDurationMs,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacity, {
          toValue: 0,
          duration: outDurationMs,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: fromScale,
          duration: outDurationMs,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (cancelled) return;
        if (finished) setMounted(false);
      });
    }

    return () => {
      cancelled = true;
    };
  }, [visible, inDurationMs, outDurationMs, fromScale, opacity, scale]);

  return { mounted, opacity, scale } as const;
};

export default usePromptAnimation;


