import { describe, expect, it } from 'vitest'
import { DialogStore } from '../src/client/dialog-store'

const TARGET = { sessionId: 'sess-a', displayTitle: 'Alpha' }

describe('DialogStore', () => {
  it('starts closed', () => {
    expect(new DialogStore().getSnapshot()).toEqual({ kind: 'closed' })
  })

  it('opens the picker for one session', () => {
    const store = new DialogStore()
    store.openPicker(TARGET)
    expect(store.getSnapshot()).toEqual({ kind: 'pick', target: TARGET })
  })

  it('returns from the manager to the pending picker, then closes', () => {
    const store = new DialogStore()
    store.openPicker(TARGET)
    store.openManager(TARGET)
    expect(store.getSnapshot()).toEqual({ kind: 'manage', returnTo: TARGET })
    store.back()
    expect(store.getSnapshot()).toEqual({ kind: 'pick', target: TARGET })
    store.close()
    expect(store.getSnapshot()).toEqual({ kind: 'closed' })
  })

  it('closes the manager when no pick is pending', () => {
    const store = new DialogStore()
    store.openManager(null)
    store.back()
    expect(store.getSnapshot()).toEqual({ kind: 'closed' })
  })

  it('notifies subscribers until they unsubscribe', () => {
    const store = new DialogStore()
    const views: string[] = []
    const unsubscribe = store.subscribe(() => {
      views.push(store.getSnapshot().kind)
    })
    store.openPicker(TARGET)
    store.close()
    unsubscribe()
    store.openManager(null)
    expect(views).toEqual(['pick', 'closed'])
  })
})
