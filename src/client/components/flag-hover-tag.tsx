import type { ReactNode } from 'react'
import { flagColorHex } from '../../shared/palette'
import { flagColorName } from '../labels'
import type { RowHoverProps } from '../types'
import { ColorDot } from './flag-glyph'

/**
 * `sidebar.session.row.hover` occupant: the flag's dot and display name inside
 * the session hover card, so hovering a row tells you what its flag means and
 * not just which color it is.
 */
export function FlagHoverTag({ sessionId, useFlags, t }: RowHoverProps): ReactNode {
  const colorId = useFlags((snapshot) => snapshot.document.flags[String(sessionId)] ?? null)
  const document = useFlags((snapshot) => snapshot.document)
  if (colorId === null) return null
  return (
    <span className="dsf-hover" data-session-flag={colorId}>
      <ColorDot color={flagColorHex(colorId)} />
      <span className="dsf-hoverName">{flagColorName(colorId, document, t)}</span>
    </span>
  )
}
