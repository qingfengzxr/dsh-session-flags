import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { FlagsStore } from '../src/host/store'

let root: string

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), 'dsh-session-flags-test-'))
})

afterEach(async () => {
  await rm(root, { recursive: true, force: true })
})

describe('host FlagsStore', () => {
  it('starts empty when the file does not exist', async () => {
    const store = new FlagsStore(join(root, 'nested', 'flags.json'))
    await store.ensureLoaded()
    expect(store.snapshot()).toEqual({ version: 1, flags: {}, colorNames: {} })
  })

  it('persists flags and reloads them in a new store', async () => {
    const file = join(root, 'flags.json')
    const store = new FlagsStore(file)
    await store.ensureLoaded()
    await store.setFlag('sess-a', 'red')
    await store.setFlag('sess-b', 'blue')

    const reloaded = new FlagsStore(file)
    await reloaded.ensureLoaded()
    expect(reloaded.snapshot().flags).toEqual({ 'sess-a': 'red', 'sess-b': 'blue' })
    expect(JSON.parse(await readFile(file, 'utf8'))).toMatchObject({ flags: { 'sess-a': 'red' } })
  })

  it('clears one flag without touching the others', async () => {
    const store = new FlagsStore(join(root, 'flags.json'))
    await store.setFlag('a', 'red')
    await store.setFlag('b', 'green')
    await store.setFlag('a', null)
    expect(store.snapshot().flags).toEqual({ b: 'green' })
  })

  it('merges name overrides and removes them with blank values', async () => {
    const store = new FlagsStore(join(root, 'flags.json'))
    await store.setColorNames({ red: ' 重点 ', orange: '   ' })
    expect(store.snapshot().colorNames).toEqual({ red: '重点' })
    await store.setColorNames({ red: null })
    expect(store.snapshot().colorNames).toEqual({})
  })

  it('serializes concurrent mutations so no write is lost', async () => {
    const store = new FlagsStore(join(root, 'flags.json'))
    await Promise.all([
      store.setFlag('a', 'red'),
      store.setFlag('b', 'blue'),
      store.setColorNames({ blue: '工作' }),
      store.setFlag('c', 'green'),
    ])
    const reloaded = new FlagsStore(join(root, 'flags.json'))
    await reloaded.ensureLoaded()
    expect(reloaded.snapshot()).toEqual({
      version: 1,
      flags: { a: 'red', b: 'blue', c: 'green' },
      colorNames: { blue: '工作' },
    })
  })

  it('returns detached snapshots so callers cannot mutate committed state', async () => {
    const store = new FlagsStore(join(root, 'flags.json'))
    await store.setFlag('a', 'red')
    const snapshot = store.snapshot()
    snapshot.flags['a'] = 'blue'
    expect(store.snapshot().flags['a']).toBe('red')
  })

  it('recovers from a corrupt file by starting empty', async () => {
    const file = join(root, 'flags.json')
    await writeFile(file, '{ not json', 'utf8')
    const store = new FlagsStore(file)
    await store.ensureLoaded()
    expect(store.snapshot()).toEqual({ version: 1, flags: {}, colorNames: {} })
  })

  it('sanitizes a partially invalid file on load', async () => {
    const file = join(root, 'flags.json')
    await writeFile(file, JSON.stringify({ flags: { ok: 'teal', bad: 'magenta' }, colorNames: { pink: '' } }), 'utf8')
    const store = new FlagsStore(file)
    await store.ensureLoaded()
    expect(store.snapshot()).toEqual({ version: 1, flags: { ok: 'teal' }, colorNames: {} })
  })

  it('shares one load across concurrent callers', async () => {
    const store = new FlagsStore(join(root, 'flags.json'))
    await Promise.all([store.ensureLoaded(), store.ensureLoaded(), store.ensureLoaded()])
    expect(store.snapshot().flags).toEqual({})
  })
})
