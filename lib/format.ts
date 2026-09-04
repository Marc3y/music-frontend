export function formatTime(seconds: number | undefined | null): string {
  if (seconds == null || !isFinite(seconds) || seconds < 0) return '0:00'
  const total = Math.floor(seconds)
  const m = Math.floor(total / 60)
  const s = total % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function formatBytes(bytes: number): string {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1)
  const value = bytes / Math.pow(1024, i)
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`
}

/**
 * Compact English key notation: "F#m" (minor) / "F# maj" (major).
 * Normalises legacy German values ("F# moll" / "F# dur") for display.
 */
export function formatMusicalKey(raw?: string | null): string {
  if (!raw) return ''
  const s = String(raw).trim()
  const m = s.match(/^([A-Ga-g][#b♯♭]?)\s*(moll|minor|min|m|dur|major|maj)?$/i)
  if (!m) return s
  const note =
    m[1][0].toUpperCase() +
    m[1].slice(1).replace('♯', '#').replace('♭', 'b').toLowerCase()
  const mode = (m[2] ?? '').toLowerCase()
  const isMinor = mode === 'moll' || mode === 'minor' || mode === 'min' || mode === 'm'
  return isMinor ? `${note}m` : `${note} maj`
}

export function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('de-DE', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}
