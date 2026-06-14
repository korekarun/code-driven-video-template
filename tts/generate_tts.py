"""
generate_tts.py — synthesize all narration in a script and write audio + timings.

It reads a script HTML file (see scripts/sample_script.html), extracts the
`<p data-narration>` text from every `<section data-slide="N">`, and for each
slide writes:
    remotion/public/<theme>/sNN.wav
    remotion/public/<theme>/sNN_timings.json

The theme name and voice come from the `<script id="meta">` JSON block in the
script (the voice can be overridden with --voice).

Usage:
    python tts/generate_tts.py scripts/sample_script.html
    python tts/generate_tts.py scripts/sample_script.html --voice ja-JP-NanamiNeural

Requires AZURE_SPEECH_KEY / AZURE_SPEECH_REGION in the environment (see .env.example).
"""

import argparse
import json
import re
import sys
from pathlib import Path

# Allow running from anywhere; import the engine from this folder.
sys.path.insert(0, str(Path(__file__).resolve().parent))
from synth_with_timing import synthesize_with_timing, build_timing_json  # noqa: E402

REPO_ROOT = Path(__file__).resolve().parents[1]
PUBLIC_ROOT = REPO_ROOT / "remotion" / "public"

_TAG_RE = re.compile(r"<[^>]+>")
_META_RE = re.compile(r'<script[^>]*id=["\']meta["\'][^>]*>(.*?)</script>', re.DOTALL | re.IGNORECASE)
_SECTION_RE = re.compile(r"<section\b([^>]*)>(.*?)</section>", re.DOTALL | re.IGNORECASE)
_SLIDE_ATTR_RE = re.compile(r'data-slide=["\'](\d+)["\']')
_NARR_RE = re.compile(r"<p\b[^>]*\bdata-narration\b[^>]*>(.*?)</p>", re.DOTALL | re.IGNORECASE)


def _strip_tags(s: str) -> str:
    return re.sub(r"\s+", " ", _TAG_RE.sub("", s)).strip()


def parse_script(html_text: str) -> tuple[dict, list[tuple[int, str]]]:
    """Return (meta_dict, [(slide_number, narration_text), ...])."""
    meta = {}
    m = _META_RE.search(html_text)
    if m:
        try:
            meta = json.loads(m.group(1).strip())
        except json.JSONDecodeError as e:
            print(f"[WARN] could not parse <script id=meta> JSON: {e}")

    slides: list[tuple[int, str]] = []
    for attrs, body in _SECTION_RE.findall(html_text):
        slide_m = _SLIDE_ATTR_RE.search(attrs)
        if not slide_m:
            continue
        narrations = [_strip_tags(x) for x in _NARR_RE.findall(body)]
        narrations = [n for n in narrations if n]
        if not narrations:
            continue
        slides.append((int(slide_m.group(1)), "\n".join(narrations)))

    slides.sort(key=lambda x: x[0])
    return meta, slides


def main():
    parser = argparse.ArgumentParser(description="Synthesize all narration in a script HTML file.")
    parser.add_argument("script", help="path to the script .html file")
    parser.add_argument("--voice", default=None, help="override the Azure voice from the script meta")
    parser.add_argument("--theme", default=None, help="override the output theme/folder name")
    args = parser.parse_args()

    script_path = Path(args.script)
    if not script_path.exists():
        sys.exit(f"[ERROR] script not found: {script_path}")

    meta, slides = parse_script(script_path.read_text(encoding="utf-8"))
    theme = args.theme or meta.get("theme")
    voice = args.voice or meta.get("voice") or "en-US-AndrewMultilingualNeural"
    if not theme:
        sys.exit("[ERROR] no theme found (set it in the script meta or pass --theme).")
    if not slides:
        sys.exit("[ERROR] no <section data-slide> with <p data-narration> found in the script.")

    out_dir = PUBLIC_ROOT / theme
    out_dir.mkdir(parents=True, exist_ok=True)

    print(f"[gen] theme={theme}  voice={voice}  slides={len(slides)}  -> {out_dir}")
    durations = {}
    for num, text in slides:
        slide_id = f"s{num:02d}"
        print(f"[TTS] {slide_id} ({len(text)} chars) ...", end=" ", flush=True)
        try:
            audio_bytes, words = synthesize_with_timing(text, voice)
            (out_dir / f"{slide_id}.wav").write_bytes(audio_bytes)
            timing = build_timing_json(slide_id, audio_bytes, words)
            (out_dir / f"{slide_id}_timings.json").write_text(
                json.dumps(timing, ensure_ascii=False, indent=2), encoding="utf-8"
            )
            durations[num] = timing["total_frames"]
            print(f"{timing['total_frames']} frames ({timing['total_duration_ms']}ms)")
        except Exception as e:  # keep going so one bad line doesn't abort the batch
            print(f"[ERROR] {e}")

    print("\n=== done ===")
    print("Suggested durationFrames for props.js (audio length + 30 frame tail):")
    for num in sorted(durations):
        print(f"  slide {num}: durationFrames: {durations[num] + 30},")


if __name__ == "__main__":
    main()
