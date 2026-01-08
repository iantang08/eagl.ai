# eagl.ai API Service

FastAPI backend for the eagl.ai golf swing analysis app.

## Tech Stack

- Python 3.12
- FastAPI
- SQLAlchemy 2.0 + Alembic
- PostgreSQL
- Redis (for Celery task queue)
- JWT authentication
- boto3 for S3

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
export JWT_SECRET=dev-secret
export USE_LOCAL_STORAGE=true
export LOCAL_S3_DIR=./local_s3

# Run migrations
alembic upgrade head

# Run server
uvicorn app.main:app --reload
```

### With Docker

```bash
# From repo root
docker compose up api
docker compose exec api alembic upgrade head
```

## API Endpoints

### Authentication
- `POST /v1/auth/signup` - Create account
- `POST /v1/auth/login` - Login
- `GET /v1/auth/me` - Get current user

### Onboarding
- `POST /v1/onboarding/profile` - Create/update onboarding profile
- `GET /v1/onboarding/profile` - Get onboarding profile

### Subscriptions
- `GET /v1/subscriptions/status` - Get subscription status
- `POST /v1/subscriptions/rc_webhook` - RevenueCat webhook
- `POST /v1/subscriptions/dev_activate` - Dev-only subscription activation

### Uploads
- `POST /v1/uploads/presign` - Get presigned upload URL
- `PUT /v1/uploads/local/{s3_key}` - Local file upload (dev only)

### Videos
- `POST /v1/videos` - Create video record
- `GET /v1/videos` - List user's videos
- `GET /v1/videos/{video_id}` - Get video details

### Analysis
- `POST /v1/analysis_jobs` - Create analysis job
- `GET /v1/analysis_jobs/{job_id}` - Get job status
- `GET /v1/analysis_results/{result_id}` - Get analysis results

### Artifacts
- `GET /v1/artifacts/local/{s3_key}` - Serve local files (dev only)

## Testing

```bash
pytest tests/ -v
```

## Database Migrations

```bash
# Create new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback one migration
alembic downgrade -1
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| DATABASE_URL | PostgreSQL connection string | - |
| REDIS_URL | Redis connection string | - |
| JWT_SECRET | Secret for JWT signing | - |
| JWT_EXPIRATION_HOURS | Token expiration time | 168 (7 days) |
| USE_LOCAL_STORAGE | Use local filesystem instead of S3 | false |
| LOCAL_S3_DIR | Directory for local file storage | ./local_s3 |
| AWS_S3_BUCKET | S3 bucket for uploads | - |
| AWS_REGION | AWS region | us-east-1 |
| DEV_SKIP_ANALYSIS | Return mock analysis results | false |
| ENABLE_DEV_SUBSCRIPTION_ENDPOINT | Enable dev subscription endpoint | false |
