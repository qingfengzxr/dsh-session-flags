import {
  emptyFlagsDocument,
  sanitizeFlagsDocument,
  type FlagColorId,
  type FlagsDocument,
} from '../shared/palette'
import { ROUTES } from '../shared/protocol'
import { requestErrorCode, requestJson } from './transport'

/** Immutable view shared with slot components through a hooks source. */
export interface FlagsSnapshot {
  /** True once the Host document has been fetched at least once. */
  ready: boolean
  /** Latest known document (empty until the first successful load). */
  document: FlagsDocument
  /** Stable failure code of the last load attempt, or `null`. */
  loadError: string | null
  /** Stable failure code of the last mutation, or `null`. */
  mutationError: string | null
}

const INITIAL_SNAPSHOT: FlagsSnapshot = {
  ready: false,
  document: emptyFlagsDocument(),
  loadError: null,
  mutationError: null,
}

/**
 * Client-side mirror of the Host document.
 *
 * Implements the framework's observable-source shape (`getSnapshot`/`subscribe`),
 * so a slot registration can expose it as `hooks: { flags: store }` and get a
 * `useFlags(selector)` hook. Snapshots are replaced, never mutated, which keeps
 * `useSyncExternalStore` reads stable; selectors should return primitives or
 * references already stable inside the snapshot.
 */
export class FlagsStore {
  #snapshot: FlagsSnapshot = INITIAL_SNAPSHOT
  #listeners = new Set<() => void>()
  #loading: Promise<void> | null = null

  /** Stable source accessor for the renderer's hook binding. */
  readonly getSnapshot = (): FlagsSnapshot => this.#snapshot

  /** Subscribe to document/load changes; returns the unsubscribe function. */
  readonly subscribe = (listener: () => void): (() => void) => {
    this.#listeners.add(listener)
    return () => {
      this.#listeners.delete(listener)
    }
  }

  /** Fetch the document unless it is already loaded; failures are retryable. */
  ensureLoaded(): Promise<void> {
    if (this.#snapshot.ready) return Promise.resolve()
    this.#loading ??= this.#load()
    return this.#loading
  }

  /** The flag color assigned to a session, if any. */
  colorOf(sessionId: string): FlagColorId | null {
    return this.#snapshot.document.flags[sessionId] ?? null
  }

  /** Assign (or clear) one session's flag; resolves to whether the Host accepted it. */
  async setFlag(sessionId: string, colorId: FlagColorId | null): Promise<boolean> {
    try {
      const document = sanitizeFlagsDocument(await requestJson<unknown>(ROUTES.setFlag, { sessionId, colorId }))
      this.#commit(document)
      return true
    } catch (error) {
      this.#set({ mutationError: requestErrorCode(error) })
      return false
    }
  }

  /** Replace color name overrides; resolves to whether the Host accepted them. */
  async saveColorNames(names: Partial<Record<FlagColorId, string | null>>): Promise<boolean> {
    try {
      const document = sanitizeFlagsDocument(await requestJson<unknown>(ROUTES.colorNames, { names }))
      this.#commit(document)
      return true
    } catch (error) {
      this.#set({ mutationError: requestErrorCode(error) })
      return false
    }
  }

  async #load(): Promise<void> {
    try {
      const document = sanitizeFlagsDocument(await requestJson<unknown>(ROUTES.state))
      this.#commit(document)
    } catch (error) {
      this.#set({ loadError: requestErrorCode(error) })
    } finally {
      this.#loading = null
    }
  }

  #commit(document: FlagsDocument): void {
    this.#set({ ready: true, document, loadError: null, mutationError: null })
  }

  #set(patch: Partial<FlagsSnapshot>): void {
    this.#snapshot = { ...this.#snapshot, ...patch }
    for (const listener of [...this.#listeners]) listener()
  }
}
