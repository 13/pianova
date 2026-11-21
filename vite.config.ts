import { execSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { defineConfig, type Plugin } from 'vite'

/**
 * A Content-Security-Policy for the built site. GitHub Pages cannot send headers, so it
 * goes in a meta tag. The app loads nothing from elsewhere and builds its UI from DOM
 * nodes, so everything can be locked to the site itself. Inline styles stay allowed:
 * a few elements set `style` attributes. Dev builds skip it (Vite's client needs more).
 */
const CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ')

const csp = (): Plugin => ({
  name: 'pianova-csp',
  apply: 'build',
  transformIndexHtml: () => [{ tag: 'meta', attrs: { 'http-equiv': 'Content-Security-Policy', content: CSP }, injectTo: 'head-prepend' }],
})

/** A git query's output, or null when there is no git (e.g. building from a source tarball). */
function git(args: string): string | null {
  try {
    return execSync(`git ${args}`, { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim()
  } catch {
    return null
  }
}

/** What Settings → About shows: stamped in when the app is built (or the dev server starts). */
const version: string = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')).version
const commit = git('rev-parse --short HEAD')
const dirty = commit !== null && git('status --porcelain') !== ''
const buildInfo = {
  __APP_VERSION__: JSON.stringify(version),
  __BUILD_DATE__: JSON.stringify(new Date().toISOString()),
  __COMMIT__: JSON.stringify(commit ? commit + (dirty ? '-dirty' : '') : 'unknown'),
  __REPO_URL__: JSON.stringify(repoUrl(git('remote get-url origin'))),
}

/** The origin remote as a web link (git@github.com:a/b.git → https://github.com/a/b), if it is one. */
function repoUrl(remote: string | null): string {
  const m = remote?.match(/^(?:git@|https:\/\/)([^:/]+)[:/](.+?)(?:\.git)?$/)
  return m ? `https://${m[1]}/${m[2]}` : ''
}

export default defineConfig({
  define: buildInfo,
  // Relative asset paths, so the build works from any sub-path (e.g. GitHub Pages at /pianova/).
  base: './',
  server: { port: 5173, strictPort: false },
  plugins: [csp()],
})
