import type { Context } from '@deepseek-ai/cordis'
// Type-only imports: these packages merge their services into the Cordis Context.
import type {} from '@deepseek-ai/dsh-client-locale/client'
import type {} from '@deepseek-ai/dsh-client-ui-renderer/client'
import type {} from '@deepseek-ai/dsh-client-ui-session/client'
import type {} from '@deepseek-ai/dsh-client-ui-workspace/client'
import type { MainPanelId } from '@deepseek-ai/dsh-client-ui-layout/client'
import type { SessionId } from '@deepseek-ai/dsh-session/types'
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
import { FlagPanel } from './components/flag-panel'
import { FlagPanelIcon } from './components/flag-panel-icon'
import { FlagRowAction } from './components/flag-row-action'

/** Cordis plugin name; identical to the package name, patch id, and bundle id. */
export const name = 'dsh-session-flags'

/** Client services this half consumes (locale dictionaries and the slot registry). */
export const inject: string[] = ['locale', 'slots']

/**
 * Sidebar id of the flagged-session panel; it addresses both the `main` keyed
 * entry and the `sidebar.panellist` list row (the shell derives the row from the
 * list registration and the layout resolves the matching main panel by key).
 */
const PANEL_ID = 'dsh-session-flags' as MainPanelId

/** Panel row order: after the shipped Plugins (0) and third-party panels (10/20). */
const PANEL_ORDER = 30

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

  /** Bound translator for data-independent copy (panel label, path errors). */
  const t = ctx.locale.bind(LOCALE_NAMESPACE)

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

  // The sidebar row for the flagged-session panel. The shell owns the button and
  // resolves both its label from this metadata and its selected state from the
  // layout; the occupant only draws the icon.
  ctx.slots.inject('sidebar.panellist', () =>
    ctx.slots.register(
      {
        name: 'sidebar.panellist',
        id: PANEL_ID,
        order: PANEL_ORDER,
        label: () => t('panel.label'),
        locale: LOCALE_NAMESPACE,
      },
      FlagPanelIcon,
    ),
  )

  // The panel itself, mounted into the `main` keyed slot when the sidebar row
  // selects PANEL_ID. Session navigation belongs to ui-workspace (through its
  // `uiWorkspace` service), whose activation order is not guaranteed relative to
  // this plugin: waiting on the service here keeps the row action/marks usable in
  // profiles that do not ship the workspace UI.
  ctx.inject(['uiWorkspace'], (scoped) => {
    const panelInjected = () => ({
      hooks: { flags },
      ensureLoaded,
      openSession: (sessionId: string): void => {
        scoped.uiWorkspace.openSession(sessionId as SessionId)
      },
      clearFlag: (sessionId: string): void => {
        void flags.setFlag(sessionId, null)
      },
      openManager: (): void => {
        openManager(null)
      },
    })
    scoped.slots.inject('main', () =>
      scoped.slots.register(
        {
          name: 'main',
          key: PANEL_ID,
          locale: LOCALE_NAMESPACE,
          inject: panelInjected,
        },
        FlagPanel,
      ),
    )
  })
}
