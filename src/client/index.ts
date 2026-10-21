import type { Context } from '@deepseek-ai/cordis'
// Type-only imports: these packages merge their services into the Cordis Context.
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type { FlagColorId } from '../shared/palette'
import type { DialogTarget } from './dialog-store'
import { DialogStore } from './dialog-store'
import { LOCALE_NAMESPACE, en, zh } from './locales'
import { FlagsStore } from './store'
import { applyFlagStyles } from './styles'
import { FlagDialog } from './components/flag-dialog'
import { FlagHoverTag } from './components/flag-hover-tag'
import { FlagMark } from './components/flag-mark'
import { FlagMenuItem } from './components/flag-menu-item'
import { FlagRowAction } from './components/flag-row-action'

/** Cordis plugin name; identical to the package name, patch id, and bundle id. */
export const name = 'dsh-session-flags'

/** Client services this half consumes (locale dictionaries and the slot registry). */
export const inject: string[] = ['locale', 'slots']

/**
 * Client half: register locale copy, styles, and the four slot contributions
 * plus the `shell.overlay` dialog.
 *
 * All state lives in two small external stores (`FlagsStore`, `DialogStore`)
 * whose observable source shape is handed to the framework through `inject`, so
 * each seat gets the same selector hooks and none of the seats needs to talk to
 * another. Contributions are registered through `ctx.slots.inject` so they
 * appear once the owning slots declare themselves, and Cordis owns their
 * disposal with this plugin's context.
 *
 * @param ctx - Client plugin context.
 */
export function apply(ctx: Context): void {
  const flags = new FlagsStore()
  const dialog = new DialogStore()

  ctx.effect(() => ctx.locale.register(LOCALE_NAMESPACE, { zh, en }), 'dsh-session-flags: dictionaries')
  ctx.effect(() => applyFlagStyles(), 'dsh-session-flags: styles')

  /** Load the Host document once; row seats retry it if the first attempt raced boot. */
  const ensureLoaded = (): void => {
    void flags.ensureLoaded()
  }
  ensureLoaded()

  const openPicker = (target: DialogTarget): void => {
    dialog.openPicker(target)
  }
  const openManager = (returnTo: DialogTarget | null = null): void => {
    ensureLoaded()
    dialog.openManager(returnTo)
  }

  const markInjected = () => ({ hooks: { flags } })
  const rowActionInjected = () => ({
    hooks: { flags },
    ensureLoaded,
    setFlag: (sessionId: string, colorId: FlagColorId | null): void => {
      void flags.setFlag(sessionId, colorId)
    },
    openPicker,
    openManager: (): void => {
      openManager(null)
    },
  })
  const menuItemInjected = () => ({ hooks: { flags }, openPicker })
  const overlayInjected = () => ({
    hooks: { flags, dialog },
    closeDialog: (): void => {
      dialog.close()
    },
    backDialog: (): void => {
      dialog.back()
    },
    openManager,
    setFlag: (sessionId: string, colorId: FlagColorId | null): Promise<boolean> => flags.setFlag(sessionId, colorId),
    saveColorNames: (names: Partial<Record<FlagColorId, string | null>>): Promise<boolean> => {
      ensureLoaded()
      return flags.saveColorNames(names)
    },
  })

  ctx.slots.inject('sidebar.session.row.leading', () =>
    ctx.slots.register(
      {
        name: 'sidebar.session.row.leading',
        id: 'dsh-session-flags:mark',
        order: 50,
        locale: LOCALE_NAMESPACE,
        inject: markInjected,
      },
      FlagMark,
    ),
  )

  ctx.slots.inject('sidebar.session.row.hover', () =>
    ctx.slots.register(
      {
        name: 'sidebar.session.row.hover',
        id: 'dsh-session-flags:tag',
        order: 50,
        locale: LOCALE_NAMESPACE,
        inject: markInjected,
      },
      FlagHoverTag,
    ),
  )

  ctx.slots.inject('sidebar.workspaces.session.row.action', () =>
    ctx.slots.register(
      {
        name: 'sidebar.workspaces.session.row.action',
        id: 'dsh-session-flags:flag',
        order: 250,
        locale: LOCALE_NAMESPACE,
        inject: rowActionInjected,
      },
      FlagRowAction,
    ),
  )

  ctx.slots.inject('sidebar.workspaces.session.menu.item', () =>
    ctx.slots.register(
      {
        name: 'sidebar.workspaces.session.menu.item',
        id: 'dsh-session-flags:flag',
        order: 350,
        locale: LOCALE_NAMESPACE,
        inject: menuItemInjected,
      },
      FlagMenuItem,
    ),
  )

  ctx.slots.inject('shell.overlay', () =>
    ctx.slots.register(
      {
        name: 'shell.overlay',
        id: 'dsh-session-flags:dialog',
        locale: LOCALE_NAMESPACE,
        inject: overlayInjected,
      },
      FlagDialog,
    ),
  )
}
