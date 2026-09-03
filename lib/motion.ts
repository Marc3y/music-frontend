import type { Transition, Variants } from 'motion/react'

/** Weiche Ease-Kurven (Apple-Gefühl). */
export const ease = {
  out: [0.16, 1, 0.3, 1] as const,
  inOut: [0.65, 0, 0.35, 1] as const,
  apple: [0.32, 0.72, 0, 1] as const,
}

/** Spring-Presets. */
export const spring = {
  snappy: { type: 'spring', stiffness: 400, damping: 32, mass: 0.9 } satisfies Transition,
  soft: { type: 'spring', stiffness: 260, damping: 30 } satisfies Transition,
  gentle: { type: 'spring', stiffness: 170, damping: 24 } satisfies Transition,
}

export const duration = { fast: 0.18, base: 0.3, slow: 0.5 }

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: duration.base, ease: ease.out } },
}

export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay: i * 0.06, ease: ease.out },
  }),
}

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.97, y: 12 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { duration: 0.4, ease: ease.out } },
}

export const staggerContainer = (gap = 0.06): Variants => ({
  hidden: {},
  visible: { transition: { staggerChildren: gap, delayChildren: 0.04 } },
})

/** Hover/Tap-Presets für Karten & interaktive Flächen. */
export const liftHover = {
  whileHover: { y: -3, transition: spring.soft },
  whileTap: { scale: 0.985, transition: { duration: 0.1 } },
}

export const pressable = {
  whileTap: { scale: 0.94, transition: { duration: 0.12, ease: ease.apple } },
}
