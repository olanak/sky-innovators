"""
sky_innovators_inference.py
────────────────────────────
Calls the Colab Flask API for inference.
The model never loads locally — Colab does all the GPU work.

LOCAL TESTING SETUP
────────────────────
1. Run CELL 15 in your Colab notebook (colab_api_cell.py).
2. Copy the printed ngrok URL into your local .env:
       MODEL_API_URL=https://abc123.ngrok-free.app
3. Restart your local FastAPI server (uvicorn main:app --reload).
4. Upload a file from your React frontend — done.

LATER (production)
───────────────────
Just change MODEL_API_URL to your Hugging Face Space or RunPod URL.
Nothing else changes.
"""

import os
import re
import json
import cv2
import numpy as np
import requests as http
from scipy import ndimage

UPLOAD_DIR     = "uploaded_media"
MODEL_API_URL   = os.getenv("MODEL_API_URL", "").rstrip("/")
HF_TOKEN        = os.getenv("HF_TOKEN", "")          # needed for private HF Spaces
FRAME_STEP      = int(os.getenv("FRAME_STEP", 15))
REQUEST_TIMEOUT = int(os.getenv("MODEL_TIMEOUT", 120))

# ── Class names — must match Colab notebook CELL 2 ───────────────
NUM_CLASSES = 8
CLASS_NAMES = [
    "Background",    # 0  — never appears in segments (skipped in Colab cell)
    "HealthyTree",   # 1
    "DeadTree",      # 2
    "LowVegetation", # 3
    "BareSoil",      # 4
    "Water",         # 5
    "Road",          # 6
    "Building",      # 7
]

# Which metrics keys belong to which module
# (used to filter the metrics dict returned by Colab)
MODULE_METRIC_KEYS = {
    "forestry":       "forestry",
    "land":           "land",
    "infrastructure": "infrastructure",
}


def _check_api_url():
    """Raise a clear error if MODEL_API_URL is not set."""
    if not MODEL_API_URL:
        raise EnvironmentError(
            "MODEL_API_URL is not set.\n"
            "1. Run CELL 15 in your Colab notebook.\n"
            "2. Copy the ngrok URL it prints.\n"
            "3. Add to your .env:  MODEL_API_URL=https://xxx.ngrok-free.app\n"
            "4. Restart uvicorn."
        )


def _encode_frame_as_jpg(bgr: np.ndarray) -> bytes:
    """Encode a BGR numpy frame as JPEG bytes to send to the Colab API."""
    _, encoded = cv2.imencode(
        ".jpg", bgr,
        [cv2.IMWRITE_JPEG_QUALITY, 92]
    )
    return encoded.tobytes()


def _call_predict(bgr: np.ndarray) -> dict:
    """
    POST one frame to the Colab /predict endpoint.

    Returns:
        { "segments": [...], "metrics": { "forestry": {...}, ... } }
    """
    _check_api_url()
    jpg_bytes = _encode_frame_as_jpg(bgr)

    try:
        headers = {"Content-Type": "application/octet-stream"}
        if HF_TOKEN:
            headers["Authorization"] = f"Bearer {HF_TOKEN}"

        response = http.post(
            f"{MODEL_API_URL}/predict",
            data=jpg_bytes,
            headers=headers,
            timeout=REQUEST_TIMEOUT,
        )
        response.raise_for_status()
        return response.json()

    except http.exceptions.ConnectionError:
        raise RuntimeError(
            f"Cannot reach Colab API at {MODEL_API_URL}.\n"
            "Make sure CELL 15 is still running in your notebook."
        )
    except http.exceptions.Timeout:
        raise RuntimeError(
            f"Colab API timed out after {REQUEST_TIMEOUT}s. "
            "Try increasing MODEL_TIMEOUT in your .env."
        )


# ─────────────────────────────────────────────────────────────────
# PUBLIC API — called from main.py
# ─────────────────────────────────────────────────────────────────

def run_ai_logic(filename: str, modules: list[str]) -> dict:
    """
    Runs model on the first frame (image or video) and returns
    scalar metrics saved to analysis_results table.
    Called once per upload from main.py.
    """
    file_path = os.path.join(UPLOAD_DIR, filename)
    is_video  = bool(re.search(r"\.(mp4|mov|webm|avi)$", filename, re.IGNORECASE))

    # Load one frame
    if is_video:
        cap = cv2.VideoCapture(file_path)
        ret, bgr = cap.read()
        cap.release()
        if not ret:
            raise RuntimeError(f"Cannot read first frame from {filename}")
    else:
        bgr = cv2.imread(file_path)
        if bgr is None:
            raise RuntimeError(f"Cannot read image: {filename}")

    # Call Colab
    result = _call_predict(bgr)

    # Return only the modules the user selected
    all_metrics = result.get("metrics", {})
    return {
        mod: all_metrics[mod]
        for mod in modules
        if mod in all_metrics
    }


def generate_segmentation_for_media(
    filename: str,
    modules:  list[str],
) -> list[dict]:
    """
    Runs the model on every sampled frame and returns the frames list
    for save_segmentation_frames() to persist to segmentation_frames table.

    Image  → 1 frame at timestamp_ms = 0
    Video  → 1 frame every FRAME_STEP frames
    """
    file_path = os.path.join(UPLOAD_DIR, filename)
    is_video  = bool(re.search(r"\.(mp4|mov|webm|avi)$", filename, re.IGNORECASE))
    frames    = []

    if not is_video:
        bgr = cv2.imread(file_path)
        if bgr is None:
            raise RuntimeError(f"Cannot read image: {filename}")

        result   = _call_predict(bgr)
        segments = result.get("segments", [])

        frames.append({
            "timestamp_ms": 0,
            "segments":     segments,
        })

    else:
        cap  = cv2.VideoCapture(file_path)
        fps  = cap.get(cv2.CAP_PROP_FPS) or 30.0
        fn   = 0
        done = 0
        print(f"[SkyInnovators] Processing video {filename}  "
              f"fps={fps:.0f}  step={FRAME_STEP}")

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            if fn % FRAME_STEP == 0:
                ts_ms = int((fn / fps) * 1000)
                try:
                    result   = _call_predict(frame)
                    segments = result.get("segments", [])
                    frames.append({
                        "timestamp_ms": ts_ms,
                        "segments":     segments,
                    })
                    done += 1
                    if done % 5 == 0:
                        print(f"[SkyInnovators]   {done} frames processed")
                except Exception as e:
                    print(f"[SkyInnovators]   frame {fn} error: {e}")

            fn += 1

        cap.release()
        print(f"[SkyInnovators] Done — {done} frames segmented")

    return frames


def save_segmentation_frames(media_id: int, frames: list[dict], db) -> None:
    """Saves frames list to segmentation_frames table. Called from main.py."""
    from models import SegmentationFrame
    for frame in frames:
        db.add(SegmentationFrame(
            media_id=media_id,
            timestamp_ms=frame["timestamp_ms"],
            segments_json=json.dumps(frame["segments"]),
        ))
    # main.py calls db.commit() after this
