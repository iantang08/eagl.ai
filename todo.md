# eagl.ai - Production Launch Checklist

## Current Status: ~90% Complete

The app is nearly ready for launch with all core features working:
- Full onboarding flow (10 screens)
- Authentication (signup/login)
- Video upload with real progress tracking
- AI swing analysis (MediaPipe pose detection)
- 6 rubric scoring metrics
- Paywall with RevenueCat integration
- Home/Profile screens with analysis results
- Proper error handling and validation

---

## 1. COMPLETED DEVELOPMENT TASKS

- [x] **CORS Security** - Now configurable via `CORS_ORIGINS` env var
- [x] **Upload Progress** - Real progress feedback with percentage display
- [x] **Error Messages** - User-friendly error messages throughout app
- [x] **Input Validation** - File size (100MB) and duration (30s) limits

---

## 2. REMAINING TASKS BEFORE LAUNCH

### Required for Launch

- [ ] **RevenueCat Setup** - Configure subscriptions (see Section 3)
- [ ] **App Icons** - Create all required icon sizes in `Images.xcassets`
- [ ] **Launch Screen** - Design launch screen in `LaunchScreen.storyboard`
- [ ] **Privacy Policy** - Create privacy policy page (required for subscriptions)
- [ ] **Test on Physical Device** - Full end-to-end testing (see Section 5)
- [ ] **Deploy Backend** - Set up production API (see Section 4)

### Nice to Have (Post-Launch)

- [ ] Video playback with phase overlay
- [ ] Analysis history/trends
- [ ] Export/share results
- [ ] Push notifications when analysis completes
- [ ] Personalized recommendations based on scores

---

## 3. REVENUECAT SETUP

### Step 1: Create RevenueCat Account
1. Go to https://www.revenuecat.com and create an account
2. Create a new project named "eagl.ai"

### Step 2: Configure iOS App
1. In RevenueCat dashboard, click "Apps" → "Add App"
2. Select "iOS" and enter:
   - App name: `eagl.ai`
   - Bundle ID: `com.eaglai.app` (or your actual bundle ID from Xcode)
3. Copy your **Public iOS API Key** (starts with `appl_`)

