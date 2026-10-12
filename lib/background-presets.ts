export type Background =
  | 'aurora'
  | 'minimal'
  | 'spotlight'
  | 'mesh'
  | 'warm'
  | 'mono'
  | 'dots'
  | 'dotsLarge'
  | 'grid'
  | 'diagonal'
  | 'crosshatch'
  | 'rings'
  | 'waves'
  | 'zigzag'
  | 'carbon'
  | 'plus'
  | 'dashes'
  | 'triangles'

export interface BackgroundPreset {
  id: Background
  labelKey: string

  swatch: string
  swatchSize?: string
}

const C = 'currentColor'

export const BACKGROUND_PRESETS: BackgroundPreset[] = [
  {
    id: 'aurora',
    labelKey: 'settings.bgAurora',
    swatch: 'radial-gradient(120% 90% at 50% -10%, oklch(0.6 0.12 268 / 0.35), transparent 70%)',
  },
  {
    id: 'minimal',
    labelKey: 'settings.bgMinimal',
    swatch: 'linear-gradient(transparent, transparent)',
  },
  {
    id: 'spotlight',
    labelKey: 'settings.bgSpotlight',
    swatch: 'radial-gradient(80% 90% at 50% 0%, oklch(0.62 0.16 268 / 0.55), transparent 70%)',
  },
  {
    id: 'mesh',
    labelKey: 'settings.bgMesh',
    swatch:
      'radial-gradient(circle at 20% 0%, oklch(0.6 0.16 285 / 0.4), transparent 60%), radial-gradient(circle at 90% 100%, oklch(0.6 0.13 205 / 0.3), transparent 60%)',
  },
  {
    id: 'warm',
    labelKey: 'settings.bgWarm',
    swatch:
      'radial-gradient(circle at 30% 0%, oklch(0.72 0.13 45 / 0.45), transparent 60%), radial-gradient(circle at 90% 100%, oklch(0.74 0.11 75 / 0.3), transparent 60%)',
  },
  {
    id: 'mono',
    labelKey: 'settings.bgMono',
    swatch: 'radial-gradient(120% 90% at 50% -10%, oklch(0.6 0 0 / 0.35), transparent 70%)',
  },
  {
    id: 'dots',
    labelKey: 'settings.bgDots',
    swatch: `radial-gradient(${C} 1.4px, transparent 1.6px)`,
    swatchSize: '8px 8px',
  },
  {
    id: 'dotsLarge',
    labelKey: 'settings.bgDotsLarge',
    swatch: `radial-gradient(${C} 1.6px, transparent 2px)`,
    swatchSize: '13px 13px',
  },
  {
    id: 'grid',
    labelKey: 'settings.bgGrid',
    swatch: `linear-gradient(${C} 1px, transparent 1px), linear-gradient(90deg, ${C} 1px, transparent 1px)`,
    swatchSize: '10px 10px',
  },
  {
    id: 'diagonal',
    labelKey: 'settings.bgDiagonal',
    swatch: `repeating-linear-gradient(45deg, ${C} 0 1px, transparent 1px 7px)`,
  },
  {
    id: 'crosshatch',
    labelKey: 'settings.bgCrosshatch',
    swatch: `repeating-linear-gradient(45deg, ${C} 0 1px, transparent 1px 8px), repeating-linear-gradient(-45deg, ${C} 0 1px, transparent 1px 8px)`,
  },
  {
    id: 'rings',
    labelKey: 'settings.bgRings',
    swatch: `repeating-radial-gradient(circle, ${C} 0 1px, transparent 1px 9px)`,
  },
  {
    id: 'waves',
    labelKey: 'settings.bgWaves',
    swatch: `repeating-radial-gradient(circle at 100% 50%, transparent 0 5px, ${C} 5px 6px, transparent 6px 12px)`,
  },
  {
    id: 'zigzag',
    labelKey: 'settings.bgZigzag',
    swatch: `linear-gradient(135deg, ${C} 25%, transparent 25%), linear-gradient(225deg, ${C} 25%, transparent 25%)`,
    swatchSize: '9px 9px',
  },
  {
    id: 'carbon',
    labelKey: 'settings.bgCarbon',
    swatch: `radial-gradient(circle, ${C} 0.7px, transparent 0.8px), radial-gradient(circle, ${C} 0.7px, transparent 0.8px)`,
    swatchSize: '7px 7px',
  },
  {
    id: 'plus',
    labelKey: 'settings.bgPlus',
    swatch: `linear-gradient(${C} 1px, transparent 0) 50% 50% / 100% 5px, linear-gradient(90deg, ${C} 1px, transparent 0) 50% 50% / 5px 100%`,
    swatchSize: '12px 12px',
  },
  {
    id: 'dashes',
    labelKey: 'settings.bgDashes',
    swatch: `linear-gradient(90deg, ${C} 45%, transparent 0)`,
    swatchSize: '10px 10px',
  },
  {
    id: 'triangles',
    labelKey: 'settings.bgTriangles',
    swatch: `linear-gradient(60deg, ${C} 1px, transparent 0), linear-gradient(-60deg, ${C} 1px, transparent 0)`,
    swatchSize: '12px 21px',
  },
]

export const BACKGROUND_IDS = BACKGROUND_PRESETS.map((p) => p.id)

export function isBackground(value: unknown): value is Background {
  return typeof value === 'string' && (BACKGROUND_IDS as string[]).includes(value)
}
