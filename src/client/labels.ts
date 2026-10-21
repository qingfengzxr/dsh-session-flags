import type { FlagsDocument, FlagColorId } from '../shared/palette'
import type { FlagTranslate } from './types'

/**
 * Resolve the display name of a palette color.
 *
 * User overrides win over the localized default, and the default comes from the
 * translation dictionary rather than storage, so renaming a color follows the
 * GUI language until the user names it explicitly.
 */
export function flagColorName(colorId: FlagColorId, document: FlagsDocument, t: FlagTranslate): string {
  return document.colorNames[colorId] ?? t(`color.${colorId}`)
}

/**
 * Map a stable transport/Host error code onto localized copy.
 *
 * Unknown codes fall back to the generic save failure: the code is only ever
 * shown as a translated sentence, so a future Host code degrades gracefully
 * instead of leaking a raw string into the GUI.
 */
export function localizedError(code: string | null, t: FlagTranslate): string | null {
  if (code === null) return null
  if (code === 'network') return t('error.network')
  if (code === 'response' || code.startsWith('http-') || code.startsWith('invalid-')) return t('error.response')
  return t('error.persist')
}

