"""
sky_innovators_inference.py
────────────────────────────
Calls the Hugging Face Space model API for inference.
Handles both images and videos with PyAV as the video decoder
(more reliable than cv2.VideoCapture on cloud environments like Render
 that may lack the H.264 FFmpeg codecs OpenCV needs).
"""

import os
import re
import json
import cv2
import numpy as np
import requests as http

UPLOAD_DIR      = "uploaded_media"

# ── SegFormer Space (default) ────────────────────────────────────────────────
MODEL_API_URL   = os.getenv("MODEL_API_URL", "").rstrip("/")
HF_TOKEN        = os.getenv("HF_TOKEN", "")

# ── Ensemble Space (friend's account, hosted separately) ─────────────────────
# Each HF token only works for Spaces on the account that issued it, which
# is why we keep two separate tokens here.
MODEL_API_URL_ENSEMBLE = os.getenv("MODEL_API_URL_ENSEMBLE", "").rstrip("/")
HF_TOKEN_ENSEMBLE      = os.getenv("HF_TOKEN_ENSEMBLE", "")

FRAME_STEP      = int(os.getenv("FRAME_STEP", 160))    # default 30 = 1fps at 30fps video
REQUEST_TIMEOUT = int(os.getenv("MODEL_TIMEOUT", 120))


def _get_model_endpoint(model: str) -> tuple[str, str]:
    """
    Returns (api_url, hf_token) for the chosen model.
    Falls back to SegFormer if the ensemble isn't configured (e.g. local dev
    where only one Space is set up).
    """
    if model == "ensemble" and MODEL_API_URL_ENSEMBLE:
        return MODEL_API_URL_ENSEMBLE, HF_TOKEN_ENSEMBLE
    return MODEL_API_URL, HF_TOKEN

# Hard cap on how many frames to process per video.
# At 25s per frame on CPU: 8 frames = ~200s max processing time.
# Prevents timeouts on long videos. Override with MAX_FRAMES env var.
MAX_FRAMES = int(os.getenv("MAX_FRAMES", 8))

NUM_CLASSES = 8
CLASS_NAMES = [
    "Background",
    "HealthyTree",
    "DeadTree",
    "LowVegetation",
    "BareSoil",
    "Water",
    "Road",
    "Building",
]

MODULE_METRIC_KEYS = {
    "forestry":       "forestry",
    "land":           "land",
    "infrastructure": "infrastructure",
}


def _check_api_url(url: str = None):
    """Validates that the chosen model's API URL is configured."""
    target = url if url is not None else MODEL_API_URL
    if not target:
        raise EnvironmentError(
            "MODEL_API_URL is not set. "
            "Add MODEL_API_URL=https://your-hf-space.hf.space to your environment variables."
        )


def _encode_frame_as_jpg(bgr: np.ndarray) -> bytes:
    """Encode BGR numpy frame as JPEG bytes."""
    _, encoded = cv2.imencode(".jpg", bgr, [cv2.IMWRITE_JPEG_QUALITY, 92])
    return encoded.tobytes()


def _call_predict(bgr: np.ndarray, model: str = "segformer") -> dict:
    """POST one frame to the chosen Space's /predict endpoint."""
    api_url, token = _get_model_endpoint(model)
    _check_api_url(api_url)

    import sys
    sys.stdout.write(f"[SkyInnovators] → /predict  model={model}  url={api_url}\n")
    sys.stdout.flush()

    jpg_bytes = _encode_frame_as_jpg(bgr)

    headers = {"Content-Type": "application/octet-stream"}
    if token:
        headers["Authorization"] = f"Bearer {token}"

    try:
        response = http.post(
            f"{api_url}/predict",
            data=jpg_bytes,
            headers=headers,
            timeout=REQUEST_TIMEOUT,
        )
        response.raise_for_status()
        return response.json()
    except http.exceptions.ConnectionError:
        raise RuntimeError(
            f"Cannot reach model API at {api_url} (model={model}). "
            "Check MODEL_API_URL / MODEL_API_URL_ENSEMBLE environment variables."
        )
    except http.exceptions.Timeout:
        raise RuntimeError(
            f"Model API timed out after {REQUEST_TIMEOUT}s (model={model}). "
            "Try increasing MODEL_TIMEOUT in your environment variables."
        )


