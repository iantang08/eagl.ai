# eagl.ai Worker Service

Celery worker for asynchronous video analysis.

## Tech Stack

- Python 3.12
- Celery
- Redis (broker)
- MediaPipe Pose
- OpenCV
- ffmpeg/ffprobe

## Analysis Pipeline

1. **Download** - Fetch video from S3/local storage
2. **Metadata** - Extract video properties via ffprobe
3. **Frame Extraction** - Sample frames (max 300) from video
4. **Pose Detection** - Run MediaPipe Pose on each frame
5. **Smoothing** - Apply temporal smoothing to landmarks
6. **Phase Detection** - Identify address/top/impact/finish positions
7. **Rubric Scoring** - Calculate scores for each criterion:
   - Head Stability
   - Hip Sway Control
   - Spine Angle Consistency
   - Tempo (backswing:downswing ratio)
   - Early Extension
   - Finish Balance
8. **Thumbnail** - Generate thumbnail at impact frame
9. **Upload** - Store results JSON and thumbnail
10. **Complete** - Update database with results

## Development

### Local Development (without Docker)

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -e ".[dev]"

# Set environment variables
export DATABASE_URL=postgresql://postgres:postgres@localhost:5432/eaglai
export REDIS_URL=redis://localhost:6379/0
export USE_LOCAL_STORAGE=true
export LOCAL_S3_DIR=./local_s3

# Run worker
celery -A worker.celery_app worker --loglevel=info
```

### With Docker

```bash
# From repo root
docker compose up worker
```

## Testing

```bash
pytest tests/ -v
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | - |
| REDIS_URL | Redis connection string | - |
| USE_LOCAL_STORAGE | Use local filesystem | false |
| LOCAL_S3_DIR | Local storage directory | ./local_s3 |
| AWS_S3_BUCKET | S3 bucket for uploads | - |
| AWS_REGION | AWS region | us-east-1 |
| DEV_SKIP_ANALYSIS | Return mock results | false |
| MAX_FRAMES | Max frames to analyze | 300 |

## Mock Analysis Mode

Set `DEV_SKIP_ANALYSIS=true` to bypass actual video processing and return mock results instantly. Useful for:
- Testing the full flow without video files
- Development without MediaPipe dependencies
- Faster iteration on frontend/API changes

## Results Format

```json
{
  "criteria_version": "v1",
  "overall_score": 78,
  "analysis_confidence": 0.95,
  "phases": [
    {"name": "address", "frame": 0, "timestamp_ms": 0},
    {"name": "top", "frame": 45, "timestamp_ms": 1500},
    {"name": "impact", "frame": 60, "timestamp_ms": 2000},
    {"name": "finish", "frame": 90, "timestamp_ms": 3000}
  ],
  "metrics": {
    "frames_analyzed": 90,
    "valid_pose_frames": 85,
    "video_duration_ms": 3000
  },
  "rubric": [
    {
      "name": "Head Stability",
      "score": 85,
      "max_score": 100,
      "explanation": "Good head stability with minimal movement",
      "timestamp_ms": null
    }
  ]
}
```
