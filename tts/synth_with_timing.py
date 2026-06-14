"""
synth_with_timing.py — core TTS engine.

Synthesizes narration with Azure Neural TTS and produces, for each line of text:
  - a 48kHz/16bit/mono WAV file
  - a JSON file with per-word timings (mapped to video frames)

Credentials are read from environment variables (never hard-code them):
    AZURE_SPEECH_KEY      your Azure Speech resource key
    AZURE_SPEECH_REGION   the resource region, e.g. "eastus" (default: "eastus")

This module exposes two functions used by generate_tts.py:
    synthesize_with_timing(text, voice, speed) -> (wav_bytes, word_boundaries)
    build_timing_json(slide_id, wav_bytes, words, fps) -> dict

You can also run it directly to test a single line:
    python tts/synth_with_timing.py --text "Hello world" --slide-id s01
"""

import argparse
import html
import json
import os
import re
import struct
import sys
import threading
from pathlib import Path

FPS = 30
DEFAULT_VOICE = "en-US-AndrewMultilingualNeural"
DEFAULT_TEXT = "This is a code-driven video template."
DEFAULT_SLIDE_ID = "s01"

# Output goes next to the Remotion project so the WAVs are servable as staticFile().
PUBLIC_DIR = Path(__file__).resolve().parents[1] / "remotion" / "public"


def _load_dotenv() -> None:
    """Minimal .env loader (no external dependency). Existing env vars win."""
    env_path = Path(__file__).resolve().parents[1] / ".env"
    if not env_path.exists():
        return
    for line in env_path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))


_load_dotenv()

# Optional pronunciation dictionary (term -> reading). Falls back to the bundled sample.
_DICT_CANDIDATES = [
    Path(__file__).resolve().parent / "pronunciation_dict.yaml",
    Path(__file__).resolve().parent / "pronunciation_dict.sample.yaml",
]
_PRON_DICT: dict | None = None


def _load_pron_dict() -> dict:
    """Load a simple `"term": "reading"` YAML-ish dictionary without a YAML dependency."""
    global _PRON_DICT
    if _PRON_DICT is None:
        _PRON_DICT = {}
        for dict_path in _DICT_CANDIDATES:
            if dict_path.exists():
                for line in dict_path.read_text(encoding="utf-8").splitlines():
                    line = line.strip()
                    if not line or line.startswith("#"):
                        continue
                    m = re.match(r'^"?([^":]+)"?\s*:\s*"(.+)"', line)
                    if m:
                        _PRON_DICT[m.group(1).strip()] = m.group(2).strip()
                break
    return _PRON_DICT


def _build_ssml(text: str, voice: str) -> str:
    """Build SSML, applying the pronunciation dictionary via <sub alias="...">."""
    d = _load_pron_dict()

    # Split text on dictionary keys so each replacement becomes a <sub> element.
    parts: list[str | tuple[str, str]] = [text]
    for key in sorted(d, key=len, reverse=True):
        new_parts: list[str | tuple[str, str]] = []
        for part in parts:
            if isinstance(part, str):
                chunks = part.split(key)
                for i, chunk in enumerate(chunks):
                    if chunk:
                        new_parts.append(chunk)
                    if i < len(chunks) - 1:
                        new_parts.append((key, d[key]))
            else:
                new_parts.append(part)
        parts = new_parts

    inner = ""
    for part in parts:
        if isinstance(part, str):
            inner += html.escape(part)
        else:
            orig, alias = part
            inner += f'<sub alias="{html.escape(alias)}">{html.escape(orig)}</sub>'

    lang = "ja-JP" if voice.startswith("ja-") else "en-US"
    return (
        '<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" '
        f'xmlns:mstts="http://www.w3.org/2001/mstts" xml:lang="{lang}">'
        f'<voice name="{voice}">{inner}</voice>'
        "</speak>"
    )


def ms_to_frame(ms: float, fps: int = FPS) -> int:
    return round(ms * fps / 1000)


