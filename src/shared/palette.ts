/**
 * The fixed flag palette shared by the Host half (validation, persistence) and
 * the Client half (menu, glyphs, dialogs).
 *
 * Color ids are the storage contract: they are persisted in `flags.json` and
 * travel over the wire, so an id may never be renamed. The hex values are only
 * a presentation default — the glyph always paints the stored hex so a future
 * palette change cannot silently recolor historical flags.
 */
export const FLAG_COLOR_IDS = [
  'red',
  'orange',
  'yellow',
  'green',
  'teal',
  'blue',
  'purple',
  'pink',
] as const

/** Stable palette identifier for one flag color. */
export type FlagColorId = (typeof FLAG_COLOR_IDS)[number]

/** One palette entry: stable id plus the swatch used by the UI. */
export interface FlagColorDefinition {
  readonly id: FlagColorId
  readonly hex: string
}

/** Palette order as shown in menus and dialogs. */
export const FLAG_COLORS: readonly FlagColorDefinition[] = [
  { id: 'red', hex: '#E5484D' },
  { id: 'orange', hex: '#F76B15' },
  { id: 'yellow', hex: '#FFC53D' },
  { id: 'green', hex: '#30A46C' },
  { id: 'teal', hex: '#12A594' },
  { id: 'blue', hex: '#0090FF' },
  { id: 'purple', hex: '#8E4EC6' },
  { id: 'pink', hex: '#D6409F' },
]

const FLAG_COLOR_SET: ReadonlySet<string> = new Set(FLAG_COLOR_IDS)

/** Persisted document schema version. */
export const FLAGS_DOCUMENT_VERSION = 1

/** Longest accepted session id (session ids are short opaque strings). */
export const MAX_SESSION_ID_LENGTH = 200

/** Longest accepted user-defined color name, in code points. */
export const MAX_COLOR_NAME_LENGTH = 24

/**
 * The whole plugin state, in the shape persisted on disk and sent over the
 * wire. `flags` maps session id → palette color id; `colorNames` holds only
 * the user's overrides (a missing entry means "use the localized default").
 */
export interface FlagsDocument {
  version: number
  flags: Record<string, FlagColorId>
  colorNames: Partial<Record<FlagColorId, string>>
}

/** A fresh, empty document. */
export function emptyFlagsDocument(): FlagsDocument {
  return { version: FLAGS_DOCUMENT_VERSION, flags: {}, colorNames: {} }
}

/** Narrow an untrusted value to a palette color id. */
export function isFlagColorId(value: unknown): value is FlagColorId {
  return typeof value === 'string' && FLAG_COLOR_SET.has(value)
}

/** Resolve one palette entry; every id in `FLAG_COLOR_IDS` has one. */
export function flagColor(id: FlagColorId): FlagColorDefinition {
  const found = FLAG_COLORS.find((color) => color.id === id)
  if (found === undefined) throw new Error(`dsh-session-flags: unknown color id "${id}"`)
  return found
}

/** The swatch hex for one palette id. */
export function flagColorHex(id: FlagColorId): string {
  return flagColor(id).hex
}

/** Narrow an untrusted value to a plausible session id. */
export function isSessionId(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '' && value.length <= MAX_SESSION_ID_LENGTH
}

/**
 * Normalize a user-provided color name: collapse whitespace, cap the length,
 * and treat blank input as "no override". Code-point slicing keeps emoji from
 * being cut in half.
 */
export function normalizeColorName(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const collapsed = raw.trim().replace(/\s+/g, ' ')
  if (collapsed === '') return null
  return Array.from(collapsed).slice(0, MAX_COLOR_NAME_LENGTH).join('')
}

/**
 * Coerce untrusted JSON (from disk or from the network) into a valid document.
 * Unknown fields and invalid entries are dropped rather than rejected so a
 * partially corrupt file never bricks the feature.
 */
export function sanitizeFlagsDocument(raw: unknown): FlagsDocument {
  const document = emptyFlagsDocument()
  if (typeof raw !== 'object' || raw === null || Array.isArray(raw)) return document
  const record = raw as Record<string, unknown>

  if (record.flags !== undefined) {
    const flags = record.flags
    if (typeof flags === 'object' && flags !== null && !Array.isArray(flags)) {
      for (const [sessionId, colorId] of Object.entries(flags as Record<string, unknown>)) {
        if (!isSessionId(sessionId) || !isFlagColorId(colorId)) continue
        document.flags[sessionId] = colorId
      }
    }
  }

  if (record.colorNames !== undefined) {
    const names = record.colorNames
    if (typeof names === 'object' && names !== null && !Array.isArray(names)) {
      for (const [colorId, name] of Object.entries(names as Record<string, unknown>)) {
        if (!isFlagColorId(colorId)) continue
        const normalized = normalizeColorName(name)
        if (normalized === null) continue
        document.colorNames[colorId] = normalized
      }
    }
  }

  return document
}
