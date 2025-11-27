# 📱 Panduan Build APK Android - BetaKasir

Panduan lengkap untuk build aplikasi BetaKasir menjadi APK yang bisa diinstall di Android (tablet & mobile).

## 🎯 Pilihan Build

### 1. Build dengan EAS (Recommended) ⭐
Build di cloud Expo, hasil profesional, support semua fitur.

### 2. Build Lokal
Build di komputer sendiri (lebih kompleks, butuh Android Studio).

---

## 📦 Metode 1: Build dengan EAS (Paling Mudah)

### Persiapan

1. **Install EAS CLI**
```bash
npm install -g eas-cli
```

2. **Login ke Expo**
```bash
eas login
```
Jika belum punya akun, daftar gratis di: https://expo.dev/signup

3. **Configure Project** (sudah dilakukan)
```bash
eas build:configure
```

### Build APK

#### A. Development Build (untuk testing)
```bash
npm run build-android-dev
```
atau
```bash
eas build --platform android --profile development
```

#### B. Preview Build (untuk distribusi internal)
```bash
npm run build-android
```
atau
```bash
eas build --platform android --profile preview
```

#### C. Production Build (untuk release)
```bash
npm run build-android-prod
```
atau
```bash
eas build --platform android --profile production
```

### Download & Install APK

1. Setelah build selesai (15-30 menit), buka dashboard:
   https://expo.dev/accounts/[your-account]/projects/betakasir/builds

2. Download APK file

3. Transfer ke Android device

4. Install APK:
   - Buka file APK di Android
   - Izinkan "Install from Unknown Sources" jika diminta
   - Tap Install

---

## 🔧 Metode 2: Build Lokal (Advanced)

### Persiapan

1. **Install Android Studio**
   - Download: https://developer.android.com/studio
   - Install Android SDK (API 33 atau lebih tinggi)

2. **Setup Environment Variables**
```bash
# Windows
setx ANDROID_HOME "C:\Users\[YourUsername]\AppData\Local\Android\Sdk"
setx PATH "%PATH%;%ANDROID_HOME%\platform-tools;%ANDROID_HOME%\tools"

# Mac/Linux
export ANDROID_HOME=$HOME/Library/Android/sdk
export PATH=$PATH:$ANDROID_HOME/platform-tools
export PATH=$PATH:$ANDROID_HOME/tools
```

3. **Install Dependencies**
```bash
npm install
```

### Build APK Lokal

```bash
# Generate Android project
npx expo prebuild --platform android

# Build APK
cd android
./gradlew assembleRelease

# APK akan ada di:
# android/app/build/outputs/apk/release/app-release.apk
```

---

## 📋 Script NPM yang Tersedia

Tambahkan ke `package.json`:

```json
{
  "scripts": {
    "build-android": "node scripts/buildAndroid.js preview",
    "build-android-dev": "node scripts/buildAndroid.js development",
    "build-android-prod": "node scripts/buildAndroid.js production"
  }
}
```

---

## 🎨 Kustomisasi APK

### Icon & Splash Screen

1. **Icon** - Ganti di `assets/icon.png` (1024x1024px)
2. **Adaptive Icon** - Ganti di `assets/adaptive-icon.png` (1024x1024px)
3. **Splash Screen** - Ganti di `assets/splash.png` (1284x2778px)

### App Name & Package

Edit `app.json`:
```json
{
  "expo": {
    "name": "BetaKasir",
    "android": {
      "package": "com.betakasir.app"
    }
  }
}
```

---

## 🔐 Signing APK (untuk Production)

### Generate Keystore

```bash
# Dengan EAS (otomatis)
eas credentials

# Manual
keytool -genkeypair -v -keystore betakasir.keystore -alias betakasir -keyalg RSA -keysize 2048 -validity 10000
```

### Configure Signing di EAS

```bash
eas credentials
# Pilih: Android > Production > Set up a new keystore
```

---

## 📱 Testing APK

### Di Emulator Android Studio

