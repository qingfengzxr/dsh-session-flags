/**
 * Styles owned by the plugin.
 *
 * The Harness client bundles inject their CSS as a `<style data-plugin-css>`
 * element at load time (official packages do the same rather than depending on
 * a CSS runtime), and every visual value here reads a `--dsw-*` theme token so
 * the flag UI follows light/dark themes automatically.
 */
export const STYLE_ID = 'dsh-session-flags/flag.css'

/** The plugin's CSS. Class names are `dsf-` prefixed to stay collision-free. */
export const STYLES = `
/* Leading seat mark: same 16x20 geometry the official schedule mark uses. */
.dsf-mark {
  width: 16px;
  height: 20px;
  color: var(--dsw-alias-label-tertiary);
  flex: none;
  justify-content: center;
  align-items: center;
  display: inline-flex;
}

/* Row trailing action: the same hit box as the official archive/pin buttons. */
.dsf-rowAction {
  border-radius: var(--dsw-radius-xs);
  cursor: pointer;
  width: 16px;
  height: 16px;
  color: var(--dsw-alias-label-tertiary);
  background: 0 0;
  border: none;
  flex: none;
  justify-content: center;
  align-items: center;
  padding: 0;
  display: inline-flex;
  transition: color 0.12s ease-in-out;
}
.dsf-rowAction:hover {
  color: var(--dsw-alias-label-primary);
}
.dsf-rowAction[data-flag-set='true'] {
  color: var(--dsw-alias-label-secondary);
}
.dsf-rowAction:focus-visible {
  outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, currentColor);
  outline-offset: 1px;
}

/* Color swatch used by menus, hover chip, and dialogs. */
.dsf-dot {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  flex: none;
  display: inline-block;
  background: var(--dsf-dot-color, currentColor);
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.08);
}

/* Hover-card chip: the official hover card is a dark surface. */
.dsf-hover {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  max-width: 100%;
  font-size: 12px;
  line-height: 16px;
  color: #cfd3d6;
}
.dsf-hoverName {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Dialogs */
.dsf-dialogBody {
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.dsf-options {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}
.dsf-option {
  display: flex;
  align-items: center;
  gap: 9px;
  min-width: 0;
  border: 1px solid var(--dsw-alias-border-l4, transparent);
  border-radius: var(--dsw-radius-md, 10px);
  background: transparent;
  padding: 10px 12px;
  color: var(--dsw-alias-label-primary);
  font: inherit;
  font-size: 13px;
  text-align: left;
  cursor: pointer;
  transition:
    background 0.12s ease-in-out,
    border-color 0.12s ease-in-out;
}
.dsf-option:hover {
  background: var(--dsw-alias-interactive-bg-hover);
}
.dsf-option[data-selected='true'] {
  border-color: var(--dsw-alias-state-business-primary, var(--dsw-alias-label-primary));
}
.dsf-optionLabel {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.dsf-optionCheck {
  flex: none;
  display: inline-flex;
  color: var(--dsw-alias-label-secondary);
}

.dsf-manageRows {
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-height: min(46vh, 360px);
  overflow: auto;
  padding-right: 2px;
}
.dsf-manageRow {
  display: flex;
  align-items: center;
  gap: 10px;
}
.dsf-manageColor {
  flex: none;
  width: 76px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--dsw-alias-label-secondary);
  font-size: 12px;
}
.dsf-manageInput {
  flex: 1;
  min-width: 0;
}

.dsf-hint {
  margin: 0;
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
  line-height: 18px;
}
.dsf-error {
  margin: 0;
  color: var(--dsw-alias-state-error-primary, var(--dsw-alias-label-secondary));
  font-size: 12px;
  line-height: 18px;
}
`

/** Remove a previously mounted copy (used only on plugin unload). */
function removeStyle(): void {
  document.querySelector(`style[data-plugin-css="${STYLE_ID}"]`)?.remove()
}

/**
 * Mount the plugin CSS once and return its unmount disposer.
 *
 * A stale copy from a previous load (hot reload) is replaced rather than
 * duplicated; unmount only removes the element this call mounted.
 */
export function applyFlagStyles(): () => void {
  if (typeof document === 'undefined') return () => {}
  removeStyle()
  const element = document.createElement('style')
  element.setAttribute('data-plugin', 'dsh-session-flags')
  element.setAttribute('data-plugin-css', STYLE_ID)
  element.textContent = STYLES
  document.head.append(element)
  return () => {
    element.remove()
  }
}
