import { afterEach, describe, expect, it, vi } from 'vitest'
import { FlagsStore } from '../src/client/store'
import type { FlagsDocument } from '../src/shared/palette'

const DOC: FlagsDocument = {
  version: 1,
  flags: { 'sess-a': 'red' },
  colorNames: { red: '重点' },
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('client FlagsStore', () => {
  it('loads the Host document once and exposes it through getSnapshot', async () => {
    const fetchMock = vi.fn(async () => json({ ok: true, value: DOC }))
    vi.stubGlobal('fetch', fetchMock)

    const store = new FlagsStore()
    expect(store.getSnapshot().ready).toBe(false)
    await Promise.all([store.ensureLoaded(), store.ensureLoaded()])

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(store.getSnapshot()).toMatchObject({ ready: true, document: DOC, loadError: null })
    expect(store.colorOf('sess-a')).toBe('red')
    expect(store.colorOf('sess-b')).toBeNull()
    await store.ensureLoaded()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('notifies subscribers with an unsubscribe handle', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => json({ ok: true, value: DOC })))
    const store = new FlagsStore()
    const seen: boolean[] = []
    const unsubscribe = store.subscribe(() => {
      seen.push(store.getSnapshot().ready)
    })
    await store.ensureLoaded()
    unsubscribe()
    await store.setFlag('sess-b', 'blue').catch(() => undefined)
    expect(seen).toEqual([true])
  })

  it('reports a retryable load failure and recovers on the next attempt', async () => {
    const fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValueOnce(json({ ok: true, value: DOC }))
    vi.stubGlobal('fetch', fetchMock)

    const store = new FlagsStore()
    await store.ensureLoaded()
    expect(store.getSnapshot()).toMatchObject({ ready: false, loadError: 'network' })

    await store.ensureLoaded()
    expect(store.getSnapshot()).toMatchObject({ ready: true, document: DOC, loadError: null })
  })

  it('sends set-flag mutations and commits the returned document', async () => {
    const next: FlagsDocument = { ...DOC, flags: { 'sess-a': 'red', 'sess-b': 'blue' } }
    const fetchMock = vi.fn(async (url: string, init: RequestInit) => {
      expect(String(url)).toBe('/api/dsh-session-flags/set-flag')
      expect(init.method).toBe('POST')
      expect(JSON.parse(String(init.body))).toEqual({ sessionId: 'sess-b', colorId: 'blue' })
      return json({ ok: true, value: next })
    })
    vi.stubGlobal('fetch', fetchMock)

    const store = new FlagsStore()
    await store.setFlag('sess-b', 'blue')
    expect(store.getSnapshot().document.flags).toEqual({ 'sess-a': 'red', 'sess-b': 'blue' })
    expect(store.getSnapshot().mutationError).toBeNull()
  })

  it('keeps the previous document and records the failure when a mutation fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => json({ ok: false, error: { code: 'storage-failure', message: 'nope' } }, 500)),
    )

    const store = new FlagsStore()
    const accepted = await store.setFlag('sess-b', 'blue')
    expect(accepted).toBe(false)
    expect(store.getSnapshot().document.flags).toEqual({})
    expect(store.getSnapshot().mutationError).toBe('storage-failure')
  })

  it('saves color names and treats null as "remove the override"', async () => {
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      expect(JSON.parse(String(init.body))).toEqual({ names: { red: '重点项目', teal: null } })
      return json({ ok: true, value: { version: 1, flags: {}, colorNames: { red: '重点项目' } } })
    })
    vi.stubGlobal('fetch', fetchMock)

    const store = new FlagsStore()
    await store.saveColorNames({ red: '重点项目', teal: null })
    expect(store.getSnapshot().document.colorNames).toEqual({ red: '重点项目' })
  })

  it('surfaces an unreadable response as a stable code', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('not json', { status: 502 })))
    const store = new FlagsStore()
    await store.ensureLoaded()
    expect(store.getSnapshot().loadError).toBe('response')
  })
})
