# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

eagl.ai is an AI-powered golf swing analysis app. Users upload swing videos via a React Native iOS app, which are processed by a Python backend using MediaPipe pose estimation. The system provides detailed feedback on swing mechanics through a scoring rubric.

## Architecture

```
eagl-ai/
├── apps/mobile/          # React Native iOS app (TypeScript)
├── services/api/         # FastAPI backend API
├── services/worker/      # Celery video analysis worker
├── infra/terraform/      # AWS infrastructure skeleton
├── local_s3/             # Local file storage (dev mode)
├── docker-compose.yml    # Local dev environment
└── Makefile              # Development commands
```

### Tech Stack
- **Mobile**: React Native 0.73+, TypeScript, Zustand, React Native Paper, RevenueCat
- **API**: Python 3.12, FastAPI, SQLAlchemy 2.0, Alembic, PostgreSQL, Redis
- **Worker**: Celery, MediaPipe Pose, OpenCV, ffmpeg

## Common Commands

```bash
# Start all backend services
make up

# Stop services
make down

# View logs
make logs

# Run database migrations
make migrate

# Create new migration
make migrate-new name="description_here"

# Run all API tests
make test-api

# Run all worker tests
make test-worker

# Run a single test file
docker-compose exec api pytest tests/test_auth.py -v
docker-compose exec worker pytest tests/test_analysis.py -v

# Run a single test function
docker-compose exec api pytest tests/test_auth.py::test_signup -v

# Lint and auto-fix
make lint
make lint-fix

# Shell access
make shell-api     # bash inside api container
make shell-worker  # bash inside worker container
make shell-db      # psql into database

# Full reset (clears database and local storage)
make reset
```

### Mobile Commands

```bash
make mobile-install  # Install deps + pods
make mobile-ios      # Run on iOS simulator
make mobile-start    # Start Metro bundler only
make mobile-clean    # Clean build artifacts

# From apps/mobile/:
npm test            # Run tests
npm run lint        # ESLint
npm start -- --reset-cache  # Clear Metro cache
```

## Development Modes

### Local Storage Mode (default)
Set `USE_LOCAL_STORAGE=true` in backend. Files stored in `local_s3/` directory, presigned URLs point to local API endpoints. No AWS credentials needed.

### Mock Analysis Mode
Set `DEV_SKIP_ANALYSIS=true` in worker. Returns instant mock results without video processing. Useful for UI/API development.

### Paywall Bypass
Set `DEV_SKIP_PAYWALL=true` in mobile `.env`. Skips subscription and shows "Simulate Purchase" button.

## Code Organization

### API (services/api/app/)
- `routers/` - FastAPI route handlers (auth, videos, analysis, etc.)
- `models/` - SQLAlchemy ORM models
- `schemas/` - Pydantic request/response schemas
- `services/` - Business logic (auth, storage)
- `main.py` - App initialization and router mounting

### Worker (services/worker/worker/)
- `tasks.py` - Celery task definitions
- `analysis.py` - Core video analysis pipeline using MediaPipe
- `storage.py` - S3/local file operations

### Mobile (apps/mobile/src/)
- `screens/` - Screen components (onboarding/, main/)
- `navigation/` - React Navigation setup
- `store/` - Zustand state management
- `api/` - Axios client and endpoint calls

## Analysis Pipeline

The worker processes videos through: frame extraction → MediaPipe pose detection → temporal smoothing → phase detection (address/top/impact/finish) → rubric scoring (head stability, hip sway, spine angle, tempo, early extension, finish balance) → thumbnail generation.

## Key Patterns

- **Auth**: JWT tokens (HS256), 7-day expiration, Bearer header
- **Storage**: `storage.py` abstracts S3 vs local filesystem based on `USE_LOCAL_STORAGE`
- **Async jobs**: API creates `analysis_jobs` record → Celery task runs analysis → updates `analysis_results`
- **Subscriptions**: RevenueCat webhooks update `subscriptions` table; dev endpoint for testing