# ── Video reading ─────────────────────────────────────────────────────────────

def _read_video_frames_pyav(file_path: str, frame_step: int, max_frames: int):
    """
    Read video frames using PyAV (FFmpeg bindings).
    More reliable than cv2.VideoCapture on cloud environments without
    full FFmpeg codec libraries installed.

    Yields (frame_index, fps, bgr_array) tuples for every frame_step-th frame,
    stopping after max_frames frames have been yielded.
    """
    import av

    container = av.open(file_path)
    video_stream = container.streams.video[0]

    # Get FPS from stream
    fps = float(video_stream.average_rate) if video_stream.average_rate else 30.0

    frame_index = 0
    frames_yielded = 0

    for packet in container.demux(video_stream):
        for frame in packet.decode():
            if frame_index % frame_step == 0:
                # Convert PyAV frame to BGR numpy array (same format as OpenCV)
                img = frame.to_ndarray(format="rgb24")
                bgr = cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
                yield frame_index, fps, bgr
                frames_yielded += 1
                if frames_yielded >= max_frames:
                    container.close()
                    return
            frame_index += 1

    container.close()


def _read_video_frames_opencv(file_path: str, frame_step: int, max_frames: int):
    """
    Read video frames using OpenCV VideoCapture.
    Works reliably locally but may fail on cloud without FFmpeg codecs.
    Used as the primary method, PyAV as fallback.

    Yields (frame_index, fps, bgr_array) tuples.
    """
    cap = cv2.VideoCapture(file_path)
    if not cap.isOpened():
        raise RuntimeError(f"OpenCV cannot open: {file_path}")

    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    frame_index = 0
    frames_yielded = 0

    while cap.isOpened():
        ret, frame = cap.read()
        if not ret:
            break
        if frame_index % frame_step == 0:
            yield frame_index, fps, frame
            frames_yielded += 1
            if frames_yielded >= max_frames:
                break
        frame_index += 1

    cap.release()


def _iter_video_frames(file_path: str, frame_step: int, max_frames: int):
    """
    Try OpenCV first, fall back to PyAV if OpenCV fails.
    This handles both local development (OpenCV works fine) and
    cloud environments like Render (may need PyAV for H.264 decoding).
    """
    # Try OpenCV first
    try:
        cap = cv2.VideoCapture(file_path)
        opened = cap.isOpened()
        cap.release()

        if opened:
            print("[SkyInnovators] Using OpenCV for video decoding")
            yield from _read_video_frames_opencv(file_path, frame_step, max_frames)
            return
    except Exception as e:
        print(f"[SkyInnovators] OpenCV failed: {e} — trying PyAV")

    # Fall back to PyAV
    try:
        import av  # noqa — only imported if needed
        print("[SkyInnovators] Using PyAV for video decoding")
        yield from _read_video_frames_pyav(file_path, frame_step, max_frames)
    except ImportError:
        raise RuntimeError(
            "Cannot decode video: OpenCV VideoCapture failed and PyAV is not installed. "
            "Add 'av' to requirements.txt and ensure FFmpeg is available."
        )


def _read_first_video_frame(file_path: str) -> np.ndarray:
    """Read just the first frame for run_ai_logic() metrics."""
    # Try OpenCV
    cap = cv2.VideoCapture(file_path)
    if cap.isOpened():
        ret, frame = cap.read()
        cap.release()
        if ret:
            return frame
        cap.release()

    # Fall back to PyAV
    try:
        import av
        container = av.open(file_path)
        video_stream = container.streams.video[0]
        for packet in container.demux(video_stream):
            for frame in packet.decode():
                img = frame.to_ndarray(format="rgb24")
                container.close()
                return cv2.cvtColor(img, cv2.COLOR_RGB2BGR)
        container.close()
    except ImportError:
        pass

    raise RuntimeError(
        f"Cannot read first frame from {file_path}. "
        "OpenCV and PyAV both failed. Check FFmpeg is installed on the server."
    )


# ── Public API ────────────────────────────────────────────────────────────────

