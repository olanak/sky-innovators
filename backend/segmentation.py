"""
segmentation.py
───────────────
Handles generating and saving per-frame segmentation masks.

RIGHT NOW  → produces realistic mock RLE masks so the frontend overlay works
             immediately without a real model.

LATER      → replace `generate_segmentation_for_media()` with your real
             EfficientNetB4 U-Net inference. The save logic and the endpoint
             in main.py stay exactly the same.
"""

import json
import os
import re
import random

# ── Class registry (must match CLASS_CONFIG in AnalysisReport.jsx) ────────────
CLASSES = ["forest", "deforestation", "water", "land", "road", "building"]

# Which classes are plausible for each module the user selected
MODULE_CLASS_MAP = {
    "forestry":        ["forest", "deforestation"],
    "land":            ["land", "road"],
    "infrastructure":  ["road", "building", "water"],
}


def _encode_mock_rle(width: int, height: int, coverage: float) -> list[int]:
    """
    Produces a mock COCO-style RLE list for a single class.

    The RLE alternates background / foreground run lengths.
    `coverage` (0.0–1.0) controls roughly how much of the frame is filled.

    When you plug in your real model, DELETE this function entirely and
    use pycocotools to encode the real predicted mask instead.
    """
    total_pixels = width * height
    rle = []
    pos = 0
    in_mask = False  # start with background

    while pos < total_pixels:
        remaining = total_pixels - pos
        if in_mask:
            # foreground run
            run = random.randint(1, max(1, int(total_pixels * coverage * 0.05)))
        else:
            # background run
            run = random.randint(1, max(1, int(total_pixels * (1 - coverage) * 0.05)))
        run = min(run, remaining)
        rle.append(run)
        pos += run
        in_mask = not in_mask

    return rle


def generate_segmentation_for_media(
    filename: str,
    modules: list[str],
    frame_interval_ms: int = 500,
    total_duration_ms: int = 10_000,
) -> list[dict]:
    """
    Returns a list of frame dicts ready to be saved to `segmentation_frames`.

    For IMAGES  → returns a single frame with timestamp_ms = 0.
    For VIDEOS  → returns one frame every `frame_interval_ms` milliseconds
                  up to `total_duration_ms`.

    Each frame dict looks like:
        {
            "timestamp_ms": 0,
            "segments": [
                {
                    "class": "forest",
                    "mask_rle": [...],
                    "width": 1280,
                    "height": 720,
                    "confidence": 0.94
                },
                ...
            ]
        }

    ── PLUG-IN GUIDE ────────────────────────────────────────────────────────
    When your U-Net is ready:

    1. Load the file from `uploaded_media/{filename}`.
    2. For videos, iterate frames with OpenCV (cv2.VideoCapture).
    3. Run model.predict(frame_array) to get a (H, W) label map.
    4. For each class label, extract a binary mask and encode with:
           from pycocotools import mask as coco_mask
           rle = coco_mask.encode(np.asfortranarray(binary_mask.astype(np.uint8)))
           rle_list = list(rle["counts"])   # convert bytes→list for JSON
    5. Build the same dict structure and return it.
    ─────────────────────────────────────────────────────────────────────────
    """
    is_video = bool(re.search(r'\.(mp4|mov|webm|avi)$', filename, re.IGNORECASE))

    # Determine which classes to include based on selected modules
    active_classes = []
    for mod in modules:
        active_classes.extend(MODULE_CLASS_MAP.get(mod, []))
    active_classes = list(set(active_classes)) or ["forest", "land"]

    # Standard mock resolution — replace with real frame dimensions later
    W, H = 1280, 720

    timestamps = (
        list(range(0, total_duration_ms, frame_interval_ms))
        if is_video
        else [0]
    )

    frames = []
    for ts in timestamps:
        segments = []
        for cls in active_classes:
            coverage = random.uniform(0.05, 0.35)
            segments.append({
                "class":       cls,
                "mask_rle":    _encode_mock_rle(W, H, coverage),
                "width":       W,
                "height":      H,
                "confidence":  round(random.uniform(0.82, 0.99), 2),
            })
        frames.append({"timestamp_ms": ts, "segments": segments})

    return frames


def save_segmentation_frames(media_id: int, frames: list[dict], db) -> None:
    """
    Persists the frame list to the `segmentation_frames` table.
    Called from main.py after run_ai_logic().
    """
    # Import here to avoid circular imports
    from models import SegmentationFrame

    for frame in frames:
        db.add(SegmentationFrame(
            media_id=media_id,
            timestamp_ms=frame["timestamp_ms"],
            segments_json=json.dumps(frame["segments"]),
        ))
    # Caller is responsible for db.commit()
