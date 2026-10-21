import { describe, expect, it } from 'vitest'
import {
  FLAG_COLORS,
  FLAG_COLOR_IDS,
  emptyFlagsDocument,
  flagColor,
  flagColorHex,
  isFlagColorId,
  isSessionId,
  normalizeColorName,
  sanitizeFlagsDocument,
} from '../src/shared/palette'

describe('palette', () => {
  it('exposes one stable id per color, in presentation order', () => {
    expect(FLAG_COLORS.map((color) => color.id)).toEqual([...FLAG_COLOR_IDS])
    expect(new Set(FLAG_COLOR_IDS).size).toBe(FLAG_COLOR_IDS.length)
  })

  it('resolves every palette entry and hex', () => {
    for (const id of FLAG_COLOR_IDS) {
      expect(flagColor(id).id).toBe(id)
      expect(flagColorHex(id)).toMatch(/^#[0-9A-F]{6}$/i)
    }
  })

  it('narrows untrusted color ids and session ids', () => {
    expect(isFlagColorId('red')).toBe(true)
    expect(isFlagColorId('crimson')).toBe(false)
    expect(isFlagColorId(undefined)).toBe(false)
    expect(isSessionId('sess-1')).toBe(true)
    expect(isSessionId('')).toBe(false)
    expect(isSessionId('   ')).toBe(false)
    expect(isSessionId('x'.repeat(201))).toBe(false)
  })

  it('normalizes user names: collapses whitespace, trims, caps code points', () => {
    expect(normalizeColorName('  重点   项目  ')).toBe('重点 项目')
    expect(normalizeColorName('   ')).toBeNull()
    expect(normalizeColorName(42)).toBeNull()
    const long = '🚩'.repeat(40)
    expect(Array.from(normalizeColorName(long) ?? '')).toHaveLength(24)
  })

  it('returns a fresh document from emptyFlagsDocument', () => {
    const first = emptyFlagsDocument()
    const second = emptyFlagsDocument()
    first.flags['s1'] = 'red'
    expect(second.flags).toEqual({})
  })

  it('sanitizes untrusted documents instead of throwing', () => {
    expect(sanitizeFlagsDocument(null)).toEqual(emptyFlagsDocument())
    expect(sanitizeFlagsDocument([1, 2, 3])).toEqual(emptyFlagsDocument())
    expect(sanitizeFlagsDocument('nope')).toEqual(emptyFlagsDocument())
    expect(
      sanitizeFlagsDocument({
        version: 999,
        flags: { s1: 'red', s2: 'chartreuse', '': 'blue', s3: 7 },
        colorNames: { red: ' 重点 ', orange: '   ', purple: '紫色', unknown: 'x' },
      }),
    ).toEqual({
      version: 1,
      flags: { s1: 'red' },
      colorNames: { red: '重点', purple: '紫色' },
    })
  })

  it('drops undefined and array containers', () => {
    expect(sanitizeFlagsDocument({ flags: undefined, colorNames: undefined })).toEqual(emptyFlagsDocument())
    expect(sanitizeFlagsDocument({ flags: [], colorNames: [] })).toEqual(emptyFlagsDocument())
  })
})
