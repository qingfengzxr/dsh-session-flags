import type { ApiEnvelope } from '../shared/protocol'

/** Error carrying a stable code the UI maps onto localized copy. */
export class RequestError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'RequestError'
  }
}

/** Collapse any thrown value onto a stable code for the UI. */
export function requestErrorCode(error: unknown): string {
  return error instanceof RequestError ? error.code : 'network'
}

/**
 * Call one of this plugin's Host routes with a same-origin `fetch`.
 *
 * The GUI is served by the DSH connection carrier, so a plain relative fetch
 * carries the browser authentication the exact Fetch routes require. The
 * envelope matches the Connection RPC convention: `{ ok: true, value }` or
 * `{ ok: false, error: { code, message } }`.
 */
export async function requestJson<T>(path: string, body?: unknown): Promise<T> {
  const init: RequestInit = {
    method: body === undefined ? 'GET' : 'POST',
    cache: 'no-store',
    credentials: 'same-origin',
  }
  if (body !== undefined) {
    init.headers = { 'content-type': 'application/json' }
    init.body = JSON.stringify(body)
  }

  let response: Response
  try {
    response = await fetch(path, init)
  } catch {
    throw new RequestError('network', `The DSH host could not be reached (${path})`)
  }

  let envelope: ApiEnvelope<T> | null = null
  try {
    envelope = (await response.json()) as ApiEnvelope<T>
  } catch {
    throw new RequestError('response', `The DSH host returned an unreadable response (${response.status})`)
  }

  if (envelope !== null && envelope.ok === true) return envelope.value
  if (envelope !== null && envelope.ok === false) {
    throw new RequestError(envelope.error.code, envelope.error.message)
  }
  throw new RequestError(`http-${response.status}`, `Request failed with status ${response.status}`)
}
