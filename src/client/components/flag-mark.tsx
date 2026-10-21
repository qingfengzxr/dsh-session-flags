import type { ReactNode } from 'react'
import { flagColorHex } from '../../shared/palette'
import { FlagGlyph } from './flag-glyph'
import type { RowMarkProps } from '../types'

/**
 * `sidebar.session.row.leading` occupant: the colored flag shown right before a
 * session title.
 *
 * The row only mounts this seat while the row is idle — a pending interaction,
 * new message, or live activity replaces it with the status dot — so the mark is
 * a passive glance cue. The trailing row action and the hover chip keep the flag
 * reachable (and nameable) in every row state.
 */
export function FlagMark({ sessionId, useFlags }: RowMarkProps): ReactNode {
  const colorId = useFlags((snapshot) => snapshot.document.flags[String(sessionId)] ?? null)
  if (colorId === null) return null
  return (
    <span className="dsf-mark" data-session-flag={colorId} aria-hidden="true">
      <FlagGlyph color={flagColorHex(colorId)} />
    </span>
  )
}
