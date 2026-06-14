# Code-Driven Video Template

Generate narrated, data-style videos from a plain script — fully in code.

Write a short HTML script, run one command to synthesize the narration with
**Azure Neural TTS**, and render a 1920×1080 MP4 with **[Remotion](https://www.remotion.dev/)** (React).
The repo ships with a working 5-slide demo so you can produce a video the moment
you add your own API key.

> **Bring your own key.** Nothing here contains secrets. Narration is generated
> with *your* Azure Speech resource, billed to *your* account.

---

## What's in the box

```
oss-template/
├── tts/                         # Python: text -> audio + word timings
│   ├── synth_with_timing.py     #   core Azure TTS engine
│   ├── generate_tts.py          #   CLI: read a script, synth every slide
│   └── pronunciation_dict.sample.yaml
├── remotion/                    # React/Remotion video project
│   ├── src/
│   │   ├── Root.jsx             #   registers the demo + per-scene previews
│   │   ├── brand.js             #   your channel/brand name  <-- edit this
│   │   ├── theme.js / fonts.js  #   colors + fonts
│   │   ├── primitives/          #   shared UI building blocks
│   │   ├── scenes/              #   5 reusable scene components
│   │   └── videos/sample_demo/  #   props.js (scene list) + index.jsx (timeline)
│   └── public/sample_demo/      #   generated audio lands here (git-ignored)
├── scripts/sample_script.html   # the demo script (open it in a browser)
├── docs/                        # pipeline.md, add_new_scene.md
├── .env.example                 # copy to .env, add your key
├── requirements.txt             # Python deps
└── LICENSE                      # MIT
```

## Requirements

- **Node.js** 18+ (for Remotion) and **Python** 3.10+
- An **Azure Speech** resource (free tier works) — see below
- `ffmpeg` is bundled with Remotion; no separate install needed for basic rendering

## Setup

```bash
# 1. Clone, then install dependencies
cd remotion && npm install && cd ..
pip install -r requirements.txt

# 2. Add your Azure key
cp .env.example .env
#   then edit .env and set AZURE_SPEECH_KEY (+ AZURE_SPEECH_REGION)
```

### Getting an Azure Speech key

1. Sign in to the [Azure Portal](https://portal.azure.com).
2. **Create a resource → "Speech"** (the free `F0` tier is enough to start).
3. Open the resource → **Keys and Endpoint**.
4. Copy **KEY 1** into `AZURE_SPEECH_KEY` and the **Region** (e.g. `eastus`)
   into `AZURE_SPEECH_REGION` in your `.env`.

## Run the demo

```bash
# 1. Synthesize narration for every slide in the script
python tts/generate_tts.py scripts/sample_script.html
#    -> writes remotion/public/sample_demo/s01.wav, s01_timings.json, ...

# 2. Render the video
cd remotion
npx remotion render SampleDemo out/sample_demo.mp4
```

Prefer to preview interactively?

```bash
cd remotion
npx remotion studio          # open the demo + each scene in the browser
```

**No key yet?** You can still render the visuals (silent):

```bash
cd remotion
npx remotion render SampleDemo out/sample_demo.mp4 --props='{"enableAudio": false}'
```

## Customize

- **Brand name** in the header: edit `remotion/src/brand.js`.
- **Accent colors / section colors**: `remotion/src/theme.js` and
  `remotion/src/primitives/theme.js`.
- **Voice**: set `"voice"` in the script's `<script id="meta">` block, or pass
  `--voice ja-JP-NanamiNeural` to `generate_tts.py`. Any
  [Azure Neural voice](https://learn.microsoft.com/azure/ai-services/speech-service/language-support)
  works — including Japanese (the harness fully supports Japanese fonts/text).
- **Your own video**: copy `scripts/sample_script.html`, edit the narration and
  slides, then mirror them in a new `remotion/src/videos/<theme>/` folder
  (`props.js` + `index.jsx`) and register it in `Root.jsx`. See
  [`docs/add_new_scene.md`](docs/add_new_scene.md).
- **Pronunciation fixes**: copy `tts/pronunciation_dict.sample.yaml` to
  `tts/pronunciation_dict.yaml` and add `term: reading` pairs.

## How it works

```
scripts/sample_script.html         (narration text + scene props)
        │  python tts/generate_tts.py
        ▼
remotion/public/<theme>/sNN.wav  +  sNN_timings.json   (audio + per-word frames)
        │  remotion/src/videos/<theme>/props.js + index.jsx
        ▼
npx remotion render SampleDemo  ──►  out/sample_demo.mp4
```

Full details in [`docs/pipeline.md`](docs/pipeline.md).

## License

[MIT](LICENSE).

---

## 日本語（概要）

スクリプト（HTML）から、**ナレーション付きのデータ系動画**をコードだけで生成する
テンプレートです。**Azure Neural TTS** で音声を合成し、**Remotion**（React）で
1920×1080 の MP4 をレンダリングします。動くデモ（5スライド）が同梱されているので、
**自分の Azure キーを `.env` に入れるだけ**で動画を1本出力できます。

- **秘密情報は一切含まれません。** 音声合成はあなたの Azure リソースで行われます。
- **セットアップ**: `cd remotion && npm install` →
  `pip install -r requirements.txt` → `.env.example` を `.env` にコピーして
  `AZURE_SPEECH_KEY` を設定。
- **実行**:
  `python tts/generate_tts.py scripts/sample_script.html` で音声生成 →
  `cd remotion && npx remotion render SampleDemo out/sample_demo.mp4`。
- **キーがまだ無い場合**: `--props='{"enableAudio": false}'` を付ければ無音で
  映像だけ確認できます。
- **ブランド名**は `remotion/src/brand.js`、**色**は `remotion/src/theme.js`、
  **声**は台本の `meta` か `--voice`（日本語の声・フォントも完全対応）。
- 仕組みの詳細は [`docs/pipeline.md`](docs/pipeline.md)、新シーン追加は
  [`docs/add_new_scene.md`](docs/add_new_scene.md) を参照してください。
