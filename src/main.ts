import './ui/styles.css'
import { App } from './ui/app'
import { preloadHighway3D } from './render/highway'

const app = new App(document.getElementById('app')!)
// A handle for poking at the app from the console and browser tests; dev builds only.
if (import.meta.env.DEV) (window as unknown as { pianova: App }).pianova = app
// Fetch the 3D renderer while the welcome screen is up, so the first lesson does not wait.
void preloadHighway3D()
