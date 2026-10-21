# Releasing and listing `dsh-session-flags`

This is the maintainer runbook for getting the plugin (1) installable by name,
(2) visible in the community marketplaces, and (3) discoverable from the Harness
plugin manager's market support. The code itself needs no build changes for any
of them: the package is already a valid DSH bundle (`dsh.bundle.patch`) with a
Host half and a Client bundle.

## 0. One-time prerequisites

- **npm account** that can publish the unscoped name `dsh-session-flags`.
  The name was free on `registry.npmjs.org` when this runbook was written
  (checked 2026-10); re-check with:
  `npm view dsh-session-flags --registry https://registry.npmjs.org/`
- **Public GitHub repository** (the curated catalog requires a public, real
  repo; it must be at least 1 day old when the listing PR's CI runs).
- Local `~/.npmrc` here points at a mirror (`registry=https://mirrors.tencent.com/npm/`),
  so every publish command below passes `--registry https://registry.npmjs.org/`
  explicitly. Publish only to the official registry.

## 1. Fill in the GitHub fields

After the repository exists, add these to `package.json` and keep them accurate:

```json
"repository": { "type": "git", "url": "git+https://github.com/<owner>/dsh-session-flags.git" },
"homepage": "https://github.com/<owner>/dsh-session-flags#readme",
"bugs": { "url": "https://github.com/<owner>/dsh-session-flags/issues" }
```

Also add the topic **`dsh-plugin`** to the GitHub repository — the curated
catalog checks for it.

## 2. Verify the package

```bash
pnpm install
pnpm typecheck
pnpm test
pnpm build
pnpm pack
tar -tzf dsh-session-flags-*.tgz | sort
```

The tarball must contain `lib/`, `cordis.patch.yml`, `icon.svg`, `locale/*.json`,
`README.md`, and `LICENSE`. `prepare` runs `pnpm build` during packing, so the
`lib/` in the tarball is always fresh.

Compatibility metadata lives in `package.json`:

- `engines.dsh` — the host range named installs are checked against
  (`>=0.2.0-rc.2` today). It alone decides the preflight result; if it is
  absent, the installer falls back to the `@deepseek-ai/dsh*`
  `peerDependencies` ranges.
- Keep `peerDependencies` limited to packages the host already supplies
  (`@deepseek-ai/cordis`, marked optional). Any `@deepseek-ai/dsh*` peer would
  also be treated as a compatibility requirement.
- Bump `version` for every publish; do not move a published version.

## 3. Publish to npm

```bash
npm login --registry https://registry.npmjs.org/
pnpm publish --no-git-checks --registry https://registry.npmjs.org/
```

`pnpm publish` runs `prepare` (build) and publishes the `files` whitelist.
Alternatively `npm publish --registry https://registry.npmjs.org/` works too.
Verify from a clean cache:

```bash
npm view dsh-session-flags version --registry https://registry.npmjs.org/
```

The mirror configured in `~/.npmrc` may lag a few minutes; the official registry
is the source of truth.

Once published, both of these work — the CLI preflight reads the registry
metadata (`engines.dsh`, then installs), and reconciling the profile appends the
new bundle to `dsh.profile.bundles` automatically, so no second "enable" step:

```bash
dsh plugin --profile web add dsh-session-flags          # web profile
dsh plugin --profile desktop add dsh-session-flags      # official desktop app profile
```

For a risk-free check before publishing, install the tarball instead
(`dsh plugin --profile flags-dev add /abs/path/dsh-session-flags-0.1.0.tgz`);
that exercises the same add + bundle-reconcile path but skips the registry
preflight.

Inside the GUI, **Plugins → Add plugin** accepts the same package name. Note that
this dialog installs the spec you type; it is not a keyword search over the
registry. Registry search belongs to the market UIs (next section).

## 4. List in the curated catalog (dsh-market)

The community market (`dshmarket`, already installed in this profile) does not
crawl npm: it reads the curated **awesome-dsh-plugin** registry
(`https://awesome-dsh-plugin.com/plugins.json` and the `dsh-plugin-catalog`
npm index generated from it). Submitting a plugin is one pull request against
[`awesome-dsh-plugin/awesome-dsh-plugin`](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin)
that adds exactly one file, `data/plugins/<owner>__<repo>.yml`:

```yaml
url: https://github.com/<owner>/dsh-session-flags
name: <owner>/dsh-session-flags
category: session
description:
  en: Color-coded, user-named flags for DSH session lists, with a searchable flagged-sessions panel; flags persist on the Host.
  zh: 为 DSH 会话列表提供可命名颜色的彩色旗标，并附带可搜索的旗标会话面板；旗标数据保存在宿主端 DSH 目录下。
```

Rules that matter for this plugin:

- `category` must be one of the catalog's ids; `session` (Sessions & Messages)
  is the closest fit (`ui` would also be defensible).
- `description.en` is a single line ending with a period; keep `zh` optional but
  accurate.
- The catalog rejects packages whose `package.json` declares only `dsh.client`
  without `dsh.bundle` — ours declares `dsh.bundle.patch`, so it passes.
- One PR may add at most three entries; the repo must be ≥ 1 day old.
- Optional `tarball:` for repos whose releases build a version-free
  `*.tgz` asset; not needed here because the prebuilt npm package installs
  without the build-script approval prompt.

After the PR merges, the site and the market app pick the entry up from the
registry automatically (usually within a day). In the market's search box,
`dsh-session-flags` then finds the card; one-click install runs the same
`dsh plugin add` path.

## 5. Optional: the official Discover tab

The official app ships no market. Its optional bundle
`@deepseek-ai/dsh-experimental-plugin-market-bundle` (0.2.1-rc.2) mounts the
`pluginMarket` service plus the plugin page's **Discover** tab:

1. `dsh plugin --profile desktop add @deepseek-ai/dsh-experimental-plugin-market-bundle`
   (or **Plugins → More → Experimental plugins → Custom plugin markets**).
2. Open **Plugins → Discover** and add a market index source, e.g. the community
   catalog index `https://cdn.jsdelivr.net/npm/dsh-plugin-catalog/index.json`.
3. Search `dsh-session-flags`; compatibility is computed per version from the
   package's `engines.dsh`/peers, and install targets exactly that version.

There are no default sources and no official market; listing anywhere in
Discover requires the user to add an index. Supporting the experimental bundle
is optional — the curated market and the CLI path do not depend on it.

## 6. After a release

- Keep `engines.dsh` in sync when the Harness moves: a named install is refused
  before download when the range does not match, and an already-installed
  incompatible bundle is reported by boot with the same reason. The
  `dsh plugin version-exemptions` / `allow-version` path exists for users who
  accept the risk, but a released plugin should not need it.
- `npm dist-tag add dsh-session-flags@<version> latest` if a prerelease was
  published first; plain `add dsh-session-flags` resolves the `latest` tag.
- Local-path installs (`file:`) are snapshots; users who install that way must
  reinstall after rebuilding. npm and market installs do not have this issue.
