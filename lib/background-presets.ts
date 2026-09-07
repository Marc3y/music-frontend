export type Background =
  | 'aurora'
  | 'grid'
  | 'dots'
  | 'mesh'
  | 'minimal'
  | 'warm'
  | 'mono'

export interface BackgroundPreset {
  id: Background
  labelKey: string
  /** small preview gradient for the picker swatch */
  swatch: string
}

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  { id: 'aurora', labelKey: 'settings.bgAurora', swatch: 'radial-gradient(circle at 30% 20%, oklch(0.62 0.19 264 / 0.5), transparent 60%), radial-gradient(circle at 80% 90%, oklch(0.72 0.15 52 / 0.35), transparent 60%)' },
  { id: 'grid', labelKey: 'settings.bgGrid', swatch: 'linear-gradient(oklch(0.5 0 0 / 0.25) 1px, transparent 1px), linear-gradient(90deg, oklch(0.5 0 0 / 0.25) 1px, transparent 1px)' },
  { id: 'dots', labelKey: 'settings.bgDots', swatch: 'radial-gradient(oklch(0.6 0.1 264 / 0.4) 1.5px, transparent 1.5px)' },
  { id: 'mesh', labelKey: 'settings.bgMesh', swatch: 'radial-gradient(circle at 20% 30%, oklch(0.6 0.2 280 / 0.5), transparent 55%), radial-gradient(circle at 75% 70%, oklch(0.6 0.16 200 / 0.4), transparent 55%)' },
  { id: 'minimal', labelKey: 'settings.bgMinimal', swatch: 'radial-gradient(circle at 50% 0%, oklch(0.6 0.12 264 / 0.25), transparent 70%)' },
  { id: 'warm', labelKey: 'settings.bgWarm', swatch: 'radial-gradient(circle at 25% 20%, oklch(0.7 0.16 40 / 0.5), transparent 60%), radial-gradient(circle at 80% 85%, oklch(0.72 0.15 70 / 0.4), transparent 60%)' },
  { id: 'mono', labelKey: 'settings.bgMono', swatch: 'radial-gradient(circle at 30% 25%, oklch(0.6 0.01 260 / 0.5), transparent 60%), radial-gradient(circle at 80% 85%, oklch(0.5 0.01 260 / 0.4), transparent 60%)' },
]

export const BACKGROUND_IDS = BACKGROUND_PRESETS.map((p) => p.id)

export function isBackground(value: unknown): value is Background {
  return typeof value === 'string' && (BACKGROUND_IDS as string[]).includes(value)
}
