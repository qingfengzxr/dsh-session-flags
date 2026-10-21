import { defineConfig } from 'tsdown'

/**
 * Official packages and React are provided by the running host: they are kept
 * external so the loader resolves them from the host runtime. Everything the
 * plugin owns (none yet) is inlined into the bundle.
 */
const hostProvided = [
  'react',
  'react/jsx-runtime',
  'react-dom',
  'react-dom/client',
  /^@deepseek-ai\//,
  /^node:/,
]

const clientBanner =
  'window.__ModuleLoader__.load({id:"dsh-session-flags",factory:(require)=>{var module={exports:{}};var exports=module.exports;'

export default defineConfig([
  {
    entry: { index: 'src/index.ts' },
    outDir: 'lib',
    format: 'esm',
    platform: 'node',
    target: 'node22',
    external: hostProvided,
    outExtensions: () => ({ js: '.js' }),
    dts: true,
    sourcemap: false,
    clean: true,
  },
  {
    entry: { client: 'src/client/index.ts' },
    outDir: 'lib',
    format: 'cjs',
    platform: 'browser',
    target: 'es2022',
    external: hostProvided,
    outExtensions: () => ({ js: '.js' }),
    banner: { js: clientBanner },
    footer: { js: 'return module.exports;}});' },
    define: { 'process.env.NODE_ENV': '"production"' },
    minify: true,
    sourcemap: false,
    dts: true,
  },
])
