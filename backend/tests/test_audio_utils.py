from __future__ import annotations

from pathlib import Path

import pytest

from app.services.audio_utils import AudioDecodeError, TARGET_SAMPLE_RATE, decode_audio_to_mono_16k

DEMO_AUDIO_DIR = Path(__file__).resolve().parents[2] / "data" / "demo" / "audio"

REAL_SAMPLE_FILES = [
    "product_loud.wav",                # mono, 192kHz WAV — needs real downsampling
    "product_description.wav",         # mono, 16kHz WAV — already target rate
    "product_description.wav.m4a",     # actually AAC-in-MP4 despite the .wav in the name
]


@pytest.mark.parametrize("filename", REAL_SAMPLE_FILES)
def test_decodes_real_sample_audio_files(filename):
    """
    These are the repo's actual bundled demo audio files, not synthetic
    fixtures — including one whose real format (AAC/MP4) doesn't match its
    filename. This test caught a real ffmpeg-stdin-pipe/MP4-seeking bug
    during development (fixed by using a temp file instead of a pipe).
    """
    path = DEMO_AUDIO_DIR / filename
    if not path.exists():
        pytest.skip(f"{filename} not present in this checkout.")

    raw_bytes = path.read_bytes()
    samples, duration_sec = decode_audio_to_mono_16k(raw_bytes)

    assert samples.dtype.name == "float32"
    assert samples.ndim == 1  # mono
    assert duration_sec > 1.0
    assert abs(len(samples) / TARGET_SAMPLE_RATE - duration_sec) < 0.01
    # A real voice recording should not be pure silence.
    assert float(abs(samples).max()) > 0.01


def test_empty_bytes_rejected():
    with pytest.raises(AudioDecodeError, match="empty"):
        decode_audio_to_mono_16k(b"")


def test_garbage_bytes_rejected_with_friendly_message():
    with pytest.raises(AudioDecodeError, match="couldn't understand"):
        decode_audio_to_mono_16k(b"this is not an audio file, just plain text bytes")
