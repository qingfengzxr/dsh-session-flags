// Type-only imports: these client packages declare the SlotMap entries and the
// standard props (sessionId, displayTitle, menu state) this plugin registers
// against; without them the slot keys below are unknown to the compiler.
import type {} from '@deepseek-ai/dsh-client-ui-layout/client'
import type {} from '@deepseek-ai/dsh-client-ui-session/client'
import type {} from '@deepseek-ai/dsh-client-ui-sidebar/client'
import type {} from '@deepseek-ai/dsh-client-ui-workspace/client'
import type { InjectFace, PropsLocale, PropsRuntime, TranslateNS } from '@deepseek-ai/dsh-client-ui-slots'
import type { FlagColorId } from '../shared/palette'
import type { DialogStore, DialogTarget } from './dialog-store'
import { LOCALE_NAMESPACE } from './locales'
import type { FlagsStore } from './store'

/** This plugin's locale namespace (declared in `locales.ts`). */
export type Namespace = typeof LOCALE_NAMESPACE

/** Translate function bound to this plugin's namespace. */
export type FlagTranslate = TranslateNS<Namespace>

/** Business face shared by the read-only seats (mark, hover chip). */
export interface FlagsHookInjected {
  hooks: { flags: FlagsStore }
}

/** Business face of the session-row trailing action and its menu. */
export interface RowActionInjected extends FlagsHookInjected {
  ensureLoaded(): void
  setFlag(sessionId: string, colorId: FlagColorId | null): void
  openPicker(target: DialogTarget): void
  openManager(): void
}

/** Business face of the session-row "..." menu row. */
export interface RowMenuItemInjected extends FlagsHookInjected {
  openPicker(target: DialogTarget): void
}

/** Business face of the `shell.overlay` dialog entry. */
export interface OverlayInjected {
  hooks: { flags: FlagsStore; dialog: DialogStore }
  closeDialog(): void
  backDialog(): void
  openManager(returnTo: DialogTarget | null): void
  setFlag(sessionId: string, colorId: FlagColorId | null): Promise<boolean>
  saveColorNames(names: Partial<Record<FlagColorId, string | null>>): Promise<boolean>
}

/**
 * Business face of the framed "Flagged sessions" panel entry.
 *
 * Navigation is delegated to the Workspace UI service (`openSession`), whose
 * ownership of Session selection belongs to ui-workspace; the panel only names
 * the target. Clearing a flag is the same Host mutation the row action uses.
 */
export interface FlagPanelInjected extends FlagsHookInjected {
  ensureLoaded(): void
  openSession(sessionId: string): void
  clearFlag(sessionId: string): void
  openManager(): void
}

/**
 * Composed props of each registered entry: owner share + standard kit from the
 * framework, the locale `t` seat, and this plugin's business face (whose
 * `hooks` become selector hooks such as `useFlags`).
 */
export type RowActionProps = PropsRuntime<'sidebar.workspaces.session.row.action'> &
  PropsLocale<Namespace> &
  InjectFace<RowActionInjected>

/** Composed props of the "..." menu row entry. */
export type RowMenuItemProps = PropsRuntime<'sidebar.workspaces.session.menu.item'> &
  PropsLocale<Namespace> &
  InjectFace<RowMenuItemInjected>

/** Composed props of the leading-seat mark entry. */
export type RowMarkProps = PropsRuntime<'sidebar.session.row.leading'> &
  PropsLocale<Namespace> &
  InjectFace<FlagsHookInjected>

/** Composed props of the hover-card tag entry. */
export type RowHoverProps = PropsRuntime<'sidebar.session.row.hover'> &
  PropsLocale<Namespace> &
  InjectFace<FlagsHookInjected>

/** Composed props of the `shell.overlay` dialog entry. */
export type OverlayProps = PropsRuntime<'shell.overlay'> & PropsLocale<Namespace> & InjectFace<OverlayInjected>

/**
 * Composed props of the central flagged-session panel.
 *
 * The entry is a keyed `main` registration, so besides this plugin's business
 * face it receives the framework's global standard kit — in particular the
 * `useSessions` / `useWorkspaces` selector hooks over the Controller snapshots.
 */
export type FlagPanelProps = PropsRuntime<'main'> & PropsLocale<Namespace> & InjectFace<FlagPanelInjected>

/** Composed props of the sidebar global-panel icon (owner carries size/active). */
export type FlagPanelIconProps = PropsRuntime<'sidebar.panellist'>

/** Stringify a branded session id for storage lookups and wire calls. */
export function sessionKey(sessionId: RowActionProps['sessionId']): string {
  return String(sessionId)
}
