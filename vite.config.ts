import { defineConfig } from 'vite'

export default defineConfig({
  // Relative asset paths, so the build works from any sub-path (e.g. GitHub Pages at /pianova/).
  base: './',
  server: { port: 5173, strictPort: false },
})
