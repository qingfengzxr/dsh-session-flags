import { describe, expect, it } from 'vitest'
import { emptyFlagsDocument, type FlagsDocument } from '../src/shared/palette'
import {
  buildFlagPanel,
  type FlagPanelSessions,
  type FlagPanelWorkspaces,
} from '../src/client/panel-model'

/** A catalog with three flagged sessions, one flagged-but-deleted id, and one workspace split. */
function fixture(): {
  document: FlagsDocument
  sessions: FlagPanelSessions
  workspaces: FlagPanelWorkspaces
} {
  const document = emptyFlagsDocument()
  document.flags = { s1: 'red', s2: 'purple', s3: 'red', ghost: 'blue' }
  document.colorNames = { red: '重要' }
  return {
    document,
    sessions: {
      byId: {
        s1: { displayTitle: 'Alpha', updatedAt: 1 },
        s2: { displayTitle: 'Beta', updatedAt: 5 },
        s3: { displayTitle: 'Gamma', updatedAt: 3 },
      },
    },
    workspaces: {
      items: [
        { title: 'Work A', sessionIds: ['s1', 's2'] },
        { title: 'Work B', sessionIds: ['s3'] },
      ],
    },
  }
}

/** Default names in palette order, overridden only where the fixture says so. */
function colorName(document: FlagsDocument, colorId: string): string {
  const override = document.colorNames[colorId as keyof typeof document.colorNames]
  return override ?? colorId
}

describe('buildFlagPanel', () => {
  it('groups in palette order and keeps newest activity first inside a group', () => {
    const { document, sessions, workspaces } = fixture()
    const model = buildFlagPanel({
      document,
      sessions,
      workspaces,
      query: '',
      colorName: (colorId) => colorName(document, colorId),
    })

    expect(model.totalFlagged).toBe(4)
    expect(model.matched).toBe(3)
    expect(model.groups.map((group) => group.colorId)).toEqual(['red', 'purple'])
    // red: s3 (updatedAt 3) then s1 (updatedAt 1); the deleted `ghost` produces no row.
    expect(model.groups[0]?.entries.map((entry) => entry.sessionId)).toEqual(['s3', 's1'])
    expect(model.groups[1]?.entries.map((entry) => entry.sessionId)).toEqual(['s2'])
  })

  it('resolves the workspace title and the color display name for every entry', () => {
    const { document, sessions, workspaces } = fixture()
    const model = buildFlagPanel({
      document,
      sessions,
      workspaces,
      query: '',
      colorName: (colorId) => colorName(document, colorId),
    })

    expect(model.groups[0]?.name).toBe('重要')
    expect(model.groups[0]?.entries[0]).toMatchObject({
      title: 'Gamma',
      workspaceTitle: 'Work B',
      colorId: 'red',
    })
    expect(model.groups[1]?.entries[0]?.workspaceTitle).toBe('Work A')
  })

  it('filters by session title', () => {
    const { document, sessions, workspaces } = fixture()
    const model = buildFlagPanel({
      document,
      sessions,
      workspaces,
      query: 'beta',
      colorName: (colorId) => colorName(document, colorId),
    })

    expect(model.matched).toBe(1)
    expect(model.groups.map((group) => group.colorId)).toEqual(['purple'])
    expect(model.groups[0]?.entries.map((entry) => entry.title)).toEqual(['Beta'])
  })

  it('filters by workspace title, case-insensitively', () => {
    const { document, sessions, workspaces } = fixture()
    const model = buildFlagPanel({
      document,
      sessions,
      workspaces,
      query: 'WORK B',
      colorName: (colorId) => colorName(document, colorId),
    })

    expect(model.matched).toBe(1)
    expect(model.groups[0]?.entries.map((entry) => entry.title)).toEqual(['Gamma'])
  })

  it('filters by the resolved color name, including a user override', () => {
    const { document, sessions, workspaces } = fixture()
    const model = buildFlagPanel({
      document,
      sessions,
      workspaces,
      query: '重要',
      colorName: (colorId) => colorName(document, colorId),
    })

    expect(model.matched).toBe(2)
    expect(model.groups.map((group) => group.colorId)).toEqual(['red'])
  })

  it('treats a blank query as no filter', () => {
    const { document, sessions, workspaces } = fixture()
    const model = buildFlagPanel({
      document,
      sessions,
      workspaces,
      query: '   ',
      colorName: (colorId) => colorName(document, colorId),
    })

    expect(model.matched).toBe(3)
  })

  it('reports no matches without dropping the total', () => {
    const { document, sessions, workspaces } = fixture()
    const model = buildFlagPanel({
      document,
      sessions,
      workspaces,
      query: 'no such session',
      colorName: (colorId) => colorName(document, colorId),
    })

    expect(model.totalFlagged).toBe(4)
    expect(model.matched).toBe(0)
    expect(model.groups).toEqual([])
  })

  it('degrades to no rows before the catalogs load', () => {
    const { document } = fixture()
    const model = buildFlagPanel({
      document,
      sessions: undefined,
      workspaces: undefined,
      query: '',
      colorName: (colorId) => colorName(document, colorId),
    })

    expect(model.totalFlagged).toBe(4)
    expect(model.matched).toBe(0)
    expect(model.groups).toEqual([])
  })

  it('reports an empty document as nothing flagged', () => {
    const model = buildFlagPanel({
      document: emptyFlagsDocument(),
      sessions: { byId: {} },
      workspaces: { items: [] },
      query: 'anything',
      colorName: (colorId) => colorId,
    })

    expect(model.totalFlagged).toBe(0)
    expect(model.matched).toBe(0)
    expect(model.groups).toEqual([])
  })
})
