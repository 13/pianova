# Pianova

Learn piano in the browser: a falling-note highway, a lesson path from first notes to two hands, free play with your own MIDI files, and practice tools (slow tempo, wait mode, loops, one hand at a time).

**Play it:** https://13.github.io/pianova/

Plays with a MIDI keyboard (Chrome / Edge, via Web MIDI) or with the computer keyboard.

## Develop

```sh
npm install
npm run dev      # dev server
npm test         # unit tests
npm run build    # typecheck + production build into dist/
```

## Your own songs

Put Guitar Pro (`.gp`, `.gp3`, `.gp4`, `.gp5`, `.gpx`) or MIDI (`.mid`) files in `songs/` and they appear under **Songs**, with stars and levels saved like the built-in pieces. They are read when the app is built (the dev server picks up changes live), so the Guitar Pro reader never ships to the browser. Tracks are given to the hands as for an opened MIDI file: two piano tracks become right and left hand (by their names, e.g. "Right"/"Left" or "RH"/"LH"), other instruments play along, and dead notes are left out. A file that cannot be read is skipped with a warning.

`songs/` is git-ignored, so your files stay on your machine; a site built from it ships them, so only deploy such a build with songs you are allowed to publish.
