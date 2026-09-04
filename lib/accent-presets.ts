export type Accent =
  | 'indigo'
  | 'blue'
  | 'teal'
  | 'green'
  | 'gold'
  | 'rose'
  | 'violet'
  | 'slate'

export interface AccentPreset {
  id: Accent
  labelKey: string
  /** Representative swatch color shown in the picker (light-mode value). */
  swatch: string
}

export const ACCENT_PRESETS: AccentPreset[] = [
  { id: 'indigo', labelKey: 'settings.accentIndigo', swatch: 'oklch(0.52 0.2 264)' },
  { id: 'blue', labelKey: 'settings.accentBlue', swatch: 'oklch(0.5 0.18 246)' },
  { id: 'teal', labelKey: 'settings.accentTeal', swatch: 'oklch(0.52 0.13 195)' },
  { id: 'green', labelKey: 'settings.accentGreen', swatch: 'oklch(0.54 0.15 148)' },
  { id: 'gold', labelKey: 'settings.accentGold', swatch: 'oklch(0.68 0.15 82)' },
  { id: 'rose', labelKey: 'settings.accentRose', swatch: 'oklch(0.55 0.21 350)' },
  { id: 'violet', labelKey: 'settings.accentViolet', swatch: 'oklch(0.52 0.22 300)' },
  { id: 'slate', labelKey: 'settings.accentSlate', swatch: 'oklch(0.42 0.02 260)' },
]

export const ACCENT_IDS = ACCENT_PRESETS.map((p) => p.id)

export function isAccent(value: unknown): value is Accent {
  return typeof value === 'string' && (ACCENT_IDS as string[]).includes(value)
}
