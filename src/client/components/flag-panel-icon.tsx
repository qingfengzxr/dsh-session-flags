import type { ReactNode } from 'react'
import type { FlagPanelIconProps } from '../types'
import { FlagGlyph } from './flag-glyph'

/**
 * `sidebar.panellist` occupant: the global-panel row that opens the flagged
 * session list.
 *
 * The shell owns the button, its active state, and its label (resolved from the
 * list registration metadata); the occupant only draws the icon at the size the
 * rail asks for. The glyph stays monochrome (`color: null`) so it follows
 * `currentColor` like every other navigation icon.
 */
export function FlagPanelIcon({ size }: FlagPanelIconProps): ReactNode {
  return <FlagGlyph color={null} size={size} />
}
