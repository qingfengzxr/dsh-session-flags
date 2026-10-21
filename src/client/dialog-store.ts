/** Where the flag dialog was asked to pick a color for. */
export interface DialogTarget {
  sessionId: string
  displayTitle: string
}

/**
 * Dialog state: closed, picking a color for one session, or managing the color
 * names. The manager remembers the pending pick so closing it returns the user
 * to where they were instead of dropping the action.
 */
export type DialogView =
  | { kind: 'closed' }
  | { kind: 'pick'; target: DialogTarget }
  | { kind: 'manage'; returnTo: DialogTarget | null }

const CLOSED: DialogView = { kind: 'closed' }

/**
 * One observable dialog state for the `shell.overlay` entry.
 *
 * Openers live outside the overlay component (row buttons, hover menu rows), so
 * the state is a tiny external store instead of React state; the overlay
 * subscribes through the standard hooks-source binding.
 */
export class DialogStore {
  #view: DialogView = CLOSED
  #listeners = new Set<() => void>()

  /** Stable source accessor for the renderer's hook binding. */
  readonly getSnapshot = (): DialogView => this.#view

  /** Subscribe to view changes; returns the unsubscribe function. */
  readonly subscribe = (listener: () => void): (() => void) => {
    this.#listeners.add(listener)
    return () => {
      this.#listeners.delete(listener)
    }
  }

  /** Open the color picker for one session row. */
  openPicker(target: DialogTarget): void {
    this.#set({ kind: 'pick', target })
  }

  /** Open the color-name manager, optionally remembering a pending pick. */
  openManager(returnTo: DialogTarget | null = null): void {
    this.#set({ kind: 'manage', returnTo })
  }

  /** Go back one step: manager → picker when a pick is pending, else close. */
  back(): void {
    if (this.#view.kind === 'manage' && this.#view.returnTo !== null) {
      this.#set({ kind: 'pick', target: this.#view.returnTo })
      return
    }
    this.close()
  }

  /** Close every dialog. */
  close(): void {
    this.#set(CLOSED)
  }

  #set(view: DialogView): void {
    this.#view = view
    for (const listener of [...this.#listeners]) listener()
  }
}
