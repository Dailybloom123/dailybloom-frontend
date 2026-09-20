# Mobile App Setup Instructions

## Android Configuration Complete ✅

The Android platform has been successfully configured with Capacitor for DailyBloom.

### Completed Setup:
- ✅ Capacitor CLI installed
- ✅ Core Capacitor packages installed
- ✅ Native Android platform added
- ✅ Required permissions configured (GPS, Camera, Storage, Notifications)
- ✅ Capacitor plugins installed:
  - @capacitor/camera (for delivery photo proofs)
  - @capacitor/geolocation (for GPS tracking)
  - @capacitor/push-notifications (for notifications)
  - @capacitor/local-notifications (for local alerts)

### Build Instructions:

```bash
# Sync the web assets to native project
npx cap sync android

# Open Android Studio
npx cap open android

# Build APK
cd android
./gradlew assembleDebug

# Build release APK
./gradlew assembleRelease
```

### Required for Production:
1. Generate app icons and splash screens using:
   - https://appicon.co/
   - Or Capacitor Assets CLI: `npx @capacitor/assets generate`

2. Configure push notifications in Firebase Console:
   - Create Firebase project
   - Add Android app
   - Download google-services.json
   - Place in android/app/src/

3. Configure Google Maps API key:
   - Get API key from Google Cloud Console
   - Add to android/app/src/main/res/values/google_maps_api.xml

### iOS Setup (Optional):
```bash
npm install @capacitor/ios
npx cap add ios
npx cap sync ios
npx cap open ios
```

Note: iOS requires macOS with Xcode to build.
