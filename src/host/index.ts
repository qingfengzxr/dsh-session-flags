import { homedir } from 'node:os'
import { join } from 'node:path'
import type { Context } from '@deepseek-ai/cordis'
// Type-only import: augments the Cordis Context with `ctx.connection`.
import type {} from '@deepseek-ai/dsh-client-connection'
import { createFlagRoutes } from './routes'
import { FlagsStore } from './store'

/** Cordis plugin name; must stay identical to the package name and patch id. */
export const name = 'dsh-session-flags'

/** The Host half only needs the Connection service (it owns the API carrier). */
export const inject: string[] = ['connection']

/** Segments below the DSH home that hold this plugin's data. */
const FLAGS_FILE_SEGMENTS = ['session-flags', 'flags.json'] as const

type HomePathResolver = (...segments: string[]) => string

/**
 * Resolve the JSON document path.
 *
 * The Harness provides `dshHomePath` as a Host service (`ctx.get('dshHomePath')`)
 * whose call signature is `(...segments) => string`. That service is the source
 * of truth (it honors a configured home); the `DSH_HOME`/`~/.dsh` fallback
 * keeps the plugin working if the service is unavailable.
 */
function resolveFlagsFile(ctx: Context): string {
  const service = ctx.get('dshHomePath') as unknown
  if (typeof service === 'function') {
    try {
      const resolved = (service as HomePathResolver)(...FLAGS_FILE_SEGMENTS)
      if (typeof resolved === 'string' && resolved !== '') return resolved
    } catch {
      // Fall through to the environment-based path below.
    }
  }
  const configured = process.env.DSH_HOME
  const home = configured !== undefined && configured.trim() !== '' ? configured : join(homedir(), '.dsh')
  return join(home, ...FLAGS_FILE_SEGMENTS)
}

/**
 * Host half: own the flag document and expose it to the Client half as exact
 * Fetch routes on the shared API channel.
 *
 * @param ctx - Host plugin context (already has `ctx.connection` injected).
 */
export function apply(ctx: Context): void {
  const store = new FlagsStore(resolveFlagsFile(ctx))

  ctx.effect(() => {
    const disposers = createFlagRoutes(store).map((route) => ctx.connection.fetch.register(route))
    return async () => {
      await Promise.all(disposers.map(async (dispose) => dispose()))
    }
  }, 'dsh-session-flags: api routes')
}
