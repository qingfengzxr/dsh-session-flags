import { Tooltip } from '@deepseek-ai/dsh-client-ui-primitives'
import { useEffect, type ReactNode } from 'react'
import { flagColorHex } from '../../shared/palette'
import type { RowActionProps } from '../types'
import { FlagGlyph } from './flag-glyph'

/**
 * `sidebar.workspaces.session.row.action` occupant: the flag button in a row's
 * hover strip.
 *
 * It always renders (the row's own status dot can displace the leading mark), so
 * it doubles as the "this session has a flag" signal outside the idle state. The
 * click opens the plugin's picker dialog instead of a popover menu: the row
 * unmounts its hover strip on pointer leave, so a dialog is the stable surface
 * for choosing and renaming colors.
 */
export function FlagRowAction({ sessionId, displayTitle, useFlags, ensureLoaded, openPicker, t }: RowActionProps): ReactNode {
  const colorId = useFlags((snapshot) => snapshot.document.flags[String(sessionId)] ?? null)

  // The Host document normally loads with the plugin; retry here so a row that
  // mounts before a slow Host is reachable again without a reload.
  useEffect(() => {
    ensureLoaded()
  }, [ensureLoaded])

  const attributes = colorId === null ? {} : { 'data-session-flag': colorId }
  return (
    <Tooltip label={t('action.label')} side="bottom" align="end" delayMs={500} portal={true}>
      <button
        type="button"
        className="dsf-rowAction"
        data-flag-set={colorId !== null}
        aria-label={t('action.label')}
        onClick={() => {
          openPicker({ sessionId: String(sessionId), displayTitle })
        }}
        {...attributes}
      >
        <FlagGlyph color={colorId === null ? null : flagColorHex(colorId)} />
      </button>
    </Tooltip>
  )
}
