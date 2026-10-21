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

/* Global "Flagged sessions" panel: a full main-column page. */
.dsf-page {
  box-sizing: border-box;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 0 clamp(24px, 4vw, 48px) 48px;
  overflow: auto;
  color: var(--dsw-alias-label-primary);
}
.dsf-page > * {
  width: 100%;
  max-width: 960px;
  flex: none;
}
.dsf-pageHead {
  box-sizing: border-box;
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding-top: calc(28px + var(--dsh-frame-top-clearance, 0px));
}
.dsf-pageHeading {
  min-width: 0;
}
.dsf-pageTitle {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 20px;
  font-weight: 500;
  line-height: 28px;
}
.dsf-pageCount {
  flex: none;
  border-radius: 999px;
  background: var(--dsw-alias-bg-layer-3, var(--dsw-alias-interactive-bg-hover));
  color: var(--dsw-alias-label-secondary);
  padding: 0 8px;
  font-size: 12px;
  font-weight: 400;
  line-height: 20px;
  font-variant-numeric: tabular-nums;
}
.dsf-pageIntro {
  margin: 4px 0 0;
  color: var(--dsw-alias-label-secondary);
  font-size: 13px;
  line-height: 20px;
}
.dsf-toolbar {
  display: flex;
  flex: none;
  align-items: center;
  gap: 12px;
}
.dsf-searchWrap {
  display: inline-flex;
  align-items: center;
  gap: 4px;
}
.dsf-search {
  width: min(280px, 40vw);
}
.dsf-iconButton {
  display: inline-flex;
  flex: none;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  padding: 0;
  border: 0;
  border-radius: var(--dsw-radius-sm, 8px);
  background: transparent;
  color: var(--dsw-alias-label-tertiary);
  cursor: pointer;
}
.dsf-iconButton:hover {
  background: var(--dsw-alias-interactive-bg-hover);
  color: var(--dsw-alias-label-primary);
}
.dsf-iconButton:focus-visible {
  outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, currentColor);
  outline-offset: 1px;
}
.dsf-groups {
  display: flex;
  flex-direction: column;
  gap: 28px;
}
.dsf-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.dsf-groupHead {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  line-height: 22px;
}
.dsf-groupName {
  flex: none;
}
.dsf-groupCount {
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
  font-weight: 400;
}
.dsf-sessionList {
  display: flex;
  flex-direction: column;
  margin: 0;
  padding: 0;
  list-style: none;
}
.dsf-sessionItem {
  display: flex;
  align-items: center;
  border-radius: var(--dsw-radius-md, 10px);
}
.dsf-sessionItem:hover {
  background: var(--dsw-alias-interactive-bg-hover);
}
.dsf-sessionRow {
  display: flex;
  flex: 1;
  flex-direction: column;
  align-items: flex-start;
  gap: 1px;
  min-width: 0;
  padding: 8px 10px;
  border: 0;
  border-radius: var(--dsw-radius-md, 10px);
  background: transparent;
  color: var(--dsw-alias-label-primary);
  font: inherit;
  text-align: left;
  cursor: pointer;
}
.dsf-sessionRow:focus-visible {
  outline: var(--dsw-focus-ring-width, 2px) solid var(--dsw-focus-ring-color, currentColor);
  outline-offset: -2px;
}
.dsf-sessionTitle {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 13.5px;
  line-height: 20px;
}
.dsf-sessionMeta {
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--dsw-alias-label-tertiary);
  font-size: 12px;
  line-height: 18px;
}
.dsf-clearFlag {
  margin-right: 6px;
  opacity: 0;
}
.dsf-sessionItem:hover .dsf-clearFlag,
.dsf-clearFlag:focus-visible {
  opacity: 1;
}
.dsf-status {
  margin: 0;
  color: var(--dsw-alias-label-tertiary);
  font-size: 13px;
  line-height: 20px;
}
.dsf-empty {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  margin: 0;
  padding: 24px 0;
  color: var(--dsw-alias-label-tertiary);
  font-size: 13px;
  line-height: 20px;
}
.dsf-empty p {
  margin: 0;
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
