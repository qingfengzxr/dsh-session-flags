import type { CSSProperties, ReactNode } from 'react'

/** Size shared by the flag glyph wherever it sits in a 16px control. */
export const FLAG_GLYPH_SIZE = 14

export interface FlagGlyphProps {
  /** Flag color hex, or `null` for the "no flag" outline placeholder. */
  color: string | null
  /** Square edge in px. */
  size?: number
}

/**
 * The flag mark itself.
 *
 * The official icon set has no flag glyph, so the plugin ships this small SVG.
 * It paints the persisted hex directly (not a theme token): a flag's color is
 * user data, so it must not shift when the GUI theme does. The pole stays
 * `currentColor` so the outline placeholder still follows the row's label color.
 */
export function FlagGlyph({ color, size = FLAG_GLYPH_SIZE }: FlagGlyphProps): ReactNode {
  const style: CSSProperties = { width: size, height: size, flex: 'none', display: 'block' }
  const filled = color !== null
  return (
    <svg viewBox="0 0 16 16" width={size} height={size} style={style} aria-hidden="true" focusable="false">
      <path d="M3.4 2v12" stroke="currentColor" strokeWidth={1.3} strokeLinecap="round" fill="none" />
      <path
        d="M4.2 2.7c1.5-.9 3 .7 4.5.1 1.1-.4 2.1-.2 3 .3v4.4c-.9-.5-1.9-.7-3-.3-1.5.6-3-1-4.5-.1Z"
        fill={filled ? color : 'none'}
        stroke={filled ? undefined : 'currentColor'}
        strokeWidth={filled ? undefined : 1.2}
        strokeLinejoin="round"
      />
    </svg>
  )
}

export interface ColorDotProps {
  /** Swatch color (palette hex). */
  color: string
  /** Dot diameter in px. */
  size?: number
  /** Additional class names. */
  className?: string
}

/**
 * A compact color swatch for menus, lists, and the hover chip.
 *
 * The color is dynamic user data, so it is passed inline; every other visual
 * value comes from the stylesheet.
 */
export function ColorDot({ color, size = 10, className }: ColorDotProps): ReactNode {
  return (
    <span
      className={className === undefined ? 'dsf-dot' : `dsf-dot ${className}`}
      style={{ background: color, width: size, height: size }}
      aria-hidden="true"
    />
  )
}