def check_image_relevance(filename: str) -> dict:
    """
    Calls the HF Space /check endpoint to verify the image looks like
    drone forest footage before running expensive segmentation.

    Always uses the SegFormer Space (only that one has /check — MobileCLIP
    is model-agnostic so there's no need to duplicate it on the ensemble
    Space).

    Returns a dict with at least:
      { "is_valid": bool, "confidence": float, "reason": str (if invalid) }

    On network failure, returns is_valid=True so the system fails open
    (we'd rather process a maybe-invalid image than reject a real one
    due to transient network issues).
    """
    _check_api_url(MODEL_API_URL)   # SegFormer URL specifically
    file_path = os.path.join(UPLOAD_DIR, filename)
    is_video  = bool(re.search(r"\.(mp4|mov|webm|avi)$", filename, re.IGNORECASE))

    try:
        if is_video:
            bgr = _read_first_video_frame(file_path)
        else:
            bgr = cv2.imread(file_path)
            if bgr is None:
                return {"is_valid": False, "reason": f"Cannot read image: {filename}"}

        jpg_bytes = _encode_frame_as_jpg(bgr)
        headers   = {"Content-Type": "application/octet-stream"}
        if HF_TOKEN:
            headers["Authorization"] = f"Bearer {HF_TOKEN}"

        response = http.post(
            f"{MODEL_API_URL}/check",
            data=jpg_bytes,
            headers=headers,
            timeout=30,
        )
        response.raise_for_status()
        return response.json()

    except Exception as e:
        print(f"[SkyInnovators] Relevance check failed (failing open): {e}")
        return {"is_valid": True, "confidence": 0.0, "reason": ""}


def run_ai_logic(filename: str, modules: list[str], model: str = "segformer") -> dict:
    """
    Runs model on the first frame and returns scalar metrics.
    Called once per upload from main.py.

    The `model` argument selects which HF Space to call:
      "segformer" → MODEL_API_URL          (default, SegFormer-only)
      "ensemble"  → MODEL_API_URL_ENSEMBLE  (Hybrid Ensemble)
    """
    file_path = os.path.join(UPLOAD_DIR, filename)
    is_video  = bool(re.search(r"\.(mp4|mov|webm|avi)$", filename, re.IGNORECASE))

    if is_video:
        bgr = _read_first_video_frame(file_path)
    else:
        bgr = cv2.imread(file_path)
        if bgr is None:
            raise RuntimeError(f"Cannot read image: {filename}")

    result = _call_predict(bgr, model=model)
    all_metrics = result.get("metrics", {})
    return {
        mod: all_metrics[mod]
        for mod in modules
        if mod in all_metrics
    }


def generate_segmentation_for_media(
    filename: str,
    modules:  list[str],
    model:    str = "segformer",
) -> list[dict]:
    """
    Runs the model on sampled frames and returns the frames list
    for save_segmentation_frames() to persist to the DB.

    Image  → 1 frame at timestamp_ms = 0
    Video  → up to MAX_FRAMES frames, sampled every FRAME_STEP frames

    The `model` argument selects which HF Space to call (see run_ai_logic).
    """
    file_path = os.path.join(UPLOAD_DIR, filename)
    is_video  = bool(re.search(r"\.(mp4|mov|webm|avi)$", filename, re.IGNORECASE))
    frames    = []

    if not is_video:
        bgr = cv2.imread(file_path)
        if bgr is None:
            raise RuntimeError(f"Cannot read image: {filename}")

        result = _call_predict(bgr, model=model)
        frames.append({
            "timestamp_ms": 0,
            "segments":     result.get("segments", []),
        })

    else:
        print(
            f"[SkyInnovators] Processing video {filename} "
            f"FRAME_STEP={FRAME_STEP} MAX_FRAMES={MAX_FRAMES} model={model}"
        )
        done = 0

        for frame_index, fps, bgr_frame in _iter_video_frames(
            file_path, FRAME_STEP, MAX_FRAMES
        ):
            ts_ms = int((frame_index / fps) * 1000)
            try:
                result = _call_predict(bgr_frame, model=model)
                frames.append({
                    "timestamp_ms": ts_ms,
                    "segments":     result.get("segments", []),
                })
                done += 1
                print(f"[SkyInnovators]   frame {frame_index} (t={ts_ms}ms) done ({done}/{MAX_FRAMES})")
            except Exception as e:
                print(f"[SkyInnovators]   frame {frame_index} error: {e}")

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