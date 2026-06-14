// sample_demo — minimal end-to-end demo for the template.
//
// `meta`  : global metadata (title, accent color, voice, slide count).
// `scenes`: ordered list of scenes. Each entry picks a component from
//           src/scenes/, sets its section color, points at an (optional)
//           narration audio file, and passes the component's props.
//
// This file is normally generated from a script (see scripts/sample_script.html
// and tts/generate_tts.py), but it is plain JS you can also edit by hand.

export const meta = {
  theme: 'sample_demo',
  title: 'Code-Driven Video Template',
  accent: '#4dabf7',
  totalSlides: 5,
  // Any Azure Neural voice name. Used by tts/generate_tts.py.
  // Japanese example: 'ja-JP-NanamiNeural'
  voice: 'en-US-AndrewMultilingualNeural',
};

// Helper: audio path for slide N, relative to remotion/public/
const A = (n) => `sample_demo/s${String(n).padStart(2, '0')}.wav`;

export const scenes = [
  // ── S01: Title ────────────────────────────────────────────────────────────
  {
    component: 'TitleCinematic',
    slideNum: 1,
    sectionType: 'prob',
    audioFile: A(1),
    durationFrames: 360,
    props: {
      titleLines: ['CODE-DRIVEN', 'VIDEO TEMPLATE'],
      subtitle: 'Turn a script into a narrated video with one command.',
      badgeText: 'Open-source Remotion + TTS harness',
      accent: '#4dabf7',
      topics: [
        { num: '01', label: 'Write a script' },
        { num: '02', label: 'Synthesize voice' },
        { num: '03', label: 'Compose scenes' },
        { num: '04', label: 'Render video' },
      ],
      paperTitle: 'github.com/your-name/your-repo',
    },
  },

  // ── S02: Chapter transition ────────────────────────────────────────────────
  {
    component: 'ChapterTransition',
    slideNum: 2,
    sectionType: 'data',
    audioFile: A(2),
    durationFrames: 240,
    props: {
      fromChapter: { number: '00', title: 'Intro' },
      toChapter: {
        number: '01',
        title: 'How it works',
        previewHeader: 'Three moving parts',
        previewItems: ['Script (HTML)', 'Voice (Azure TTS)', 'Render (Remotion)'],
      },
      totalChapters: 3,
      currentChapterIndex: 1,
    },
  },

  // ── S03: Big number ────────────────────────────────────────────────────────
  {
    component: 'BigNumberLiving',
    slideNum: 3,
    sectionType: 'data',
    audioFile: A(3),
    durationFrames: 330,
    props: {
      number: '3',
      unit: 'steps',
      label: 'From script to video',
      ringFraction: 0.75,
      triggerFrame: 50,
      segments: [
        { t: 'Just ', hl: false },
        { t: 'three', hl: true, fs: 8 },
        { t: ' steps turn plain text into a finished, narrated video.', hl: false },
      ],
      chips: [
        { cv: 'Script', cl: 'a single HTML file' },
        { cv: 'Voice', cl: 'word-level timing' },
        { cv: 'Render', cl: '1920×1080 MP4' },
      ],
      paperTitle: 'MIT licensed',
    },
  },

  // ── S04: Concept chain ─────────────────────────────────────────────────────
  {
    component: 'ConceptDrawing',
    slideNum: 4,
    sectionType: 'data',
    audioFile: A(4),
    durationFrames: 420,
    props: {
      sectionLabel: 'The pipeline',
      keyMechanism: 'Text becomes audio, audio becomes timed scenes, scenes become video',
      nodes: [
        { stepNum: '01', lines: ['Script', '(HTML)'], subtitle: 'narration + props', triggerFrame: 50 },
        { stepNum: '02', lines: ['Azure', 'TTS'], subtitle: 'wav + word timings', triggerFrame: 100 },
        { stepNum: '03', lines: ['Compose', 'scenes'], subtitle: 'props.js + index.jsx', triggerFrame: 150 },
        { stepNum: '04', lines: ['Remotion', 'render'], subtitle: 'final MP4', triggerFrame: 200 },
      ],
      paperTitle: 'pipeline overview',
    },
  },

  // ── S05: Key points ────────────────────────────────────────────────────────
  {
    component: 'KeyPointList',
    slideNum: 5,
    sectionType: 'sol',
    audioFile: A(5),
    durationFrames: 360,
    props: {
      sectionLabel: 'Why use this template',
      keyMessage: 'Clone it, add your key, ship a video',
      bgNumber: '05',
      items: [
        { number: '01', icon: 'Zap', heading: 'Open source', detail: 'MIT licensed, no lock-in', triggerFrame: 55 },
        { number: '02', icon: 'Battery', heading: 'Bring your own key', detail: 'Your Azure account, your bill', triggerFrame: 95 },
        { number: '03', icon: 'Activity', heading: 'Fully customizable', detail: 'Every scene is plain React', triggerFrame: 135 },
      ],
    },
  },
];
