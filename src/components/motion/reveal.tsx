/**
 * One lightweight entrance for a list row or dashboard section.
 *
 * Rows in the same parent can pass an `index`; the delay stairs the entrances
 * (capped at 4 so long feeds never feel like a queue). Reduced-motion settings
 * turn the entrance off entirely — content appears, it just does not move.
 */

import type { ReactNode } from "react";
import Animated, { FadeInDown, useReducedMotion } from "react-native-reanimated";

type RevealProps = {
  children: ReactNode;
  /** Position in the parent list; drives the stagger delay, capped at 4. */
  index?: number;
};

export function Reveal({ children, index = 0 }: RevealProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <>{children}</>;
  }

  return (
    <Animated.View
      entering={FadeInDown.duration(240).delay(Math.min(index, 4) * 60)}
      style={{ opacity: 1 }}
    >
      {children}
    </Animated.View>
  );
}