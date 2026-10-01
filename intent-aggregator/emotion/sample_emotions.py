#!/usr/bin/env python3
"""Sample one frame every 10 seconds from a meeting video and write emotion_timeline.json.

DeepFace is preferred. FER is the fallback. Install one of them yourself.
This script does not call Jev and does not keep the video or the frames.

Expressions are not emotions. The psychology is unsettled. The scores are a
noisy reference. Run this only when every participant consented to the recording.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path


def sample_times(duration: float, step: float = 10.0) -> list[float]:
    if duration <= 0:
        return [0.0]
    times = []
    cursor = 0.0
    while cursor < duration:
        times.append(round(cursor, 3))
        cursor += step
    return times


def dominant(scores: dict[str, float]) -> str:
    if not scores:
        return "unknown"
    return max(scores, key=scores.get)


def analyze_frame(frame) -> dict[str, float]:
    try:
        from deepface import DeepFace

        result = DeepFace.analyze(frame, actions=["emotion"], enforce_detection=False)
        row = result[0] if isinstance(result, list) else result
        raw = row.get("emotion") or {}
        return {str(name): float(score) / 100.0 for name, score in raw.items()}
    except ImportError:
        pass
    try:
        from fer import FER

        faces = FER(mtcnn=False).detect_emotions(frame)
        if not faces:
            return {}
        raw = faces[0].get("emotions") or {}
        return {str(name): float(score) for name, score in raw.items()}
    except ImportError as error:
        raise SystemExit(
            "Install one model: pip install deepface   or   pip install fer opencv-python"
        ) from error


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("usage: sample_emotions.py <meeting.mp4> <emotion_timeline.json>")
    video = Path(sys.argv[1])
    output = Path(sys.argv[2])
    if not video.is_file():
        raise SystemExit(f"missing video: {video}")

    import cv2

    capture = cv2.VideoCapture(str(video))
    fps = capture.get(cv2.CAP_PROP_FPS) or 0
    frames = capture.get(cv2.CAP_PROP_FRAME_COUNT) or 0
    duration = (frames / fps) if fps else 0
    timeline = []
    for t_sec in sample_times(duration):
        if fps:
            capture.set(cv2.CAP_PROP_POS_FRAMES, int(t_sec * fps))
        ok, frame = capture.read()
        if not ok:
            continue
        scores = analyze_frame(frame)
        timeline.append({"t_sec": t_sec, "dominant": dominant(scores), "scores": scores})
    capture.release()
    output.write_text(json.dumps(timeline, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"wrote {output} ({len(timeline)} frames)")


if __name__ == "__main__":
    main()
