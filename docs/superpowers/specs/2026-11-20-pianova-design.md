# Pianova — design

Date: 2026-11-20

## Intent

Pianova teaches someone who has never played piano, from zero, using a MIDI
keyboard connected to their computer. The learner follows a fixed path of
short lessons. Notes scroll down a "highway" onto an on-screen keyboard; the
app listens to what is played and gives immediate feedback. The feel is a
rhythm game; the substance is a structured beginner course.

The user asked for it to "look like Rocksmith+ piano". Decided: same genre and
mechanics (note highway, timing judgments, streaks, practice tools), but
Pianova's own visual identity — not a copy of that product's look.

## Goals

- A complete beginner can open the app, plug in a keyboard, and be guided
  lesson by lesson with no outside instruction.
- About 25 authored lessons in 6 units, each unlocked by passing the previous.
- Feedback is immediate and precise: right/wrong note, early/late timing.
- Works without a MIDI keyboard (computer keys) so it can be tried and tested.
- Adding or editing lessons requires only data changes, no engine code.

## Non-goals (v1)

- Reading sheet music / staff notation.
- Generated or adaptive practice (but see "Stats" — the data is recorded now).
- Accounts, cloud sync, multiplayer, mobile layout.
- Microphone / acoustic piano detection.
- Desktop wrapper (Tauri/Electron).
- Licensed songs. All built-in music is public domain or written for the app.

## Anti-goals

