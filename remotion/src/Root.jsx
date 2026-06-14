import './index.css';
import { Composition } from 'remotion';

// ── Scene patterns (reusable building blocks) ───────────────────────────────
import { TitleCinematic } from './scenes/TitleCinematic.jsx';
import { ChapterTransition } from './scenes/ChapterTransition.jsx';
import { BigNumberLiving } from './scenes/BigNumberLiving.jsx';
import { ConceptDrawing } from './scenes/ConceptDrawing.jsx';
import { KeyPointList } from './scenes/KeyPointList.jsx';

// ── The demo video (scenes connected into one timeline) ─────────────────────
import { VideoSampleDemo, sampleDemoMetadata } from './videos/sample_demo/index.jsx';

const FPS = 30;
const WIDTH = 1920;
const HEIGHT = 1080;

export const RemotionRoot = () => (
  <>
    {/* ── Full demo video ───────────────────────────────────────────────────
        Render:  npx remotion render SampleDemo out/sample_demo.mp4
        Preview without audio:
                 npx remotion render SampleDemo out/sample_demo.mp4 \
                   --props='{"enableAudio": false}'                                */}
    <Composition
      id="SampleDemo"
      component={VideoSampleDemo}
      fps={FPS}
      width={WIDTH}
      height={HEIGHT}
      durationInFrames={1710}
      defaultProps={{ enableAudio: true }}
      calculateMetadata={sampleDemoMetadata}
    />

    {/* ── Single-scene previews (handy while designing a new scene) ──────────
        Preview:  npx remotion studio  → pick a "dev-*" composition
        Still:    npx remotion still dev-BigNumber --frame=120 out/preview.png   */}
    <Composition id="dev-Title" component={TitleCinematic} fps={FPS} width={WIDTH} height={HEIGHT} durationInFrames={300} />
    <Composition id="dev-Chapter" component={ChapterTransition} fps={FPS} width={WIDTH} height={HEIGHT} durationInFrames={240} />
    <Composition id="dev-BigNumber" component={BigNumberLiving} fps={FPS} width={WIDTH} height={HEIGHT} durationInFrames={300} />
    <Composition id="dev-Concept" component={ConceptDrawing} fps={FPS} width={WIDTH} height={HEIGHT} durationInFrames={300} />
    <Composition id="dev-KeyPoints" component={KeyPointList} fps={FPS} width={WIDTH} height={HEIGHT} durationInFrames={300} />
  </>
);
