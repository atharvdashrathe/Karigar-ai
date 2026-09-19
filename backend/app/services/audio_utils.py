"""
Audio decoding, shared by the speech service.

Ported and generalized from experiments/indic_conformer.py's WAV-only decode
logic. The original only handled raw 16-bit PCM WAV via Python's `wave`
module; this version shells out to ffmpeg instead, so it also handles the
compressed formats a real phone's voice recorder actually produces (m4a/aac,
mp3, ogg/opus, webm) — confirmed against the repo's own sample files, one of
which (`product_description.wav.m4a`) is actually an AAC-in-MP4 container
despite its `.wav` name.

No ML framework dependency here (no torch/numpy audio libs) — just ffmpeg (a
system binary) and the standard library, so this stays testable and usable
even in environments where the heavier ASR dependencies aren't installed.
"""
from __future__ import annotations

import subprocess
import tempfile
from pathlib import Path

import numpy as np

TARGET_SAMPLE_RATE = 16_000
MIN_AUDIO_SECONDS = 0.3
MAX_AUDIO_SECONDS = 180.0  # generous ceiling; a hackathon voice note is seconds, not minutes


class AudioDecodeError(Exception):
    """Raised when the uploaded audio can't be decoded — always caught and
    turned into a friendly, specific message at the API layer (Section 19)."""


def decode_audio_to_mono_16k(raw_bytes: bytes) -> tuple[np.ndarray, float]:
    """
    Decodes arbitrary audio bytes (wav/m4a/mp3/ogg/webm/...) to a mono,
    16kHz, float32 numpy array in [-1, 1], using ffmpeg for format detection
    and resampling rather than trusting the upload's declared content-type.

    Returns (samples, duration_seconds).

    The input is written to a temp file rather than piped via stdin: MP4/M4A
    containers store their index (moov atom) at the end of the file for
    non-"faststart" recordings, which requires ffmpeg to seek backward while
    demuxing — impossible on a stdin pipe. This was found by testing against
    the repo's own sample audio (an M4A that failed via pipe, decoded fine
    from a temp file), not discovered from documentation.
    """
    if not raw_bytes:
        raise AudioDecodeError("The audio file is empty.")

    with tempfile.TemporaryDirectory() as tmp_dir:
        input_path = Path(tmp_dir) / "input_audio"
        input_path.write_bytes(raw_bytes)

        try:
            proc = subprocess.run(
                [
                    "ffmpeg",
                    "-hide_banner", "-loglevel", "error",
                    "-i", str(input_path),
                    "-f", "f32le",       # raw 32-bit float PCM
                    "-ac", "1",          # mono
                    "-ar", str(TARGET_SAMPLE_RATE),
                    "pipe:1",
                ],
                capture_output=True,
                timeout=60,
            )
        except FileNotFoundError as exc:
            raise AudioDecodeError("Audio processing is not available on this server (ffmpeg missing).") from exc
        except subprocess.TimeoutExpired as exc:
            raise AudioDecodeError("The audio took too long to process. Please try a shorter recording.") from exc

    if proc.returncode != 0 or not proc.stdout:
        stderr = proc.stderr.decode("utf-8", errors="ignore").strip()
        raise AudioDecodeError(
            "We couldn't understand this audio file. Please try recording again, speaking closer to the phone."
        ) from RuntimeError(stderr[:500])

    samples = np.frombuffer(proc.stdout, dtype=np.float32)
    duration_sec = len(samples) / TARGET_SAMPLE_RATE

    if duration_sec < MIN_AUDIO_SECONDS:
        raise AudioDecodeError("The recording is too short. Please record at least a second or two.")
    if duration_sec > MAX_AUDIO_SECONDS:
        raise AudioDecodeError(
            f"The recording is too long ({duration_sec:.0f}s). Please keep it under {int(MAX_AUDIO_SECONDS)} seconds."
        )

    return samples, duration_sec
