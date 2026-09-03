/**
 * Loads every translation file in `locales/`. To add a language, drop a new
 * `<code>.json` file in that folder (e.g. `fr.json`) with a `"_meta": { "name": "..." }`
 * entry — it is picked up automatically, no code change needed.
 */

export interface LocaleFile {
  _meta?: { name?: string }
  [key: string]: unknown
}

export const DEFAULT_LOCALE = 'en'

// Turbopack / webpack: bundles every JSON in the locales folder at build time.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const ctx = (require as any).context('../../locales', false, /\.json$/)

export const messagesByLocale: Record<string, LocaleFile> = {}

for (const key of ctx.keys() as string[]) {
  const code = key.replace(/^\.\//, '').replace(/\.json$/, '')
  messagesByLocale[code] = ctx(key) as LocaleFile
}

export interface LocaleInfo {
  code: string
  name: string
}

export const localeList: LocaleInfo[] = Object.entries(messagesByLocale)
  .map(([code, file]) => ({ code, name: file._meta?.name ?? code }))
  .sort((a, b) => a.name.localeCompare(b.name))

export function isKnownLocale(code: string | undefined | null): code is string {
  return !!code && code in messagesByLocale
}
