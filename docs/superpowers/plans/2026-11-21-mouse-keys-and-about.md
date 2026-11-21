# Mouse-Playable Keys & About Section — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** (1) The on-screen piano can be played by clicking/tapping keys, in every screen that shows the highway (lessons, play, jam). (2) Settings gets an "About" section with version, build date, commit and a few useful facts.

**Architecture:** Pointer input becomes a third `NoteSource` (`'pointer'`) fed into `InputHub`, so judging, hints, hand colours and sound work unchanged. Each renderer gains a `keyAt(x, y)` hit-test (the inverse of the existing `keyAnchor`). Build metadata is injected at build time with Vite `define`.

**Tech Stack:** unchanged (Vite, TypeScript strict, Vitest, three.js).

## Global Constraints

- Logic modules stay DOM-free; hit-testing maths that can be pure goes in a pure function with tests.
- Pointer listeners go on the **stage element**, not the canvas: `Highway3D` may swap in a pooled canvas (`glPool`), and `Highway.create2D` replaces the canvas after a WebGL failure.
- Clicked notes always sound, even when `soundsKeys` is false (a Piaggero is connected): the mouse makes no sound of its own.
- Bilingual strings via `t(en, de)` like the rest of settings.
- No network requests; CSP unchanged.

---

## File structure

```
src/input/pointer.ts        PointerKeys: pointer events on an element → note on/off (new)
src/input/hub.ts            NoteSource gains 'pointer'; attachPointer(el, keyAt) → detach fn
src/render/common.ts        HighwayRenderer.keyAt?(x, y): number | null
src/render/highway.ts       Highway.keyAt delegates to impl
src/render/highway2d.ts     keyAt: 2D rectangle hit-test (black keys first)
src/render/highway3d.ts     keyAt: raycast into key meshes
src/ui/app.ts               sound 'pointer' notes regardless of soundsKeys
src/ui/lesson.ts, play.ts, jam.ts   attach pointer to the stage, detach on destroy
src/ui/styles.css           .stage { touch-action: none; } cursor on keys
src/build-info.d.ts         declare __APP_VERSION__, __BUILD_DATE__, __COMMIT__ (new)
vite.config.ts              define the three constants
src/ui/settings.ts          "About" row
tests/pointer.test.ts       PointerKeys behaviour (new)
tests/keyAt2d.test.ts       pure 2D hit-test (new)
```

---

## Part A — Piano playable with the mouse

### Task A1: Pointer note source

**Files:** create `src/input/pointer.ts`, `tests/pointer.test.ts`; modify `src/input/hub.ts`.

`PointerKeys` takes an element, a `keyAt(x, y) => number | null` (CSS px relative to the element) and the hub's `NoteCallback`.

Behaviour:
- `pointerdown` (primary button or touch/pen) on a key → `setPointerCapture`, note on, remember `pointerId → pitch`.
- `pointermove` while down → if the key under the pointer changed, note off old, note on new (glissando by dragging). Off the keyboard → note off.
- `pointerup` / `pointercancel` / `lostpointercapture` → note off.
- Multiple pointers (multi-touch) each hold their own note — chords on a touchscreen.
- Velocity: by vertical position on the key (nearer the front = louder), clamped 0.45–0.95; fall back to 0.75 if the renderer gives no depth. Keep it simple: start with fixed 0.75, note it as a follow-up.
- `destroy()` releases every held note and removes listeners.
- `preventDefault` on `pointerdown` over a key only, so clicks elsewhere on the stage (overlays, buttons) still work.

Hub:
- [ ] `NoteSource = 'midi' | 'keys' | 'pointer'`.
- [ ] `attachPointer(el, keyAt): () => void` creates a `PointerKeys` wired through the existing `emitFrom('pointer')`, so the same "one key, one note" de-duplication applies across sources.
- [ ] Tests (fake element dispatching `PointerEvent`-like objects): down/up emits on/off; drag across keys emits off+on; two pointers hold two notes; destroy releases held notes; pressing a key already held on MIDI emits nothing extra (hub test).

Check existing source filters still do the right thing: `nav.ts:173` and `measure.ts:85` ignore non-MIDI — correct for pointer too.

### Task A2: `keyAt` in the 2D renderer

**Files:** modify `src/render/common.ts`, `src/render/highway2d.ts`; create `tests/keyAt2d.test.ts`.

- [ ] Add optional `keyAt?(x: number, y: number): number | null` to `HighwayRenderer`.
- [ ] Extract the hit-test as a pure function over the existing geometry (`keys[]`, `whiteW`, `keyH`, `hitY`): returns null above `hitY`; checks black keys first (they cover the upper ~62% of the key height, width `whiteW * 0.56`), then white keys. Verify the black-key height against what `drawKeys` actually paints (around `highway2d.ts:473`).
- [ ] Tests: centre of a white key, centre of a black key, the white key below a black key's bottom edge, gap/above keyboard → null, off either end → null.

### Task A3: `keyAt` in the 3D renderer

**Files:** modify `src/render/highway3d.ts`, `src/render/highway.ts`.

