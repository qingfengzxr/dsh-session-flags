/**
 * Pure projection behind the "Flagged sessions" global panel.
 *
 * The panel gathers every session the user has flagged, groups them in palette
 * order, and filters them against one search phrase. Keeping that projection out
 * of the component makes the ordering and filtering rules testable without a
 * browser, and keeps the component a thin renderer over framework hooks.
 *
 * The inputs are structural subsets of the Session and Workspace Controller
 * snapshots (`byId` / `items`), so callers can hand over the full snapshot while
 * tests build tiny fixtures.
 */
import type { SessionListState } from '@deepseek-ai/dsh-api-session-controller/client'
import type { WorkspaceSnapshot } from '@deepseek-ai/dsh-api-workspace-controller/client'
import { FLAG_COLORS, type FlagColorId, type FlagsDocument } from '../shared/palette'

/** The session fields the panel reads from the Session Controller list. */
export interface FlagPanelSessionRow {
  /** Human-facing label: durable title, project basename, then session id. */
  readonly displayTitle: string
  /** Last-known activity instant, used for the newest-first order. */
  readonly updatedAt: number
}

/** Structural subset of `SessionListState`. */
export interface FlagPanelSessions {
  readonly byId: Readonly<Record<string, FlagPanelSessionRow>>
}

/** Structural subset of one `WorkspaceView`. */
export interface FlagPanelWorkspace {
  readonly title: string
  readonly sessionIds: readonly string[]
}

/** Structural subset of `WorkspaceSnapshot`. */
export interface FlagPanelWorkspaces {
  readonly items: readonly FlagPanelWorkspace[]
}

/** One flagged session, resolved against the live catalog. */
export interface FlagPanelEntry {
  readonly sessionId: string
  /** Session display title (never blank: the Controller falls back to the id). */
  readonly title: string
  /** Workspace the session belongs to, or `null` for ungrouped sessions. */
  readonly workspaceTitle: string | null
  readonly colorId: FlagColorId
}

/** One color group, in palette order. */
export interface FlagPanelGroup {
  readonly colorId: FlagColorId
  /** Display name of the color (user override, else the localized default). */
  readonly name: string
  /** Matching members, newest activity first. */
  readonly entries: readonly FlagPanelEntry[]
}

/** The rendered result for one snapshot + query combination. */
export interface FlagPanelModel {
  /** Flags in the persisted document, including sessions the catalog no longer lists. */
  readonly totalFlagged: number
  /** Entries shown after filtering. */
  readonly matched: number
  /** Non-empty groups in palette order. */
  readonly groups: readonly FlagPanelGroup[]
}

/** Everything the projection needs. */
export interface FlagPanelInput {
  readonly document: FlagsDocument
  readonly sessions: FlagPanelSessions | undefined
  readonly workspaces: FlagPanelWorkspaces | undefined
  /** Raw search phrase; surrounding whitespace is ignored, case is folded. */
  readonly query: string
  /** Resolve one color's display name (user override or localized default). */
  readonly colorName: (colorId: FlagColorId) => string
}

/**
 * Build the panel model.
 *
 * Session ids are stringified once so the branded `SessionId` of the framework
 * snapshots and the plain strings of the persisted document compare directly.
 * Flags whose session is missing from the catalog (deleted / not yet listed) are
 * counted in `totalFlagged` but produce no row.
 *
 * @param input - document, catalog snapshots, query, and name resolution.
 * @returns groups in palette order with newest-first members.
 */
export function buildFlagPanel(input: FlagPanelInput): FlagPanelModel {
  const { document, sessions, workspaces, query, colorName } = input

  const workspaceTitleBySession = new Map<string, string>()
  for (const workspace of workspaces?.items ?? []) {
    for (const sessionId of workspace.sessionIds) workspaceTitleBySession.set(String(sessionId), workspace.title)
  }

  const entries: FlagPanelEntry[] = []
  for (const [sessionId, summary] of Object.entries(sessions?.byId ?? {})) {
    const colorId = document.flags[sessionId]
    if (colorId === undefined) continue
    entries.push({
      sessionId,
      title: summary.displayTitle,
      workspaceTitle: workspaceTitleBySession.get(sessionId) ?? null,
      colorId,
    })
  }
  entries.sort((left, right) => {
    const byActivity = (sessions?.byId[right.sessionId]?.updatedAt ?? 0) - (sessions?.byId[left.sessionId]?.updatedAt ?? 0)
    return byActivity !== 0 ? byActivity : left.sessionId.localeCompare(right.sessionId)
  })

  const needle = query.trim().toLocaleLowerCase()
  const matched = needle === '' ? entries : entries.filter((entry) => matches(entry, needle, colorName(entry.colorId)))

  return {
    totalFlagged: Object.keys(document.flags).length,
    matched: matched.length,
    groups: FLAG_COLORS.map(({ id }) => ({
      colorId: id,
      name: colorName(id),
      entries: matched.filter((entry) => entry.colorId === id),
    })).filter((group) => group.entries.length > 0),
  }
}

/** Whether one entry contains the folded search phrase in any text it shows. */
function matches(entry: FlagPanelEntry, needle: string, colorName: string): boolean {
  const haystack = [entry.title, entry.workspaceTitle ?? '', colorName]
  return haystack.some((text) => text.toLocaleLowerCase().includes(needle))
}
