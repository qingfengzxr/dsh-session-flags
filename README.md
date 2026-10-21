# dsh-session-flags

Colored flags for [DeepSeek Harness](https://github.com/deepseek-ai/deepseek-harness) session lists — mark the sessions that matter, give each color a name of your own, and find them again at a glance.

A flag is not a pin: pins reorder the list, flags label it. Use one color for “waiting on me”, another for “refactor in progress”, a third for “read tomorrow”; rename the colors to match your own workflow.

- **Colored flag on every flagged session row.** A small flag glyph sits in the session-row leading seat (right before the title) while the row is idle; the row's own status dot takes precedence when a session needs attention.
- **Flag button in the row hover strip.** The same flag is one click away on hover, and its hollow/outlined state tells unflagged rows apart.
- **Flag row in the session “…” menu.** Between “Fork” and “Archive”, with the current color previewed in the icon.
- **Named colors.** Every palette color can be renamed (per language, stored per user). The name shows up in the hover card, the picker, and the menu — so the color system can carry your own vocabulary.
- **Named flag chip in the hover card**, so a colored dot never has to be remembered.
- **Bilingual UI** (Simplified Chinese / English) following the GUI language.
- **Durable, local, private.** Flags live in one JSON document under the DSH home, owned by the plugin's Host half. No network calls, no telemetry, no changes to sessions themselves.

## Requirements

- DeepSeek Harness Desktop (or the Web GUI) **0.2.1-rc.2** or a compatible `0.2.x` build.
- The plugin is a normal independent DSH plugin package (Host half + Client browser bundle); it installs into a profile, not into the application.

## Install

### From a local checkout

```bash
pnpm install
pnpm build          # produces lib/index.js (Host) and lib/client.js (Client bundle)
```

Then install the package into the profile you run:

```bash
# The CLI forwards its arguments to pnpm inside the profile directory.
dsh plugin --profile desktop add file:/absolute/path/to/dsh-session-flags

# or, for a clean isolated profile:
dsh plugin --profile flags-dev add file:/absolute/path/to/dsh-session-flags
```

Restart the Harness (or let the plugin manager reload the profile) and open the **Plugins** page — the bundle and its `dsh-session-flags` row should be enabled. The profile patch layer (`cordis.patch.yml`) is applied automatically by the package's `dsh.bundle.patch` field.

### From a tarball

```bash
pnpm build
pnpm pack            # dsh-session-flags-0.1.0.tgz (lib/ is included via "files")
dsh plugin --profile desktop add /absolute/path/dsh-session-flags-0.1.0.tgz
```

## Usage

| Where | What it does |
| --- | --- |
| Session row, leading seat | Shows the flag color while the row is idle (status dots win while a session needs attention). |
| Session row, hover strip | Flag button → opens the **Set session flag** dialog. |
| Session “…” menu → **Set flag** | Same dialog, reachable without hovering. |
| Session hover card | Colored dot + the color's current name. |
| Dialog → **Manage flag colors** | Rename each of the 8 colors; blank a name to fall back to the localized default. |

Choosing “No flag” clears the flag. Names and flags are saved as soon as you confirm; the dialog reports a failure instead of closing when the Host rejects a write.

## How it works

```
src/
  shared/         palette + wire protocol shared by both halves
  host/           Cordis plugin: owns flags.json, registers exact Fetch routes
  client/         Cordis plugin: locale copy, styles, slot contributions, dialogs
  index.ts        re-exports the Host entry
  client/index.ts Client bundle entry (ModuleLoader factory)
```

**Host half** (`name`/`inject`/`apply`). It needs only `ctx.connection` and registers three exact Fetch routes below `/api/dsh-session-flags` (`state`, `set-flag`, `color-names`) with `ctx.connection.fetch.register`. Each response is the Connection convention `{ ok: true, value }` or `{ ok: false, error: { code, message } }`. The document is persisted atomically (write temp file + rename) and mutations are serialized, so concurrent UI actions cannot lose a write.

**Client half.** It registers a locale namespace, one `<style data-plugin-css>` element, and five slot contributions:

| Slot | Entry |
| --- | --- |
| `sidebar.session.row.leading` | `FlagMark` — colored glyph in the leading seat |
| `sidebar.session.row.hover` | `FlagHoverTag` — dot + name in the hover card |
| `sidebar.workspaces.session.row.action` | `FlagRowAction` — flag button in the hover strip |
| `sidebar.workspaces.session.menu.item` | `FlagMenuItem` — “Set flag” menu row |
| `shell.overlay` | `FlagDialog` — picker + color-name manager |

All five are registered through `ctx.slots.inject`, so they appear when the owning slot declares itself and are disposed with the plugin. State flows through two observable sources (`FlagsStore`, `DialogStore`) handed to the framework as `hooks`, which yields typed `useFlags(selector)` / `useDialog(selector)` hooks in every seat — no cross-slot imports.

**Why the Host owns storage.** The Desktop host boots `dsh` with `--port 0`, so the GUI gets a different loopback origin on every launch; a browser `localStorage` document would be per-launch. A JSON file under the DSH home is stable across launches, windows, and Web/TUI clients.

**Styles** are plain CSS injected as `<style data-plugin="dsh-session-flags" data-plugin-css="dsh-session-flags/flag.css">`, with all chrome reading `--dsw-*` theme tokens (the same mechanism official client packages use) instead of adding a CSS runtime dependency. Flag colors are the one exception: they are user data and are painted from the persisted hex.

## Develop

```bash
pnpm install
pnpm typecheck     # tsc --noEmit (strict, noUncheckedIndexedAccess)
pnpm test          # vitest: palette, Host store, Client store, dialog store, SSR seats
pnpm build         # tsdown: lib/index.js (ESM, Host) + lib/client.js (CJS ModuleLoader)
pnpm dev           # tsdown --watch
```

The Client bundle is a CommonJS ModuleLoader factory (`window.__ModuleLoader__.load({ id, factory })`) with `react`, `react/jsx-runtime`, and `@deepseek-ai/*` left external for the running Harness to resolve — the same shape official client packages and other third-party plugins use. `dsh.client.inject` lists the client services/packages the bundle expects loaded first.

Compatibility target: official packages pinned at `0.2.1-rc.2` as dev dependencies for types; the only runtime peer is `@deepseek-ai/cordis ~4.0.5`. The plugin degrades quietly (no marks, no dialog) when a slot or service is missing rather than patching the host or the application.

## Data location

`$DSH_HOME/session-flags/flags.json` (`$DSH_HOME` defaults to `~/.dsh`). The Host resolves the directory through the Harness `dshHomePath` service. Document shape:

```json
{
  "version": 1,
  "flags": { "<session-id>": "red" },
  "colorNames": { "red": "重点项目" }
}
```

Unknown fields and invalid ids are dropped on load, so a partially corrupted file never blocks the feature.

## License

MIT
