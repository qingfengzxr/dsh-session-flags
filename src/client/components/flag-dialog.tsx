import { Button, IconCheckOutlineRegular, Input, Modal } from '@deepseek-ai/dsh-client-ui-primitives'
import { useState, type ReactNode } from 'react'
import {
  FLAG_COLORS,
  flagColorHex,
  MAX_COLOR_NAME_LENGTH,
  type FlagColorId,
  type FlagsDocument,
} from '../../shared/palette'
import { flagColorName, localizedError } from '../labels'
import type { DialogTarget } from '../dialog-store'
import type { FlagTranslate, OverlayProps } from '../types'
import { ColorDot, FlagGlyph } from './flag-glyph'

/** Pick a color for the pending session, or step into the color-name manager. */
interface FlagPickerProps {
  target: DialogTarget
  document: FlagsDocument
  setFlag: (sessionId: string, colorId: FlagColorId | null) => Promise<boolean>
  onManage: (returnTo: DialogTarget | null) => void
  onClose: () => void
  t: FlagTranslate
}

function FlagPicker({ target, document, setFlag, onManage, onClose, t }: FlagPickerProps): ReactNode {
  const [pending, setPending] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const current = document.flags[target.sessionId] ?? null

  /** Persist one choice; a successful write closes the dialog. */
  const choose = (colorId: FlagColorId | null): void => {
    if (pending) return
    setPending(true)
    setError(null)
    void setFlag(target.sessionId, colorId).then((ok) => {
      setPending(false)
      if (ok) onClose()
      else setError(t('error.persist'))
    })
  }

  const footer = (
    <>
      <Button variant="outline" size="md" onClick={onClose}>
        {t('picker.done')}
      </Button>
    </>
  )

  return (
    <Modal open onClose={onClose} title={t('picker.title')} description={target.displayTitle} closeLabel={t('dialog.close')} footer={footer}>
      <div className="dsf-dialogBody">
        <div className="dsf-options" role="group" aria-label={t('picker.title')}>
          <FlagOption
            colorId={null}
            name={t('picker.none')}
            selected={current === null}
            disabled={pending}
            onSelect={() => {
              choose(null)
            }}
          />
          {FLAG_COLORS.map((color) => (
            <FlagOption
              key={color.id}
              colorId={color.id}
              name={flagColorName(color.id, document, t)}
              selected={current === color.id}
              disabled={pending}
              onSelect={() => {
                choose(color.id)
              }}
            />
          ))}
        </div>
        {error === null ? null : (
          <p className="dsf-error" role="alert">
            {error}
          </p>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            onManage(target)
          }}
        >
          {t('picker.manage')}
        </Button>
      </div>
    </Modal>
  )
}

interface FlagOptionProps {
  colorId: FlagColorId | null
  name: string
  selected: boolean
  disabled: boolean
  onSelect: () => void
}

/** One roving option inside the picker grid. */
function FlagOption({ colorId, name, selected, disabled, onSelect }: FlagOptionProps): ReactNode {
  return (
    <button
      type="button"
      className="dsf-option"
      data-selected={selected}
      aria-pressed={selected}
      disabled={disabled}
      onClick={onSelect}
    >
      {colorId === null ? <FlagGlyph color={null} /> : <ColorDot color={flagColorHex(colorId)} size={12} />}
      <span className="dsf-optionLabel">{name}</span>
      {selected ? (
        <span className="dsf-optionCheck" aria-hidden="true">
          <IconCheckOutlineRegular size={14} />
        </span>
      ) : null}
    </button>
  )
}

/** Rename each palette color; clearing a name restores the localized default. */
interface FlagNameManagerProps {
  document: FlagsDocument
  saveColorNames: (names: Partial<Record<FlagColorId, string | null>>) => Promise<boolean>
  onCancel: () => void
  t: FlagTranslate
}

