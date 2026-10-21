/**
 * Host (Node) entry of the plugin.
 *
 * Nothing but the Cordis plugin surface is exported here, matching the official
 * package layout: the loader reads `name`/`inject` from the module namespace and
 * calls `apply` with the Host context.
 */
export { apply, inject, name } from './host/index'