- Copying Rocksmith+ (or any product's) art, layout, colours, logo, or songs.
- Lessons that feel random or that test something not yet taught.
- Audible lag between key press and sound. If it feels laggy, it has failed.
- Punishing beginners: no fail-out mid-song, no lost progress.

## Constraints

- Web app, Chromium-based browser (Web MIDI). Linux/PipeWire is the primary
  test machine. Firefox/Safari support is not required.
- No backend and no network requests after the page loads (no CDN fonts,
  samples, or analytics). Served from localhost (`npm run dev` / a static
  build with `npm run preview`). Not a PWA; no service worker.
- Lessons must be playable on a 25-key keyboard: all lesson notes stay within
  C3–C5. Imported songs may use the full 88-key range.

## Approaches considered

1. **Authored curriculum (chosen).** Each lesson is a hand-written data file;
   one engine plays them all. Predictable, well-paced, can explain concepts.
   Does not react to individual weak spots.
2. **Generated drills.** Exercises generated from the learner's mistakes.
   Endless material, but random-feeling for a true beginner and cannot
   introduce concepts.
3. **Authored path + generated daily practice.** Best of both, ~40% more work,
   and only as good as the stats behind it.

The user picked 1. Per-note stats are recorded from day one so 3 can be added
later without rework.

## Decisions (builder's calls made during design, not user requirements)

- **Stack:** Vite + TypeScript, no UI framework. DOM for menus and lesson
  text, a single Canvas 2D for the highway and keyboard. Vitest for logic.
- **MIDI import:** `@tonejs/midi` for parsing `.mid` files.
- **Sound:** built-in Web Audio synth piano (no samples to download). Timing
  uses `AudioContext.currentTime` as the single clock.
- **Storage:** `localStorage`, one versioned JSON blob.

## Screens

1. **Path (home).** The 6 units as a vertical path of lesson nodes: locked,
   available, passed (1–3 stars). Shows MIDI device status. Entry points to
   Free Play and Settings.
2. **Lesson.** Runs a lesson's steps in order with a step indicator.
3. **Play.** The highway. Used by lesson steps and by Free Play.
4. **Results.** Accuracy %, stars, best streak, timing tendency (early/late),
   the notes missed most. Retry / Next.
5. **Free Play.** Import a `.mid` file or pick a built-in piece; choose hand(s),
   tempo, wait mode, loop section.
   Free Play runs are scored and show Results. Best score is saved for
   built-in pieces only; an imported file lasts for the session and is not
   stored. Free Play notes go into the stats log under the piece's id
   (`import` for imported files).
6. **Settings.** MIDI input device, latency offset (with a tap-to-calibrate
   helper), volume, note labels on/off.

Play screen sketch:

```
 Unit 2 · Lesson 3        streak 12        87%      ⏸
        \     ▮C         ▮E          /
         \       ▮D   ▮G           /
          \   ▮E          ▮C     /
   ───────────── hit line ─────────────
   █ █ ██ █ █ █ ██ █ █ █ ██ █ █ █ ██ █ █
     C  D  E  F  G  A  B  C   (labels + finger numbers)
```

- Perspective highway: notes are bars whose length is duration, lane is pitch.
- Right hand and left hand have distinct colours; finger number on each note.
- The visible key range zooms to what the current chart needs (min 2 octaves).
- Pressed keys light up; hits flash at the hit line; wrong keys flash red.

## Lesson model

A lesson is data: `id`, `unit`, `title`, `steps[]`. Step types:

- **explain** — text plus optional highlighted keys / hand diagram. Continue
  button, or "press this key to continue" where it teaches something.
- **demo** — the chart plays itself with sound while the learner watches.
- **drill** — the chart in *wait mode*: the highway stops at each note until
  the correct key(s) are pressed. No timing score. Cannot fail.
- **perform** — scored; passing threshold per step (default 80% accuracy)
  unlocks the next lesson. Two judging modes, set per step:
  - `pitch` — untimed. The highway waits like a drill, but wrong keys cost
    score. Used in Units 1–2, before rhythm has been taught.
  - `timed` — in time with a count-in and metronome. Used from Unit 3 on.

A **chart** is: tempo, time signature, and notes
`{ pitch, startBeat, durationBeats, hand: 'L'|'R', finger?: 1..5 }`.
Lesson charts are authored in a compact text form in the lesson files (the
builder chooses the exact notation) and compiled to this shape. Imported MIDI
converts to the same shape; hand is assigned by track when there are two
tracks, otherwise by a split at middle C.

## Curriculum outline (content is the builder's to write)

1. **Meet the keyboard** — black-key groups, finding C, D, E; middle C.
2. **Right hand, five fingers** — C position, finger numbers, steps and skips,
   first melodies (e.g. Hot Cross Buns, Mary Had a Little Lamb).
3. **Rhythm** — beat, quarter/half/whole notes, counting, rests.
4. **Left hand** — C position in the bass, mirror fingering, simple melodies.
5. **Hands together** — alternating hands, then held left notes under a
   right-hand melody, then simple two-hand pieces.
6. **Chords and first pieces** — C, F, G chords; Ode to Joy, Twinkle Twinkle,
   Jingle Bells, Frère Jacques with left-hand accompaniment.

Around 4 lessons per unit. Each lesson introduces one new thing.

## Judging

- Timing windows around a note's start, after applying the latency offset:
  perfect ±50 ms, good ±120 ms, otherwise miss. Wrong keys count as errors but
  do not consume a note.
- Chords: all notes must land within the window to count.
- Long notes (1.5 beats or more) must be held for 70% of their length in timed
  runs; letting go sooner caps that note at half credit and fades its tail.
- Sounds are scheduled ahead on the audio clock, and the highway and judging run
  on the time actually being heard (output delay included), so the latency
  offset only covers input delay.
- Accuracy = weighted hits / (total notes + wrong key presses), with perfect
  1.0 and good 0.7. In `pitch` mode every correct note counts 1.0. Wrong
  presses therefore lower the score without ever ending the run.
  Stars: 1 at pass threshold, 2 at 90%, 3 at 97%.
- Hand selection: when practising one hand, the other is auto-played and not
  judged.

## Practice tools (Play screen, available in drill/Free Play)

Tempo 50–100%, wait mode toggle, loop a section (bar range), hand selection,
restart. Perform steps in lessons run at authored tempo with tools locked,
except a "slow it down" retry at 75% that awards at most 1 star.

## Input and audio

- Web MIDI: auto-connect to the first input, hot-plug aware, device selectable
  in Settings. Note on/off and sustain pedal.
- Computer-keyboard fallback: covers the whole lesson range at once — the
  lower letter rows play C3–B3 and the upper rows play C4–C5 (with sharps),
  plus octave shift for Free Play. Always active. Every lesson must be
  passable with it; lesson chords are at most three notes. Some computer
  keyboards drop certain three-key combinations — a known limit, noted in
  Settings, not worked around.
- Synth: polyphonic, piano-like (decaying envelope, a few detuned partials),
  metronome click, distinct sound for demo/auto-played notes is not required.
- Audio starts on first user gesture (browser requirement); the Path screen's
  first click handles this.

## Stats (recorded now, used later)

Per judged note: lesson or piece id, pitch, hand, result, timing offset in ms,
timestamp. Stored capped (most recent ~5,000 events). Results screen reads
from the current run only.

## Structure

Independent modules with narrow interfaces, logic kept free of DOM so it can
be unit-tested:

- `input` (MIDI + keyboard → note events) · `audio` (synth, metronome, clock)
- `chart` (model, text notation compiler, MIDI import)
- `judge` (pure: chart + timed input events → judgments, score)
- `session` (drives a chart in demo/wait/timed mode)
- `render` (highway + keyboard canvas) · `ui` (screens)
- `curriculum` (lesson data) · `progress` (storage, unlocks, stats)

## Error handling

- No Web MIDI / permission denied: banner explaining it, keyboard fallback
  keeps working.
- Device unplugged mid-song: pause with a message; resume on reconnect.
- Bad `.mid` file: message, stay on Free Play.
- Corrupt or old saved data: migrate if possible, otherwise start fresh and
  keep the old blob under a backup key.

## Testing

- Unit tests: judge (windows, chords, wrong notes, latency offset), chart
  notation compiler, MIDI conversion, progress/unlock rules, storage migration.
- A check that every lesson compiles, stays within C3–C5, and has at least one
  perform step.
- Manual: full run of a lesson with computer keys in Chromium; with a real
  MIDI keyboard when one is connected.

## Left to the builder

Visual design (palette, typography, motion), exact lesson text and charts,
the chart text notation, synth voicing, file layout within the structure
above, and the keyboard-fallback key mapping.
