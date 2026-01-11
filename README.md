# eagl.ai

AI-powered golf swing analysis app. Upload a video of your swing and receive detailed feedback on form, tempo, and key positions.

## Architecture

```
eagl-ai/
├── apps/mobile/          # React Native iOS app
├── services/api/         # FastAPI backend
├── services/worker/      # Celery video analysis worker
├── infra/terraform/      # AWS infrastructure (skeleton)
├── docker-compose.yml    # Local development environment
└── Makefile              # Development commands
```

## Requirements

### System Dependencies
- **Node.js** 18+ and npm
- **Watchman** (for React Native file watching)
- **Xcode** 15+ (with iOS Simulator)
- **CocoaPods** (`sudo gem install cocoapods`)
- **Python** 3.12+
- **Docker** and Docker Compose

### macOS Setup
```bash
# Install Homebrew if not present
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install dependencies
brew install node watchman python@3.12
brew install --cask docker

# Install CocoaPods
sudo gem install cocoapods

# Install Xcode from App Store, then:
xcode-select --install
sudo xcodebuild -license accept
```

## Running Backend Locally

### 1. Start Docker Services
```bash
# Start all services (postgres, redis, api, worker)
make up

# View logs
make logs

# Run database migrations
make migrate
```

### 2. Verify API is Running
```bash
# Health check
curl http://localhost:8000/health

# Create a user
curl -X POST http://localhost:8000/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'

# Login
curl -X POST http://localhost:8000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'

# Get current user (use token from login response)
curl http://localhost:8000/v1/me \
  -H "Authorization: Bearer <access_token>"

# Request presigned upload URL
curl -X POST http://localhost:8000/v1/uploads/presign \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"filename": "swing.mp4", "content_type": "video/mp4"}'

# Upload video (local mode)
curl -X PUT "http://localhost:8000/v1/uploads/local/<s3_key>" \
  -H "Content-Type: video/mp4" \
  --data-binary @your_video.mp4

# Create video record
curl -X POST http://localhost:8000/v1/videos \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"s3_key": "<s3_key>"}'

# Create analysis job
curl -X POST http://localhost:8000/v1/analysis_jobs \
  -H "Authorization: Bearer <access_token>" \
  -H "Content-Type: application/json" \
  -d '{"video_id": "<video_id>"}'

# Check job status
curl http://localhost:8000/v1/analysis_jobs/<job_id> \
  -H "Authorization: Bearer <access_token>"

# Get analysis results
curl http://localhost:8000/v1/analysis_results/<result_id> \
  -H "Authorization: Bearer <access_token>"
```

### 3. Run Tests
```bash
make test-api
make test-worker
make lint
```

## Running Mobile App Locally

### 1. Install Dependencies
```bash
make mobile-install

# Or manually:
cd apps/mobile
npm install
cd ios && pod install && cd ..
```

### 2. Configure Environment
```bash
cd apps/mobile
cp .env.example .env

# Edit .env with your settings:
# API_BASE_URL=http://localhost:8000
# DEV_MODE=true
# DEV_SKIP_PAYWALL=true
# DEV_SKIP_ANALYSIS=false
# REVENUECAT_IOS_API_KEY=your_key_here
```

### 3. Start Metro Bundler
```bash
# In apps/mobile directory
npm start

# Or from root:
make mobile-ios
```

## Testing in Xcode (iOS Simulator)

### 1. Open Project in Xcode
```bash
cd apps/mobile/ios
open eaglai.xcworkspace
```

### 2. Select Simulator
- In Xcode, click the device dropdown (top left, next to the Run button)
- Select an iOS Simulator (e.g., "iPhone 15 Pro")

### 3. Build and Run
- Press `Cmd + R` or click the Play button
- Wait for the build to complete
- The app will launch in the simulator

### Troubleshooting Simulator Issues

**Pods not found:**
```bash
cd apps/mobile/ios
pod deintegrate
pod install
```

**Build errors after updating dependencies:**
```bash
cd apps/mobile
rm -rf node_modules ios/Pods ios/build
npm install
cd ios && pod install
```

**Metro bundler not connecting:**
- Ensure Metro is running (`npm start` in apps/mobile)
- In Simulator, press `Cmd + D` to open dev menu
- Select "Change Bundle Location" and enter `localhost:8081`

**Permission errors:**
- Reset simulator: Device > Erase All Content and Settings

## Testing on Physical iPhone

### 1. Apple Developer Setup
- Open Xcode > Preferences > Accounts
- Sign in with your Apple ID
- If you don't have a paid Developer account, you can use a free Personal Team

### 2. Configure Signing
- Open `apps/mobile/ios/eaglai.xcworkspace` in Xcode
- Select the "eaglai" project in the navigator
- Select the "eaglai" target
- Go to "Signing & Capabilities" tab
- Check "Automatically manage signing"
- Select your Team from the dropdown
- Change Bundle Identifier to something unique (e.g., `com.yourname.eaglai`)

### 3. Connect Device
- Connect iPhone via USB cable
- Trust the computer on your iPhone when prompted
- In Xcode, select your iPhone from the device dropdown

### 4. Trust Developer on Device
- First build will fail with "Untrusted Developer" error
- On iPhone: Settings > General > VPN & Device Management
- Trust your developer certificate

### 5. Configure Network Access
- The app needs to reach your development backend
- Find your Mac's local IP: `ifconfig | grep "inet " | grep -v 127.0.0.1`
- Update `.env`: `API_BASE_URL=http://YOUR_MAC_IP:8000`
- Ensure your iPhone and Mac are on the same network

### 6. Camera Roll Access
- When prompted, allow photo library access
- You can also grant access in iPhone Settings > Privacy > Photos

### Troubleshooting Physical Device

**"Unable to install" error:**
- Check that the Bundle Identifier is unique
- Try: Product > Clean Build Folder (Cmd + Shift + K)

**App crashes on launch:**
- Check Metro bundler is running and accessible
- Verify API_BASE_URL points to reachable address
- Check Xcode console for crash logs

**Can't connect to backend:**
- Verify Mac firewall allows incoming connections on port 8000
- Test with: `curl http://YOUR_MAC_IP:8000/health` from another device

## Makefile Commands

| Command | Description |
|---------|-------------|
| `make up` | Start all Docker services |
| `make down` | Stop all Docker services |
| `make logs` | View Docker service logs |
| `make migrate` | Run database migrations |
| `make test-api` | Run API tests |
| `make test-worker` | Run worker tests |
| `make lint` | Run linter (ruff) |
| `make mobile-install` | Install mobile dependencies + pods |
| `make mobile-ios` | Run iOS app |
| `make mobile-clean` | Clean mobile build artifacts |

## Environment Variables

### Backend (services/api/.env)
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/eaglai
REDIS_URL=redis://localhost:6379/0
JWT_SECRET=your-secret-key
LOCAL_S3_DIR=./local_s3
AWS_S3_BUCKET=eaglai-uploads
AWS_REGION=us-east-1
USE_LOCAL_STORAGE=true
DEV_SKIP_ANALYSIS=false
ENABLE_DEV_SUBSCRIPTION_ENDPOINT=true
```

### Mobile (apps/mobile/.env)
```
API_BASE_URL=http://localhost:8000
DEV_MODE=true
DEV_SKIP_PAYWALL=true
DEV_SKIP_ANALYSIS=false
REVENUECAT_IOS_API_KEY=
```

## License

Proprietary - All Rights Reserved
