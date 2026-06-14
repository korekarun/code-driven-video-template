# How the pipeline works

The template turns one script into one video in three stages: **script → audio →
render**. Each stage has a single, inspectable input and output.

```
┌──────────────────────────────┐
│ scripts/sample_script.html   │  You write this.
│  • <script id="meta">        │   - theme name, title, accent color, voice
│  • <section data-slide="N">  │   - one per slide
│     • <p data-narration>     │   - spoken text
│     • <script data-props>    │   - props for the scene (optional)
└──────────────┬───────────────┘
               │  python tts/generate_tts.py scripts/sample_script.html
               ▼
┌──────────────────────────────────────────────┐
│ remotion/public/<theme>/                      │  Generated (git-ignored).
│  • sNN.wav            48kHz/16bit/mono audio   │
│  • sNN_timings.json   per-word frame timings   │
└──────────────┬───────────────────────────────┘
               │  remotion/src/videos/<theme>/props.js  (scene list)
               │  remotion/src/videos/<theme>/index.jsx (timeline)
               ▼
┌──────────────────────────────┐
│ npx remotion render SampleDemo│  Remotion renders each scene as a <Sequence>,
│        out/sample_demo.mp4    │  overlays the audio, and encodes the MP4.
└──────────────────────────────┘
```

## Stage 1 — Script (`scripts/sample_script.html`)

A normal HTML file you can open in a browser. Two machine-readable parts matter:

- `<script type="application/json" id="meta">` — global metadata. `theme`
  decides the output folder name; `voice` picks the Azure voice.
- `<section data-slide="N">` — one slide. Its `<p data-narration>` text is what
  gets spoken (multiple paragraphs are joined with newlines). `data-scene` names
  the React component, and an optional `<script data-props>` carries its props.

## Stage 2 — Audio (`tts/`)

`generate_tts.py` parses the script, then for each slide calls
`synth_with_timing.py`, which:

1. Builds SSML, applying the optional pronunciation dictionary via `<sub alias>`.
2. Calls Azure Neural TTS, subscribing to **word-boundary** events.
3. Writes `sNN.wav` and `sNN_timings.json`. The timings map every word to a
   start/end **frame** (at 30 fps), so scenes can sync highlights to speech.

Credentials come from the environment (`AZURE_SPEECH_KEY`,
`AZURE_SPEECH_REGION`), loaded from `.env` automatically. They never touch the
code or the output files.

`sNN_timings.json` shape:

```json
{
  "slide_id": "s01",
  "audio_file": "s01.wav",
  "total_duration_ms": 7200,
  "total_frames": 216,
  "fps": 30,
  "words": [{ "text": "This", "offset_ms": 120, "duration_ms": 180,
              "frame_start": 4, "frame_end": 9 }]
}
```

## Stage 3 — Render (`remotion/`)

- `videos/<theme>/props.js` exports `meta` and an ordered `scenes` array. Each
  entry names a component, a section color (`prob`/`data`/`sol`), an audio file,
  a `durationFrames`, and the component's props.
- `videos/<theme>/index.jsx` places each scene on the timeline as a back-to-back
  `<Sequence>` and passes the audio in. Because durations are explicit, the video
  renders even before you run TTS (audio is simply absent).
- `Root.jsx` registers the full video (`SampleDemo`) plus one `dev-*` composition
  per scene for isolated previews.

Render or preview:

```bash
cd remotion
npx remotion studio                                   # interactive
npx remotion render SampleDemo out/sample_demo.mp4     # full video
npx remotion render SampleDemo out/x.mp4 --props='{"enableAudio": false}'  # silent
npx remotion still dev-BigNumber --frame=120 out/preview.png               # one frame
```

## Adding music (optional)

Remotion can mix BGM directly (add an `<Audio>` in the composition), or you can
post-process with ffmpeg:

```bash
ffmpeg -i out/sample_demo.mp4 -stream_loop -1 -i bgm.mp3 \
  -filter_complex "[1:a]volume=0.08[bgm];[0:a][bgm]amix=inputs=2:duration=first[a]" \
  -map 0:v -map "[a]" -c:v copy -c:a aac out/sample_demo_final.mp4
```
