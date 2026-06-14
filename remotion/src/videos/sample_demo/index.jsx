// sample_demo — connects props.js to scenes and lays them out on the timeline.
//
// Each scene becomes a <Sequence> placed back-to-back. Durations come from
// `durationFrames` in props.js (so the video renders even before you run TTS).
// Pass inputProps {"enableAudio": false} to preview the layout without audio.

import { Sequence } from 'remotion';
import { TitleCinematic } from '../../scenes/TitleCinematic.jsx';
import { ChapterTransition } from '../../scenes/ChapterTransition.jsx';
import { BigNumberLiving } from '../../scenes/BigNumberLiving.jsx';
import { ConceptDrawing } from '../../scenes/ConceptDrawing.jsx';
import { KeyPointList } from '../../scenes/KeyPointList.jsx';
import { meta, scenes } from './props.js';

const SCENE_MAP = {
  TitleCinematic,
  ChapterTransition,
  BigNumberLiving,
  ConceptDrawing,
  KeyPointList,
};

const DEFAULT_DURATION = 300;

export const VideoSampleDemo = ({ enableAudio = true }) => {
  let cursor = 0;
  return (
    <>
      {scenes.map((scene, i) => {
        const Component = SCENE_MAP[scene.component];
        const dur = scene.durationFrames ?? DEFAULT_DURATION;
        const from = cursor;
        cursor += dur;
        return (
          <Sequence key={i} from={from} durationInFrames={dur}>
            <Component
              {...scene.props}
              slideNum={scene.slideNum}
              totalSlides={meta.totalSlides}
              sectionType={scene.sectionType}
              audioFile={enableAudio ? (scene.audioFile ?? null) : null}
            />
          </Sequence>
        );
      })}
    </>
  );
};

// Total timeline length = sum of all scene durations.
export const sampleDemoMetadata = async () => {
  const total = scenes.reduce((sum, s) => sum + (s.durationFrames ?? DEFAULT_DURATION), 0);
  return { durationInFrames: total };
};
