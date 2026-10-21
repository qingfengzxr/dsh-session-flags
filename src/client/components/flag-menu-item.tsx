import { MenuItemButton } from '@deepseek-ai/dsh-client-ui-primitives'
import type { ReactNode } from 'react'
import { flagColorHex } from '../../shared/palette'
import type { RowMenuItemProps } from '../types'
import { FlagGlyph } from './flag-glyph'

/**
 * `sidebar.workspaces.session.menu.item` occupant: the flag row in a session's
 * "..." menu, between the official fork (300) and archive (400) entries.
 *
 * It dismisses the menu before opening the dialog — a menu row unmounts with the
 * menu, so the dialog cannot live inside it. The icon previews the current flag
 * color so the row reports state as well as offering the action.
 */
export function FlagMenuItem({ sessionId, displayTitle, useMenuOpenState, useFlags, openPicker, t }: RowMenuItemProps): ReactNode {
  const [, setMenuOpen] = useMenuOpenState()
  const colorId = useFlags((snapshot) => snapshot.document.flags[String(sessionId)] ?? null)
  return (
    <MenuItemButton
      icon={<FlagGlyph color={colorId === null ? null : flagColorHex(colorId)} />}
      onSelect={() => {
        setMenuOpen(false)
        openPicker({ sessionId: String(sessionId), displayTitle })
      }}
    >
      {t('menu.label')}
    </MenuItemButton>
  )
}