def synthesize_with_timing(text: str, voice: str = DEFAULT_VOICE, speed_scale: float = 1.0) -> tuple[bytes, list[dict]]:
    """Return (wav_bytes, word_boundaries). `speed_scale` is reserved for future use."""
    import azure.cognitiveservices.speech as speechsdk

    key = os.environ.get("AZURE_SPEECH_KEY")
    region = os.environ.get("AZURE_SPEECH_REGION", "eastus")
    if not key:
        raise EnvironmentError(
            "AZURE_SPEECH_KEY is not set. Copy .env.example to .env and add your "
            "Azure Speech key, or export AZURE_SPEECH_KEY in your shell."
        )

    config = speechsdk.SpeechConfig(subscription=key, region=region)
    config.set_speech_synthesis_output_format(
        speechsdk.SpeechSynthesisOutputFormat.Riff48Khz16BitMonoPcm
    )
    synthesizer = speechsdk.SpeechSynthesizer(speech_config=config, audio_config=None)

    word_boundaries: list[dict] = []

    def on_word_boundary(evt):
        offset_ms = evt.audio_offset // 10_000  # 100ns ticks -> ms
        dur_ms = int(evt.duration.total_seconds() * 1000)
        word_boundaries.append({
            "text": evt.text,
            "offset_ms": int(offset_ms),
            "duration_ms": dur_ms,
        })

    synthesizer.synthesis_word_boundary.connect(on_word_boundary)

    # Wait for synthesis_completed so all word-boundary events have fired.
    done = threading.Event()
    synthesizer.synthesis_completed.connect(lambda _: done.set())
    ssml = _build_ssml(text, voice)
    result_future = synthesizer.speak_ssml_async(ssml)
    done.wait(timeout=60)
    result = result_future.get()

    if result.reason.name != "SynthesizingAudioCompleted":
        try:
            detail = speechsdk.SpeechSynthesisCancellationDetails.from_result(result)
            raise RuntimeError(f"TTS failed: reason={detail.reason} / code={detail.error_code} / {detail.error_details}")
        except AttributeError:
            raise RuntimeError(f"TTS failed: reason={result.reason}")

    return result.audio_data, word_boundaries


def _wav_duration_ms(audio_bytes: bytes) -> tuple[int, int]:
    """Return (byte_rate, data_size) by scanning the WAV chunks."""
    byte_rate = struct.unpack_from("<I", audio_bytes, 28)[0]
    i = 12
    while i + 8 <= len(audio_bytes):
        chunk_id = audio_bytes[i:i + 4]
        chunk_size = struct.unpack_from("<I", audio_bytes, i + 4)[0]
        if chunk_id == b"data":
            return byte_rate, chunk_size
        i += 8 + chunk_size
    data_size = struct.unpack_from("<I", audio_bytes, 40)[0]  # fallback: 44-byte header
    return byte_rate, data_size


def build_timing_json(slide_id: str, audio_bytes: bytes, words: list[dict], fps: int = FPS) -> dict:
    """Build the timing JSON consumed by the Remotion scenes."""
    byte_rate, data_size = _wav_duration_ms(audio_bytes)
    total_duration_ms = int(data_size / byte_rate * 1000)
    total_frames = ms_to_frame(total_duration_ms, fps)

    words_with_frames = [
        {
            **w,
            "frame_start": ms_to_frame(w["offset_ms"], fps),
            "frame_end": ms_to_frame(w["offset_ms"] + w["duration_ms"], fps),
        }
        for w in sorted(words, key=lambda x: x["offset_ms"])
    ]

    return {
        "slide_id": slide_id,
        "audio_file": f"{slide_id}.wav",
        "total_duration_ms": total_duration_ms,
        "total_frames": total_frames,
        "fps": fps,
        "words": words_with_frames,
    }


def main():
    parser = argparse.ArgumentParser(description="Synthesize one line of narration with word timings.")
    parser.add_argument("--text", default=DEFAULT_TEXT, help="text to speak")
    parser.add_argument("--slide-id", default=DEFAULT_SLIDE_ID, help="output file base name")
    parser.add_argument("--voice", default=DEFAULT_VOICE, help="Azure Neural voice name")
    parser.add_argument("--out-dir", default=str(PUBLIC_DIR), help="output directory")
    args = parser.parse_args()

    out_dir = Path(args.out_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    print(f"[TTS] voice={args.voice}")
    print(f"[TTS] text={args.text}")

    audio_bytes, words = synthesize_with_timing(args.text, args.voice)

    wav_path = out_dir / f"{args.slide_id}.wav"
    wav_path.write_bytes(audio_bytes)
    timing = build_timing_json(args.slide_id, audio_bytes, words)
    (out_dir / f"{args.slide_id}_timings.json").write_text(
        json.dumps(timing, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    print(f"[OK] {wav_path}  ({timing['total_frames']} frames @ {timing['fps']}fps)")


if __name__ == "__main__":
    main()
