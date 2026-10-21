/**
 * Wire protocol between the Client half and the Host half.
 *
 * The Host registers these as exact Fetch routes on the DSH shared API channel
 * (`ctx.connection.fetch.register`), so they live below `/api` and are only
 * reachable by the owner browser peer. Request and response bodies are JSON; a
 * response is always an {@link ApiEnvelope}, mirroring the Connection RPC
 * convention used by official remotes.
 */
import type { FlagColorId } from './palette'

/** Shared mount point of every route this plugin registers below `/api`. */
export const API_PREFIX = '/api/dsh-session-flags'

/** Fully qualified route paths, also used verbatim by the Client `fetch`. */
export const ROUTES = {
  /** `GET` — current document. */
  state: `${API_PREFIX}/state`,
  /** `POST` — set or clear one session's flag. */
  setFlag: `${API_PREFIX}/set-flag`,
  /** `POST` — create/replace/remove color name overrides. */
  colorNames: `${API_PREFIX}/color-names`,
} as const

/** `POST` body of {@link ROUTES.setFlag}. */
export interface SetFlagRequest {
  /** Target session id (opaque Host identity). */
  sessionId: string
  /** Palette id to assign, or `null` to remove the flag. */
  colorId: FlagColorId | null
}

/** `POST` body of {@link ROUTES.colorNames}. */
export interface ColorNamesRequest {
  /**
   * Color id → new name. `null` (or a blank string) removes the override and
   * falls back to the localized default name.
   */
  names: Partial<Record<FlagColorId, string | null>>
}

/** Successful envelope. */
export interface ApiSuccess<T> {
  ok: true
  value: T
}

/** Failure envelope with a stable machine code plus a human-readable message. */
export interface ApiFailure {
  ok: false
  error: {
    code: string
    message: string
  }
}

/** Every route answers with this envelope. */
export type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure

/** Stable failure codes (the Client maps them to localized messages). */
export const ERROR_CODES = {
  invalidBody: 'invalid-body',
  invalidSessionId: 'invalid-session-id',
  invalidColor: 'invalid-color',
  invalidNames: 'invalid-names',
  storageFailure: 'storage-failure',
} as const

/** One of the stable {@link ERROR_CODES} values. */
export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]
