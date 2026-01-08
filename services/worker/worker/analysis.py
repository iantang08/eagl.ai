import json
import subprocess
import tempfile
from dataclasses import dataclass, asdict
from pathlib import Path

import cv2
import mediapipe as mp
import numpy as np
from PIL import Image

from worker.config import get_settings

settings = get_settings()

mp_pose = mp.solutions.pose


@dataclass
class VideoMetadata:
    duration_ms: int
    fps: float
    width: int
    height: int
    frame_count: int


@dataclass
class PhaseTimestamp:
    name: str
    frame: int
    timestamp_ms: int


@dataclass
class RubricItem:
    name: str
    score: int
    max_score: int
    explanation: str
    timestamp_ms: int | None = None


@dataclass
class AnalysisResult:
    criteria_version: str
    overall_score: int
    analysis_confidence: float
    phases: list[PhaseTimestamp]
    metrics: dict
    rubric: list[RubricItem]


def get_video_metadata(video_path: Path) -> VideoMetadata:
    """Extract video metadata using ffprobe."""
    cmd = [
        "ffprobe",
        "-v", "quiet",
        "-print_format", "json",
        "-show_format",
        "-show_streams",
        str(video_path),
    ]
    result = subprocess.run(cmd, capture_output=True, text=True)
    data = json.loads(result.stdout)

    video_stream = None
    for stream in data.get("streams", []):
        if stream.get("codec_type") == "video":
            video_stream = stream
            break

    if not video_stream:
        raise ValueError("No video stream found")

    duration_sec = float(data["format"]["duration"])
    fps_parts = video_stream["r_frame_rate"].split("/")
    fps = float(fps_parts[0]) / float(fps_parts[1])

    return VideoMetadata(
        duration_ms=int(duration_sec * 1000),
        fps=fps,
        width=int(video_stream["width"]),
        height=int(video_stream["height"]),
        frame_count=int(video_stream.get("nb_frames", duration_sec * fps)),
    )


def extract_frames(video_path: Path, max_frames: int = 300) -> list[np.ndarray]:
    """Extract frames from video, capping at max_frames."""
    cap = cv2.VideoCapture(str(video_path))
    frames = []

    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    step = max(1, total_frames // max_frames)

    frame_idx = 0
    while cap.isOpened() and len(frames) < max_frames:
        ret, frame = cap.read()
        if not ret:
            break

        if frame_idx % step == 0:
            frames.append(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB))

        frame_idx += 1

    cap.release()
    return frames


def process_pose(frames: list[np.ndarray]) -> list[dict | None]:
    """Run MediaPipe Pose on frames and return landmarks."""
    landmarks_list = []

    with mp_pose.Pose(
        static_image_mode=False,
        model_complexity=1,
        enable_segmentation=False,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5,
    ) as pose:
        for frame in frames:
            results = pose.process(frame)

            if results.pose_landmarks:
                landmarks = {}
                for idx, lm in enumerate(results.pose_landmarks.landmark):
                    landmarks[idx] = {
                        "x": lm.x,
                        "y": lm.y,
                        "z": lm.z,
                        "visibility": lm.visibility,
                    }
                landmarks_list.append(landmarks)
            else:
                landmarks_list.append(None)

    return landmarks_list


