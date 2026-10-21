import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { FlagHoverTag } from '../src/client/components/flag-hover-tag'
import { FlagMark } from '../src/client/components/flag-mark'
import type { FlagsSnapshot } from '../src/client/store'
import type { RowHoverProps, RowMarkProps } from '../src/client/types'
import type { FlagsDocument } from '../src/shared/palette'

const DOCUMENT: FlagsDocument = {
  version: 1,
  flags: { 'sess-green': 'green' },
  colorNames: { green: '进行中' },
}

/** Stand-in for the framework-injected `useFlags(selector)` hook. */
function flagsHook(document: FlagsDocument) {
  const snapshot: FlagsSnapshot = { ready: true, document, loadError: null, mutationError: null }
  return (selector: (value: FlagsSnapshot) => unknown): unknown => selector(snapshot)
}

function markProps(sessionId: string, document: FlagsDocument = DOCUMENT): RowMarkProps {
  return { sessionId, useFlags: flagsHook(document) } as unknown as RowMarkProps
}

function hoverProps(sessionId: string, document: FlagsDocument = DOCUMENT): RowHoverProps {
  const t = ((key: string) => `t:${key}`) as unknown as RowHoverProps['t']
  return { sessionId, useFlags: flagsHook(document), t } as unknown as RowHoverProps
}

describe('flag row seats', () => {
  it('renders nothing for an unflagged session', () => {
    expect(renderToStaticMarkup(<FlagMark {...markProps('sess-plain')} />)).toBe('')
    expect(renderToStaticMarkup(<FlagHoverTag {...hoverProps('sess-plain')} />)).toBe('')
  })

  it('paints the persisted palette hex and exposes the color id', () => {
    const html = renderToStaticMarkup(<FlagMark {...markProps('sess-green')} />)
    expect(html).toContain('data-session-flag="green"')
    expect(html).toContain('#30A46C')
    expect(html).toContain('class="dsf-mark"')
    expect(html).toContain('aria-hidden="true"')
  })

  it('shows the user-defined name in the hover card', () => {
    const html = renderToStaticMarkup(<FlagHoverTag {...hoverProps('sess-green')} />)
    expect(html).toContain('进行中')
    expect(html).toContain('#30A46C')
  })

  it('falls back to the localized default name when no override exists', () => {
    const document: FlagsDocument = {
      version: 1,
      flags: { 'sess-blue': 'blue' },
      colorNames: {},
    }
    const html = renderToStaticMarkup(<FlagHoverTag {...hoverProps('sess-blue', document)} />)
    expect(html).toContain('t:color.blue')
  })
})
