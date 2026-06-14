# Adding a new scene or a new video

## The 5 bundled scenes

Each is a self-contained React component in `remotion/src/scenes/`, depending
only on `theme.js` (colors), `fonts.js`, and `brand.js`.

| Component          | Good for                                  | Key props |
|--------------------|-------------------------------------------|-----------|
| `TitleCinematic`   | Opening title card                        | `titleLines`, `subtitle`, `badgeText`, `topics[]` |
| `ChapterTransition`| Moving between sections                   | `fromChapter`, `toChapter{previewItems[]}` |
| `BigNumberLiving`  | One impactful number                      | `number`, `unit`, `label`, `chips[]`, `segments[]` |
| `ConceptDrawing`   | A cause/effect chain (up to 4 nodes)      | `nodes[]`, `keyMechanism`, `sectionLabel` |
| `KeyPointList`     | A checklist / summary                     | `items[]`, `keyMessage`, `sectionLabel` |

All scenes accept the common props injected by `index.jsx`: `slideNum`,
`totalSlides`, `sectionType` (`prob` red / `data` blue / `sol` green), and
`audioFile`.

## Write a brand-new scene

1. Copy the closest existing scene in `remotion/src/scenes/` to
   `MyScene.jsx` and rename the export:
   ```jsx
   export const MyScene = (props) => { /* ... */ };
   ```
2. Reuse shared pieces from `remotion/src/primitives/` (`Header`,
   `SectionLabel`, `Citation`, `GridBg`, `useFadeUp`, …) so it matches the look.
3. Register a preview composition in `Root.jsx`:
   ```jsx
   import { MyScene } from './scenes/MyScene.jsx';
   <Composition id="dev-MyScene" component={MyScene}
     fps={30} width={1920} height={1080} durationInFrames={300} />
   ```
4. Check a frame:
   ```bash
   cd remotion
   npx remotion still dev-MyScene --frame=120 out/myscene.png
   ```

## Build a new video

1. Write the script: copy `scripts/sample_script.html` to
   `scripts/<theme>.html`, set `"theme"` in the meta, and write one
   `<section data-slide="N">` per slide.
2. Synthesize narration:
   ```bash
   python tts/generate_tts.py scripts/<theme>.html
   ```
   Note the suggested `durationFrames` it prints for each slide.
3. Create `remotion/src/videos/<theme>/props.js` (copy the demo's) — list your
   scenes, set `audioFile` to `<theme>/sNN.wav`, and paste the durations.
4. Create `remotion/src/videos/<theme>/index.jsx` (copy the demo's) — import the
   scenes you use into `SCENE_MAP` and rename the exports.
5. Register it in `Root.jsx`:
   ```jsx
   import { VideoTheme, themeMetadata } from './videos/<theme>/index.jsx';
   <Composition id="MyTheme" component={VideoTheme}
     fps={30} width={1920} height={1080}
     durationInFrames={3000} calculateMetadata={themeMetadata} />
   ```
6. Render:
   ```bash
   cd remotion && npx remotion render MyTheme out/<theme>.mp4
   ```