function FlagNameManager({ document, saveColorNames, onCancel, t }: FlagNameManagerProps): ReactNode {
  const [drafts, setDrafts] = useState<Record<FlagColorId, string>>(() => draftsFrom(document))
  const [saving, setSaving] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)

  const save = (): void => {
    if (saving) return
    const names: Partial<Record<FlagColorId, string | null>> = {}
    for (const color of FLAG_COLORS) {
      const draft = (drafts[color.id] ?? '').trim()
      names[color.id] = draft === '' ? null : draft
    }
    setSaving(true)
    setError(null)
    void saveColorNames(names).then((ok) => {
      setSaving(false)
      if (ok) onCancel()
      else setError(t('error.persist'))
    })
  }

  const footer = (
    <>
      <Button variant="outline" size="md" onClick={onCancel} disabled={saving}>
        {t('manage.cancel')}
      </Button>
      <Button variant="primary" size="md" onClick={save} disabled={saving}>
        {t('manage.save')}
      </Button>
    </>
  )

  return (
    <Modal open onClose={onCancel} title={t('manage.title')} closeLabel={t('dialog.close')} footer={footer}>
      <div className="dsf-dialogBody">
        <p className="dsf-hint">{t('manage.hint')}</p>
        <div className="dsf-manageRows">
          {FLAG_COLORS.map((color, index) => (
            <div className="dsf-manageRow" key={color.id}>
              <span className="dsf-manageColor">
                <ColorDot color={color.hex} />
                {t(`color.${color.id}`)}
              </span>
              <Input
                {...(index === 0 ? MODAL_AUTOFOCUS : {})}
                className="dsf-manageInput"
                value={drafts[color.id] ?? ''}
                placeholder={flagColorName(color.id, document, t)}
                aria-label={t('manage.nameLabel', { name: t(`color.${color.id}`) })}
                maxLength={MAX_COLOR_NAME_LENGTH}
                onChange={(event) => {
                  const value = event.target.value
                  setDrafts((current) => ({ ...current, [color.id]: value }))
                }}
              />
            </div>
          ))}
        </div>
        {error === null ? null : (
          <p className="dsf-error" role="alert">
            {error}
          </p>
        )}
      </div>
    </Modal>
  )
}

/** The Modal primitive focuses a body control marked this way. */
const MODAL_AUTOFOCUS = { 'data-modal-autofocus': '' } as const

/** Seed editable drafts from persisted overrides (default names stay placeholders). */
function draftsFrom(document: FlagsDocument): Record<FlagColorId, string> {
  const drafts = {} as Record<FlagColorId, string>
  for (const color of FLAG_COLORS) drafts[color.id] = document.colorNames[color.id] ?? ''
  return drafts
}

/**
 * `shell.overlay` occupant: the plugin's two dialogs.
 *
 * The overlay entry stays mounted for the whole application lifetime and renders
 * nothing while the dialog store is closed, which mirrors how official plugins
 * own their modal surfaces (`Modal` handles the mask, Escape, and focus return).
 */
export function FlagDialog({
  useDialog,
  useFlags,
  closeDialog,
  backDialog,
  openManager,
  setFlag,
  saveColorNames,
  t,
}: OverlayProps): ReactNode {
  const view = useDialog((snapshot) => snapshot)
  const document = useFlags((snapshot) => snapshot.document)
  const loadError = useFlags((snapshot) => snapshot.loadError)
  if (view.kind === 'closed') return null
  if (view.kind === 'pick') {
    return (
      <FlagPicker
        key={`pick:${view.target.sessionId}`}
        target={view.target}
        document={document}
        setFlag={setFlag}
        onManage={openManager}
        onClose={closeDialog}
        t={t}
      />
    )
  }
  if (loadError !== null) {
    return (
      <Modal
        open
        onClose={backDialog}
        title={t('manage.title')}
        closeLabel={t('dialog.close')}
        footer={
          <Button variant="outline" size="md" onClick={backDialog}>
            {t('dialog.close')}
          </Button>
        }
      >
        <p className="dsf-error" role="alert">
          {localizedError(loadError, t) ?? t('error.load')}
        </p>
      </Modal>
    )
  }
  return (
    <FlagNameManager
      key={`manage:${view.returnTo?.sessionId ?? 'none'}`}
      document={document}
      saveColorNames={saveColorNames}
      onCancel={backDialog}
      t={t}
    />
  )
}