### Step 3: App Store Connect Setup
1. Log into [App Store Connect](https://appstoreconnect.apple.com)
2. Go to "My Apps" → Create new app (if not exists)
3. Navigate to "Subscriptions" → Create subscription group "eagl.ai Premium"
4. Add products:
   - **Monthly**: Product ID `eaglai_monthly_999` - $9.99/month
   - **Yearly**: Product ID `eaglai_yearly_4999` - $49.99/year
5. Fill in all required metadata (description, review notes)

### Step 4: Connect App Store to RevenueCat
1. In RevenueCat, go to your iOS app → "App Store Connect"
2. Add your App Store Connect API key:
   - Go to App Store Connect → Users & Access → Keys
   - Generate new API key with "Admin" access
   - Download the .p8 file
   - Enter Key ID, Issuer ID, and upload .p8 to RevenueCat
3. Enable "App Store Server Notifications":
   - Copy the RevenueCat webhook URL
   - In App Store Connect → App → App Information → App Store Server Notifications
   - Paste the RevenueCat URL

### Step 5: Create Entitlements & Offerings
1. In RevenueCat → Entitlements → Create "premium"
2. In RevenueCat → Products → Add:
   - `eaglai_monthly_999` → attach to "premium" entitlement
   - `eaglai_yearly_4999` → attach to "premium" entitlement
3. In RevenueCat → Offerings → Create "default" offering:
   - Add monthly package pointing to `eaglai_monthly_999`
   - Add annual package pointing to `eaglai_yearly_4999`

### Step 6: Update Mobile App
Edit `apps/mobile/.env`:
```
REVENUECAT_IOS_API_KEY=appl_YOUR_KEY_HERE
DEV_MODE=false
DEV_SKIP_PAYWALL=false
```

---

## 4. BACKEND PRODUCTION SETUP

### Option A: AWS Deployment (Recommended)

#### Required AWS Services:
- **RDS PostgreSQL** - Database
- **ElastiCache Redis** - Task queue
- **ECS Fargate** - API + Worker containers
- **S3** - Video/thumbnail storage
- **CloudFront** - CDN for S3 assets
- **Route 53** - DNS
- **ACM** - SSL certificates

#### Environment Variables for Production:
```bash
# Database
DATABASE_URL=postgresql://user:pass@your-rds-endpoint:5432/eaglai

# Redis
REDIS_URL=redis://your-elasticache-endpoint:6379/0

# Auth
JWT_SECRET=<generate-secure-256-bit-key>

# S3
USE_LOCAL_STORAGE=false
AWS_S3_BUCKET=eaglai-production-uploads
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=<your-key>
AWS_SECRET_ACCESS_KEY=<your-secret>

# CORS - your production domain
CORS_ORIGINS=https://app.eagl.ai,https://eagl.ai

# RevenueCat (for webhook validation)
REVENUECAT_WEBHOOK_SECRET=<from-revenuecat-dashboard>

# Production flags
ENABLE_DEV_SUBSCRIPTION_ENDPOINT=false
DEV_SKIP_ANALYSIS=false
```

#### Generate Secure JWT Secret:
```bash
openssl rand -hex 32
```

### Option B: Simpler Alternatives
- **Railway.app** - Easy Docker deployment (~$5-20/month)
- **Render.com** - Managed containers + PostgreSQL
- **Fly.io** - Edge deployment

---

## 5. TESTING ON PHYSICAL IPHONE

### Prerequisites
- Apple Developer account ($99/year for App Store publishing)
- iPhone connected via USB
- Xcode installed

### Step 1: Configure Signing
1. Open `apps/mobile/ios/eaglai.xcworkspace` in Xcode
2. Select "eaglai" project → "eaglai" target → "Signing & Capabilities"
3. Check "Automatically manage signing"
4. Select your Team (Apple Developer account)
5. Change Bundle Identifier to something unique: `com.yourname.eaglai`

### Step 2: Configure Network Access
Find your Mac's IP address:
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

Update `apps/mobile/.env`:
```
API_BASE_URL=http://YOUR_MAC_IP:8000
DEV_MODE=true
DEV_SKIP_PAYWALL=true
```

Ensure backend is running:
```bash
make up
```

### Step 3: Build and Run
1. Connect iPhone via USB
2. Trust the computer on your iPhone when prompted
3. Select your iPhone from Xcode device dropdown
4. Press `Cmd + R` to build and run
5. First run will fail - go to iPhone Settings → General → VPN & Device Management → Trust your developer certificate
6. Run again

### Step 4: Test Checklist
- [ ] Complete onboarding flow
- [ ] Create account
- [ ] Skip paywall (dev mode) or test purchase
- [ ] Upload a golf swing video from camera roll
- [ ] Verify upload progress shows correctly
- [ ] Wait for analysis to complete (~30 seconds)
- [ ] View analysis results
- [ ] Check all 6 rubric scores display
- [ ] Test error scenarios (no internet, large file, etc.)

---

## 6. APP STORE SUBMISSION

### Pre-Submission Checklist
- [ ] Update `apps/mobile/ios/eaglai/Info.plist`:
  - `CFBundleDisplayName`: "eagl.ai"
  - `CFBundleShortVersionString`: "1.0.0"
  - `NSPhotoLibraryUsageDescription`: "eagl.ai needs access to your photos to upload swing videos for analysis."
- [ ] Create app icons (all sizes) in `apps/mobile/ios/eaglai/Images.xcassets`
- [ ] Create launch screen in `LaunchScreen.storyboard`
- [ ] Test all flows on physical device
- [ ] Set production values in `.env`:
  ```
  API_BASE_URL=https://api.eagl.ai
  DEV_MODE=false
  DEV_SKIP_PAYWALL=false
  REVENUECAT_IOS_API_KEY=appl_xxxxx
  ```

### App Store Connect Setup
1. Create app in App Store Connect
2. Fill in app information:
   - Name: eagl.ai
   - Subtitle: AI Golf Swing Analysis
   - Description, keywords, categories
   - Screenshots (6.5" and 5.5" required)
   - App preview video (optional but recommended)
3. Set up subscriptions (see RevenueCat section)
4. Create privacy policy page (required for subscriptions)
5. Submit for review

### Archive and Upload
1. In Xcode: Product → Archive
2. Once complete, click "Distribute App"
3. Select "App Store Connect" → "Upload"
4. Follow prompts to upload
5. In App Store Connect, select the build and submit for review

---

## 7. PRODUCTION API KEYS SUMMARY

| Service | Where to Get | Environment Variable |
|---------|--------------|---------------------|
| RevenueCat | revenuecat.com dashboard | `REVENUECAT_IOS_API_KEY` |
| AWS S3 | AWS IAM console | `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` |
| PostgreSQL | Your hosting provider | `DATABASE_URL` |
| Redis | Your hosting provider | `REDIS_URL` |
| JWT Secret | Generate: `openssl rand -hex 32` | `JWT_SECRET` |

---

## 8. QUICK START COMMANDS

### Development
```bash
# Start backend
make up
make migrate
make logs

# Start mobile (iOS Simulator)
cd apps/mobile
npm install
cd ios && pod install && cd ..
npm start
# In another terminal: npm run ios
```

### Test API Health
```bash
curl http://localhost:8000/health
```

### Test Signup
```bash
curl -X POST http://localhost:8000/v1/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "password123"}'
```

---

## 9. POST-LAUNCH MONITORING

### Recommended Services
- **Sentry** - Error tracking (add `@sentry/react-native`)
- **RevenueCat Dashboard** - Subscription analytics
- **AWS CloudWatch** - Backend monitoring
- **Mixpanel/Amplitude** - User analytics

### Key Metrics to Track
- Signup → Subscription conversion rate
- Video upload success rate
- Analysis completion rate
- Daily active users
- Churn rate

---

## Questions?

If you get stuck:
1. Check backend logs: `make logs`
2. Check Xcode console for mobile errors
3. Test API directly: `curl http://localhost:8000/health`