def smooth_landmarks(
    landmarks_list: list[dict | None], window: int = 3
) -> list[dict | None]:
    """Apply simple smoothing to landmarks."""
    if len(landmarks_list) < window:
        return landmarks_list

    smoothed = []
    for i in range(len(landmarks_list)):
        if landmarks_list[i] is None:
            smoothed.append(None)
            continue

        # Get neighboring frames
        start = max(0, i - window // 2)
        end = min(len(landmarks_list), i + window // 2 + 1)

        valid_frames = [
            landmarks_list[j] for j in range(start, end) if landmarks_list[j] is not None
        ]

        if not valid_frames:
            smoothed.append(None)
            continue

        # Average landmarks
        averaged = {}
        for key in landmarks_list[i].keys():
            averaged[key] = {
                "x": np.mean([f[key]["x"] for f in valid_frames]),
                "y": np.mean([f[key]["y"] for f in valid_frames]),
                "z": np.mean([f[key]["z"] for f in valid_frames]),
                "visibility": landmarks_list[i][key]["visibility"],
            }
        smoothed.append(averaged)

    return smoothed


def detect_phases(
    landmarks_list: list[dict | None], fps: float
) -> list[PhaseTimestamp]:
    """Detect swing phases based on wrist positions."""
    phases = []

    # MediaPipe landmark indices
    LEFT_WRIST = 15
    RIGHT_WRIST = 16

    # Track wrist heights
    wrist_heights = []
    for lm in landmarks_list:
        if lm is None:
            wrist_heights.append(None)
            continue
        left_y = lm[LEFT_WRIST]["y"]
        right_y = lm[RIGHT_WRIST]["y"]
        avg_y = (left_y + right_y) / 2
        wrist_heights.append(avg_y)

    # Fill None values with interpolation
    valid_heights = [h for h in wrist_heights if h is not None]
    if len(valid_heights) < 4:
        # Not enough data, return minimal phases
        return [
            PhaseTimestamp("address", 0, 0),
            PhaseTimestamp("finish", len(landmarks_list) - 1, int((len(landmarks_list) - 1) / fps * 1000)),
        ]

    # Find key positions
    # Address: first stable position (low variance)
    # Top: highest wrist position (lowest y value since y increases downward)
    # Impact: rapid descent after top
    # Finish: final stable position

    min_height_idx = 0
    min_height = float("inf")
    for i, h in enumerate(wrist_heights):
        if h is not None and h < min_height:
            min_height = h
            min_height_idx = i

    # Address is early in the swing
    address_idx = min(10, len(wrist_heights) // 10)

    # Top is where wrists are highest
    top_idx = min_height_idx

    # Impact is slightly after top (about 1/3 way from top to end)
    impact_idx = top_idx + (len(wrist_heights) - top_idx) // 3

    # Finish is near the end
    finish_idx = len(wrist_heights) - 1

    phases = [
        PhaseTimestamp("address", address_idx, int(address_idx / fps * 1000)),
        PhaseTimestamp("top", top_idx, int(top_idx / fps * 1000)),
        PhaseTimestamp("impact", impact_idx, int(impact_idx / fps * 1000)),
        PhaseTimestamp("finish", finish_idx, int(finish_idx / fps * 1000)),
    ]

    return phases


def calculate_head_stability(landmarks_list: list[dict | None]) -> tuple[int, str]:
    """Calculate head stability score (0-100)."""
    NOSE = 0

    positions = []
    for lm in landmarks_list:
        if lm is not None:
            positions.append((lm[NOSE]["x"], lm[NOSE]["y"]))

    if len(positions) < 2:
        return 50, "Insufficient data for head stability analysis"

    x_vals = [p[0] for p in positions]
    y_vals = [p[1] for p in positions]

    x_range = max(x_vals) - min(x_vals)
    y_range = max(y_vals) - min(y_vals)

    # Lower range = more stable
    total_range = x_range + y_range

    if total_range < 0.05:
        return 95, "Excellent head stability throughout the swing"
    elif total_range < 0.10:
        return 80, "Good head stability with minimal movement"
    elif total_range < 0.15:
        return 65, "Moderate head movement, try to keep head more still"
    else:
        return 40, "Significant head movement detected, focus on keeping head steady"


def calculate_hip_sway(landmarks_list: list[dict | None]) -> tuple[int, str]:
    """Calculate hip sway score (0-100)."""
    LEFT_HIP = 23
    RIGHT_HIP = 24

    hip_positions = []
    for lm in landmarks_list:
        if lm is not None:
            mid_x = (lm[LEFT_HIP]["x"] + lm[RIGHT_HIP]["x"]) / 2
            hip_positions.append(mid_x)

    if len(hip_positions) < 2:
        return 50, "Insufficient data for hip sway analysis"

    sway = max(hip_positions) - min(hip_positions)

    if sway < 0.08:
        return 90, "Excellent hip stability, minimal lateral sway"
    elif sway < 0.12:
        return 75, "Good hip control with slight lateral movement"
    elif sway < 0.18:
        return 55, "Moderate hip sway, try to rotate rather than slide"
    else:
        return 35, "Excessive hip sway, focus on rotation over lateral movement"


def calculate_spine_angle(landmarks_list: list[dict | None]) -> tuple[int, str]:
    """Calculate spine angle consistency score (0-100)."""
    LEFT_SHOULDER = 11
    RIGHT_SHOULDER = 12
    LEFT_HIP = 23
    RIGHT_HIP = 24

    angles = []
    for lm in landmarks_list:
        if lm is None:
            continue

        shoulder_y = (lm[LEFT_SHOULDER]["y"] + lm[RIGHT_SHOULDER]["y"]) / 2
        shoulder_z = (lm[LEFT_SHOULDER]["z"] + lm[RIGHT_SHOULDER]["z"]) / 2
        hip_y = (lm[LEFT_HIP]["y"] + lm[RIGHT_HIP]["y"]) / 2
        hip_z = (lm[LEFT_HIP]["z"] + lm[RIGHT_HIP]["z"]) / 2

        # Calculate angle from vertical
        dy = shoulder_y - hip_y
        dz = shoulder_z - hip_z

        angle = np.arctan2(dz, dy)
        angles.append(angle)

    if len(angles) < 2:
        return 50, "Insufficient data for spine angle analysis"

    angle_variance = np.std(angles)

    if angle_variance < 0.1:
        return 90, "Excellent spine angle maintenance throughout swing"
    elif angle_variance < 0.2:
        return 70, "Good spine angle consistency"
    elif angle_variance < 0.3:
        return 50, "Moderate spine angle changes, work on posture consistency"
    else:
        return 30, "Significant spine angle changes, focus on maintaining posture"


def calculate_tempo(phases: list[PhaseTimestamp]) -> tuple[int, str]:
    """Calculate tempo ratio score (0-100)."""
    phase_dict = {p.name: p.timestamp_ms for p in phases}

    if "address" not in phase_dict or "top" not in phase_dict or "finish" not in phase_dict:
        return 50, "Unable to calculate tempo with available data"

    backswing_time = phase_dict["top"] - phase_dict["address"]
    downswing_time = phase_dict["finish"] - phase_dict["top"]

    if downswing_time == 0:
        return 50, "Unable to calculate tempo ratio"

    ratio = backswing_time / downswing_time

    # Ideal ratio is around 3:1 (backswing 3x longer than downswing)
    ideal_ratio = 3.0
    deviation = abs(ratio - ideal_ratio)

    if deviation < 0.5:
        return 90, f"Excellent tempo with {ratio:.1f}:1 ratio (ideal is ~3:1)"
    elif deviation < 1.0:
        return 70, f"Good tempo with {ratio:.1f}:1 ratio"
    elif deviation < 1.5:
        return 50, f"Tempo could be improved, current ratio is {ratio:.1f}:1"
    else:
        return 30, f"Work on tempo, current {ratio:.1f}:1 ratio is far from ideal 3:1"


def calculate_early_extension(landmarks_list: list[dict | None]) -> tuple[int, str]:
    """Calculate early extension proxy score (0-100)."""
    LEFT_HIP = 23
    RIGHT_HIP = 24

    hip_z_values = []
    for lm in landmarks_list:
        if lm is not None:
            avg_z = (lm[LEFT_HIP]["z"] + lm[RIGHT_HIP]["z"]) / 2
            hip_z_values.append(avg_z)

    if len(hip_z_values) < 10:
        return 50, "Insufficient data for early extension analysis"

    # Check if hips move toward ball (increasing z) in second half of swing
    mid = len(hip_z_values) // 2
    first_half_avg = np.mean(hip_z_values[:mid])
    second_half_avg = np.mean(hip_z_values[mid:])

    extension = second_half_avg - first_half_avg

    if extension < 0.02:
        return 90, "No early extension detected, excellent hip position"
    elif extension < 0.05:
        return 70, "Minimal forward movement of hips"
    elif extension < 0.08:
        return 50, "Some early extension, hips moving toward ball"
    else:
        return 30, "Significant early extension, work on maintaining hip position"


def calculate_finish_stability(landmarks_list: list[dict | None]) -> tuple[int, str]:
    """Calculate finish position stability score (0-100)."""
    if len(landmarks_list) < 10:
        return 50, "Insufficient data for finish stability analysis"

    # Look at last 10% of frames
    finish_frames = landmarks_list[-len(landmarks_list) // 10:]
    valid_frames = [f for f in finish_frames if f is not None]

    if len(valid_frames) < 2:
        return 50, "Unable to analyze finish position"

    # Check variance in key points at finish
    LEFT_SHOULDER = 11
    RIGHT_SHOULDER = 12

    positions = []
    for lm in valid_frames:
        mid_x = (lm[LEFT_SHOULDER]["x"] + lm[RIGHT_SHOULDER]["x"]) / 2
        mid_y = (lm[LEFT_SHOULDER]["y"] + lm[RIGHT_SHOULDER]["y"]) / 2
        positions.append((mid_x, mid_y))

    x_var = np.std([p[0] for p in positions])
    y_var = np.std([p[1] for p in positions])
    total_var = x_var + y_var

    if total_var < 0.02:
        return 90, "Excellent balanced finish position"
    elif total_var < 0.04:
        return 70, "Good finish position with minor movement"
    elif total_var < 0.06:
        return 50, "Some instability in finish position"
    else:
        return 30, "Work on balance in finish position"


def create_thumbnail(video_path: Path, output_path: Path, timestamp_ms: int = 0) -> None:
    """Create a thumbnail from the video."""
    cap = cv2.VideoCapture(str(video_path))
    fps = cap.get(cv2.CAP_PROP_FPS)

    target_frame = int(timestamp_ms / 1000 * fps)
    cap.set(cv2.CAP_PROP_POS_FRAMES, target_frame)

    ret, frame = cap.read()
    cap.release()

    if ret:
        # Convert BGR to RGB and resize
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        img = Image.fromarray(frame_rgb)

        # Resize to max 480px on longest side
        max_size = 480
        ratio = min(max_size / img.width, max_size / img.height)
        new_size = (int(img.width * ratio), int(img.height * ratio))
        img = img.resize(new_size, Image.Resampling.LANCZOS)

        img.save(output_path, "JPEG", quality=85)
    else:
        # Create placeholder
        img = Image.new("RGB", (320, 240), color=(50, 50, 50))
        img.save(output_path, "JPEG")


def analyze_video(video_path: Path) -> tuple[AnalysisResult, VideoMetadata]:
    """Run full analysis pipeline on a video."""
    # Get metadata
    metadata = get_video_metadata(video_path)

    # Extract frames
    frames = extract_frames(video_path, max_frames=settings.max_frames)

    # Process pose
    landmarks = process_pose(frames)

    # Smooth landmarks
    smoothed = smooth_landmarks(landmarks)

    # Detect phases
    effective_fps = len(frames) / (metadata.duration_ms / 1000)
    phases = detect_phases(smoothed, effective_fps)

    # Calculate rubric scores
    head_score, head_exp = calculate_head_stability(smoothed)
    hip_score, hip_exp = calculate_hip_sway(smoothed)
    spine_score, spine_exp = calculate_spine_angle(smoothed)
    tempo_score, tempo_exp = calculate_tempo(phases)
    early_ext_score, early_ext_exp = calculate_early_extension(smoothed)
    finish_score, finish_exp = calculate_finish_stability(smoothed)

    rubric = [
        RubricItem("Head Stability", head_score, 100, head_exp),
        RubricItem("Hip Sway Control", hip_score, 100, hip_exp),
        RubricItem("Spine Angle", spine_score, 100, spine_exp),
        RubricItem("Tempo", tempo_score, 100, tempo_exp),
        RubricItem("Early Extension", early_ext_score, 100, early_ext_exp),
        RubricItem("Finish Balance", finish_score, 100, finish_exp),
    ]

    # Calculate overall score (weighted average)
    weights = [1.0, 1.0, 1.2, 0.8, 1.0, 0.8]
    total_weight = sum(weights)
    weighted_score = sum(r.score * w for r, w in zip(rubric, weights)) / total_weight
    overall_score = int(weighted_score)

    # Calculate confidence based on valid frames
    valid_frames = sum(1 for lm in landmarks if lm is not None)
    confidence = valid_frames / len(frames) if frames else 0

    result = AnalysisResult(
        criteria_version="v1",
        overall_score=overall_score,
        analysis_confidence=confidence,
        phases=phases,
        metrics={
            "frames_analyzed": len(frames),
            "valid_pose_frames": valid_frames,
            "video_duration_ms": metadata.duration_ms,
        },
        rubric=rubric,
    )

    return result, metadata


def generate_mock_result() -> AnalysisResult:
    """Generate mock analysis result for DEV_SKIP_ANALYSIS mode."""
    return AnalysisResult(
        criteria_version="v1",
        overall_score=78,
        analysis_confidence=0.95,
        phases=[
            PhaseTimestamp("address", 0, 0),
            PhaseTimestamp("top", 45, 1500),
            PhaseTimestamp("impact", 60, 2000),
            PhaseTimestamp("finish", 90, 3000),
        ],
        metrics={
            "frames_analyzed": 90,
            "valid_pose_frames": 85,
            "video_duration_ms": 3000,
        },
        rubric=[
            RubricItem("Head Stability", 85, 100, "Good head stability with minimal movement"),
            RubricItem("Hip Sway Control", 70, 100, "Moderate hip sway, try to rotate rather than slide"),
            RubricItem("Spine Angle", 80, 100, "Good spine angle consistency"),
            RubricItem("Tempo", 75, 100, "Good tempo with 2.8:1 ratio"),
            RubricItem("Early Extension", 72, 100, "Minimal forward movement of hips"),
            RubricItem("Finish Balance", 88, 100, "Excellent balanced finish position"),
        ],
    )


def result_to_dict(result: AnalysisResult) -> dict:
    """Convert AnalysisResult to JSON-serializable dict."""
    return {
        "criteria_version": result.criteria_version,
        "overall_score": result.overall_score,
        "analysis_confidence": result.analysis_confidence,
        "phases": [asdict(p) for p in result.phases],
        "metrics": result.metrics,
        "rubric": [asdict(r) for r in result.rubric],
    }
