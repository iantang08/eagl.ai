# eagl.ai Mobile App

React Native iOS app for golf swing analysis.

## Tech Stack

- React Native 0.73
- TypeScript
- React Navigation (stack + bottom tabs)
- Zustand (state management)
- React Native Paper (UI components)
- Axios (API client)
- RevenueCat (subscriptions)
- react-native-video (video playback)
- react-native-image-picker (video selection)

## Prerequisites

- Node.js 18+
- Watchman
- Xcode 15+
- CocoaPods
- iOS Simulator or physical device

## Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Install iOS Pods

```bash
cd ios && pod install && cd ..
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your settings:
```
API_BASE_URL=http://localhost:8000
DEV_MODE=true
DEV_SKIP_PAYWALL=true
DEV_SKIP_ANALYSIS=false
REVENUECAT_IOS_API_KEY=
```

## Running the App

### iOS Simulator

```bash
npm run ios
```

Or open in Xcode:
```bash
open ios/eaglai.xcworkspace
```

Then select a simulator and press `Cmd + R`.

### Physical Device

1. Open `ios/eaglai.xcworkspace` in Xcode
2. Select your device from the dropdown
3. Configure signing (see root README for details)
4. Press `Cmd + R`

## Environment Variables

| Variable | Description |
|----------|-------------|
| API_BASE_URL | Backend API URL |
| DEV_MODE | Enable dev features |
| DEV_SKIP_PAYWALL | Bypass paywall in dev |
| DEV_SKIP_ANALYSIS | Not used in app (backend flag) |
| REVENUECAT_IOS_API_KEY | RevenueCat API key |

## App Flow

1. **Onboarding** (10 screens)
   - Welcome
   - Goals selection
   - Skill level
   - Dominant hand
   - Typical miss
   - Equipment focus
   - Practice frequency
   - Filming tips
   - Account creation
   - Summary

2. **Paywall** (if not subscribed)
   - Subscription options
   - Dev bypass button (DEV_MODE only)
   - Restore purchases

3. **Main App**
   - Home: Upload videos, view analyses
   - Profile: Account info, subscription status

4. **Analysis Detail**
   - Overall score
   - Phase timestamps
   - Rubric breakdown
   - Detailed metrics

## Project Structure

```
src/
├── api/          # API client and endpoints
├── components/   # Reusable UI components
├── navigation/   # Navigation configuration
├── screens/      # Screen components
│   ├── onboarding/
│   └── main/
├── store/        # Zustand state store
├── types/        # TypeScript types
├── utils/        # Utility functions
└── config.ts     # App configuration
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm start` | Start Metro bundler |
| `npm run ios` | Run on iOS simulator |
| `npm run android` | Run on Android emulator |
| `npm test` | Run tests |
| `npm run lint` | Run ESLint |
| `npm run pod-install` | Install iOS pods |
| `npm run clean` | Clean build artifacts |
| `npm run reset` | Full clean and reinstall |

## Troubleshooting

### Metro bundler issues
```bash
npm start -- --reset-cache
```

### Pod issues
```bash
cd ios
pod deintegrate
pod install
```

### Build failures
```bash
npm run clean
npm install
cd ios && pod install
```
