import type { ConnectionFetchRoute } from '@deepseek-ai/dsh-client-connection'
import { isFlagColorId, isSessionId, type FlagsDocument } from '../shared/palette'
import {
  ERROR_CODES,
  ROUTES,
  type ApiEnvelope,
  type ColorNamesRequest,
  type SetFlagRequest,
} from '../shared/protocol'
import type { FlagsStore } from './store'

const JSON_HEADERS: Readonly<Record<string, string>> = {
  'content-type': 'application/json; charset=utf-8',
  'cache-control': 'no-store',
}

function success(value: FlagsDocument): Response {
  const body: ApiEnvelope<FlagsDocument> = { ok: true, value }
  return new Response(JSON.stringify(body), { status: 200, headers: JSON_HEADERS })
}

function failure(status: number, code: string, message: string): Response {
  const body: ApiEnvelope<never> = { ok: false, error: { code, message } }
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS })
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

async function readJsonBody(request: Request): Promise<unknown> {
  const text = await request.text()
  if (text.trim() === '') return null
  return JSON.parse(text)
}

/** Map a storage fault to the stable protocol code; never leak file paths. */
function storageFailure(error: unknown): Response {
  console.warn('dsh-session-flags: failed to persist flag state', error)
  return failure(500, ERROR_CODES.storageFailure, 'Could not persist flag state')
}

function parseSetFlagRequest(body: unknown): SetFlagRequest | Response {
  if (!isRecord(body)) return failure(400, ERROR_CODES.invalidBody, 'Body must be a JSON object')
  const { sessionId, colorId } = body
  if (!isSessionId(sessionId)) {
    return failure(400, ERROR_CODES.invalidSessionId, 'sessionId must be a non-empty string')
  }
  if (colorId !== null && !isFlagColorId(colorId)) {
    return failure(400, ERROR_CODES.invalidColor, 'colorId must be a palette color id or null')
  }
  return { sessionId, colorId }
}

function parseColorNamesRequest(body: unknown): ColorNamesRequest | Response {
  if (!isRecord(body) || !isRecord(body.names)) {
    return failure(400, ERROR_CODES.invalidBody, 'Body must be an object with a "names" object')
  }
  const names: ColorNamesRequest['names'] = {}
  for (const [colorId, value] of Object.entries(body.names)) {
    if (!isFlagColorId(colorId)) {
      return failure(400, ERROR_CODES.invalidNames, `Unknown color id "${colorId}"`)
    }
    if (value !== null && typeof value !== 'string') {
      return failure(400, ERROR_CODES.invalidNames, 'A color name must be a string or null')
    }
    names[colorId] = value
  }
  return { names }
}

/**
 * Build the exact Fetch routes this plugin owns.
 *
 * They ride the shared `/api` channel (the same carrier dsh-context uses), so a
 * same-origin `fetch('/api/dsh-session-flags/...')` from the Client bundle is
 * authenticated by the connection layer before it reaches these handlers.
 */
export function createFlagRoutes(store: FlagsStore): ConnectionFetchRoute[] {
  return [
    {
      path: ROUTES.state,
      methods: ['GET'],
      requestBody: 'buffered',
      fetch: async () => {
        try {
          await store.ensureLoaded()
          return success(store.snapshot())
        } catch (error) {
          return storageFailure(error)
        }
      },
    },
    {
      path: ROUTES.setFlag,
      methods: ['POST'],
      requestBody: 'buffered',
      fetch: async (request) => {
        let body: unknown
        try {
          body = await readJsonBody(request)
        } catch {
          return failure(400, ERROR_CODES.invalidBody, 'Request body is not valid JSON')
        }
        const parsed = parseSetFlagRequest(body)
        if (parsed instanceof Response) return parsed
        try {
          await store.ensureLoaded()
          return success(await store.setFlag(parsed.sessionId, parsed.colorId))
        } catch (error) {
          return storageFailure(error)
        }
      },
    },
    {
      path: ROUTES.colorNames,
      methods: ['POST'],
      requestBody: 'buffered',
      fetch: async (request) => {
        let body: unknown
        try {
          body = await readJsonBody(request)
        } catch {
          return failure(400, ERROR_CODES.invalidBody, 'Request body is not valid JSON')
        }
        const parsed = parseColorNamesRequest(body)
        if (parsed instanceof Response) return parsed
        try {
          await store.ensureLoaded()
          return success(await store.setColorNames(parsed.names))
        } catch (error) {
          return storageFailure(error)
        }
      },
    },
  ]
}
