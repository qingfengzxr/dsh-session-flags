import {
  Button,
  IconCloseOutlineRegular,
  IconSearchOutlineRegular,
  Input,
} from '@deepseek-ai/dsh-client-ui-primitives'
import { useState, type ReactNode } from 'react'
import { flagColorHex } from '../../shared/palette'
import { flagColorName, localizedError } from '../labels'
import { buildFlagPanel } from '../panel-model'
import type { FlagPanelProps } from '../types'
import { ColorDot } from './flag-glyph'

/**
 * `main` occupant for the flagged-session panel.
 *
 * The sidebar's global-panel row selects this panel by id; the layout then
 * mounts it in the central column in place of the Conversation. The component
 * therefore owns the whole page: a search field over the flagged catalog, color
 * groups in palette order, and per-row navigation back to the session. All data
 * arrives through framework selector hooks (the Session/Workspace Controller
 * snapshots and this plugin's flag store); every action arrives through the
 * injected business face, so the component never reaches for the Cordis context.
 */
export function FlagPanel({
  useFlags,
  useSessions,
  useWorkspaces,
  t,
  ensureLoaded,
  openSession,
  clearFlag,
  openManager,
}: FlagPanelProps): ReactNode {
  const flags = useFlags((snapshot) => snapshot)
  const sessions = useSessions((snapshot) => snapshot)
  const workspaces = useWorkspaces((snapshot) => snapshot)
  const [query, setQuery] = useState('')

  const model = buildFlagPanel({
    document: flags.document,
    sessions,
    workspaces,
    query,
    colorName: (colorId) => flagColorName(colorId, flags.document, t),
  })

  const renderBody = (): ReactNode => {
    if (!flags.ready) {
      const failure = localizedError(flags.loadError, t)
      if (failure === null) return <p className="dsf-status">{t('panel.loading')}</p>
      return (
        <div className="dsf-empty">
          <p>{failure}</p>
          <Button variant="outline" size="sm" onClick={ensureLoaded}>
            {t('panel.retry')}
          </Button>
        </div>
      )
    }
    if (model.totalFlagged === 0) return <p className="dsf-empty">{t('panel.empty')}</p>
    if (model.matched === 0) return <p className="dsf-empty">{t('panel.noMatches')}</p>
    return (
      <div className="dsf-groups">
        {model.groups.map((group) => (
          <section key={group.colorId} className="dsf-group" aria-label={group.name}>
            <h2 className="dsf-groupHead">
              <ColorDot color={flagColorHex(group.colorId)} size={8} />
              <span className="dsf-groupName">{group.name}</span>
              <span className="dsf-groupCount">{t('panel.groupCount', { count: group.entries.length })}</span>
            </h2>
            <ul className="dsf-sessionList">
              {group.entries.map((entry) => (
                <li key={entry.sessionId} className="dsf-sessionItem">
                  <button type="button" className="dsf-sessionRow" onClick={() => openSession(entry.sessionId)}>
                    <span className="dsf-sessionTitle">{entry.title}</span>
                    {entry.workspaceTitle === null ? null : (
                      <span className="dsf-sessionMeta">{entry.workspaceTitle}</span>
                    )}
                  </button>
                  <button
                    type="button"
                    className="dsf-iconButton dsf-clearFlag"
                    aria-label={t('panel.clearFlag')}
                    onClick={() => clearFlag(entry.sessionId)}
                  >
                    <IconCloseOutlineRegular size={14} />
                  </button>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    )
  }

  return (
    <div className="dsf-page">
      <header className="dsf-pageHead">
        <div className="dsf-pageHeading">
          <h1 className="dsf-pageTitle">
            {t('panel.title')}
            {model.totalFlagged === 0 ? null : <span className="dsf-pageCount">{model.totalFlagged}</span>}
          </h1>
          <p className="dsf-pageIntro">{t('panel.intro')}</p>
        </div>
        <div className="dsf-toolbar">
          <div className="dsf-searchWrap">
            <Input
              className="dsf-search"
              icon={<IconSearchOutlineRegular size={14} />}
              value={query}
              placeholder={t('panel.searchPlaceholder')}
              aria-label={t('panel.searchPlaceholder')}
              onChange={(event) => setQuery(event.target.value)}
            />
            {query === '' ? null : (
              <button
                type="button"
                className="dsf-iconButton dsf-searchClear"
                aria-label={t('panel.searchClear')}
                onClick={() => setQuery('')}
              >
                <IconCloseOutlineRegular size={14} />
              </button>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={openManager}>
            {t('panel.manage')}
          </Button>
        </div>
      </header>
      {renderBody()}
    </div>
  )
}