- [ ] Convert CSS px to NDC using `canvas.clientWidth/Height`, `raycaster.setFromCamera`, `intersectObjects(this.keyboard.children, true)`.
- [ ] Map hit mesh → pitch: store `mesh.userData.pitch = p` in `buildKeys` (`highway3d.ts:518`).
- [ ] First intersection wins (black keys sit higher, so they are hit first naturally). Ignore label meshes (no `userData.pitch` → keep walking intersections).
- [ ] `Highway.keyAt` delegates to `impl?.keyAt?.(x, y) ?? null` (null while the 3D renderer is still loading).
- [ ] No unit test (needs WebGL); verified in Task A5.

### Task A4: Wire it into the screens

**Files:** modify `src/ui/lesson.ts`, `src/ui/play.ts`, `src/ui/jam.ts`, `src/ui/app.ts`, `src/ui/styles.css`.

- [ ] In each screen, after `new Highway(canvas)`: `const offPointer = app.input.attachPointer(stageEl, (x, y) => highway.keyAt(x, y))`; call `offPointer()` in `destroy`. Coordinates: subtract `stageEl.getBoundingClientRect()` — the canvas fills the stage (`.stage-canvas { inset: 0 }`) so stage coords = canvas coords.
- [ ] `app.ts:176`: change the guard to `if (on && source !== 'pointer' && !this.soundsKeys) return`.
- [ ] `styles.css`: `.stage { touch-action: none; user-select: none; }` so touch dragging plays instead of scrolling; `cursor: pointer` is optional (would show over the whole highway — skip unless a cheap "over a key" class toggle on move is added).
- [ ] Make sure overlays on the stage (hand overlay, hints, pause card) don't swallow events meant for keys, and conversely that buttons on them still work (pointer handler only acts when `keyAt` returns a pitch).
- [ ] Free play's piece picker has no highway, so nothing to do there.

### Task A5: Verify in the browser

- [ ] `npm test`, `npm run typecheck`.
- [ ] `npm run dev`, open a lesson: click white and black keys (3D), drag across, confirm the key lights, sound plays, and the lesson accepts the note.
- [ ] Force the 2D renderer (no WebGL, e.g. Chrome with `--disable-gpu` or temporarily set `webgl = false`) and repeat.
- [ ] With the Piaggero connected and "Sound of your keys" on Automatic: clicked keys sound, Piaggero keys don't double.
- [ ] Settings → "Computer keys" text: add one sentence: "You can also click or tap the keys on screen."

---

## Part B — About section in Settings

### Task B1: Build metadata

**Files:** modify `vite.config.ts`; create `src/build-info.d.ts`.

- [ ] In `vite.config.ts`, read `version` from `package.json` (import with `with { type: 'json' }` or `readFileSync`), the short commit from `git rev-parse --short HEAD` (try/catch → `'unknown'`, e.g. building from a tarball), and `new Date().toISOString()`.
- [ ] `define: { __APP_VERSION__: JSON.stringify(v), __BUILD_DATE__: JSON.stringify(iso), __COMMIT__: JSON.stringify(sha) }`. In dev these reflect server start time — acceptable; label it as the build date anyway. Optionally append `-dirty` when `git status --porcelain` is non-empty.
- [ ] `src/build-info.d.ts`: `declare const __APP_VERSION__: string` etc.
- [ ] Vitest picks up `define` from `vite.config.ts`, so tests touching settings still compile.

### Task B2: About row

**Files:** modify `src/ui/settings.ts`.

Add a last `row(t('About', 'Über Pianova'), …)` with a small definition list:

| Field | Source |
|---|---|
| Version | `__APP_VERSION__` (e.g. "0.7.0") |
| Build date | `__BUILD_DATE__`, formatted with `Intl.DateTimeFormat(lang, { dateStyle: 'medium', timeStyle: 'short' })` |
| Commit | `__COMMIT__` |
| Renderer | "3D (WebGL)" / "2D" — expose a tiny `rendererKind()` from `render/highway.ts` based on `webglWorks()` |
| MIDI | "Available" / "Not supported in this browser" from `input.status.supported` |
| Audio | sample rate from the synth's `AudioContext` if exposed, else omit |
| Browser | `navigator.userAgent` trimmed, in a `<code>` with a "Copy" button that copies all of the above (handy for bug reports) |

Plus a one-line description ("Pianova teaches piano from your first note…") and, if the repo has a public URL, a link to it (CSP allows plain links). Leave out the link if unsure.

- [ ] Style with the existing `.setting` / `.muted` classes; add a `dl.about` rule (two-column grid) to `styles.css`.
- [ ] Test: none needed beyond typecheck; check visually in en and de.

### Task B3: Wrap-up

- [ ] `npm test && npm run build` succeeds; open the built `dist/` via `npm run preview`, confirm About shows the real version, date and commit.
- [ ] Commit per part: `feat: play the keys on screen with mouse or touch`, `feat: About in settings — version, build date, commit`.

---

## Decisions

1. **Velocity:** fixed (0.75) per click: predictable, no hidden gesture. Position-based velocity can come later.
2. **Where:** only screens that draw the keyboard (lessons, play, jam).
3. **Repo link:** derived from the `origin` remote at build time; hidden when there is none.
4. **Dragging back onto the keys** with the button still down plays again (pointer stays captured).
