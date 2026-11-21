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

export default defineConfig({
  // Relative asset paths, so the build works from any sub-path (e.g. GitHub Pages at /pianova/).
  base: './',
  server: { port: 5173, strictPort: false },
  plugins: [csp()],
})