1. Buka Android Studio
2. Start emulator (AVD Manager)
3. Drag & drop APK ke emulator

### Di Device Fisik

1. Enable Developer Options:
   - Settings > About Phone
   - Tap "Build Number" 7x

2. Enable USB Debugging:
   - Settings > Developer Options
   - Enable "USB Debugging"

3. Install via ADB:
```bash
adb install path/to/app.apk
```

---

## 🚀 Distribusi APK

### Internal Testing

1. **Google Drive / Dropbox**
   - Upload APK
   - Share link ke tester

2. **Firebase App Distribution**
```bash
npm install -g firebase-tools
firebase appdistribution:distribute app.apk --app [APP_ID] --groups testers
```

### Public Release

1. **Google Play Store**
   - Buat akun developer ($25 one-time)
   - Upload APK/AAB
   - Submit untuk review

2. **Website Download**
   - Host APK di server
   - Buat landing page download

---

## ⚙️ Build Configuration

File `eas.json` sudah dikonfigurasi:

```json
{
  "build": {
    "development": {
      "developmentClient": true,
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "preview": {
      "distribution": "internal",
      "android": {
        "buildType": "apk"
      }
    },
    "production": {
      "android": {
        "buildType": "apk"
      }
    }
  }
}
```

### APK vs AAB

- **APK**: Universal, bisa langsung install
- **AAB**: Untuk Google Play Store (lebih kecil, optimized)

Untuk AAB, ubah `buildType` menjadi `"aab"` di `eas.json`.

---

## 🐛 Troubleshooting

### Build Gagal

1. **Check Expo account**
```bash
eas whoami
```

2. **Clear cache**
```bash
npm cache clean --force
rm -rf node_modules
npm install
```

3. **Check app.json**
   - Pastikan `package` name valid
   - Pastikan `version` format benar

### APK Tidak Bisa Install

1. **Enable Unknown Sources**
   - Settings > Security
   - Enable "Unknown Sources"

2. **Check Android Version**
   - Minimum: Android 5.0 (API 21)
   - Recommended: Android 8.0+ (API 26+)

3. **Check Storage Space**
   - Butuh minimal 100MB free space

### App Crash Setelah Install

1. **Check Permissions**
   - Camera, Storage permissions di `app.json`

2. **Check Firebase Config**
   - Pastikan `google-services.json` ada
   - Pastikan Firebase project configured

3. **Check Logs**
```bash
adb logcat | grep BetaKasir
```

---

## 📊 Build Size Optimization

### Reduce APK Size

1. **Enable Proguard** (minify code)
```json
// android/app/build.gradle
buildTypes {
  release {
    minifyEnabled true
    shrinkResources true
  }
}
```

2. **Remove Unused Assets**
   - Hapus gambar/font yang tidak dipakai
   - Compress images

3. **Split APK by ABI**
```json
// eas.json
"android": {
  "buildType": "apk",
  "gradleCommand": ":app:assembleRelease"
}
```

---

## 🎯 Quick Start

**Cara tercepat build APK:**

1. Install EAS CLI:
```bash
npm install -g eas-cli
```

2. Login:
```bash
eas login
```

3. Build:
```bash
npm run build-android
```

4. Tunggu 15-30 menit

5. Download APK dari dashboard Expo

6. Install di Android device

**Selesai!** 🎉

---

## 📞 Support

Jika ada masalah:
- Check dokumentasi Expo: https://docs.expo.dev/build/setup/
- EAS Build docs: https://docs.expo.dev/build/introduction/
- Forum Expo: https://forums.expo.dev/

---

## 📝 Checklist Build Production

- [ ] Update version di `app.json`
- [ ] Update version di `package.json`
- [ ] Test semua fitur di development build
- [ ] Generate production keystore
- [ ] Build production APK
- [ ] Test APK di berbagai device
- [ ] Prepare store listing (jika publish ke Play Store)
- [ ] Upload APK/AAB ke Play Store
- [ ] Submit untuk review

---

**Happy Building! 🚀**
