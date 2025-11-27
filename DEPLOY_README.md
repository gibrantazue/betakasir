# 🚀 BetaKasir Deployment

## Quick Commands

```bash
# PWA (Gratis - iOS + Android + Desktop)
npm run deploy-pwa

# Android (Play Store - $25 sekali)
eas build --platform android --profile production

# iOS TestFlight (Beta - $99/tahun)
npm run build-ios

# iOS App Store (Production - $99/tahun)
npm run build-ios-prod

# Windows Desktop (Gratis)
npm run build-electron

# macOS Desktop (Gratis)
npm run build-mac
```

## 📚 Documentation

- **DEPLOYMENT_QUICK_START.md** - Panduan singkat semua platform
- **DEPLOYMENT_GUIDE_PWA_IOS.md** - Guide lengkap PWA & iOS
- **BUILD_MACOS_GUIDE.md** - Guide build macOS

## 💰 Cost Summary

| Platform | One-time | Annual | Total Year 1 |
|----------|----------|--------|--------------|
| PWA | Rp 0 | Rp 0 | **Rp 0** |
| Android | Rp 390k | Rp 0 | **Rp 390k** |
| iOS | Rp 1.5jt | Rp 1.5jt | **Rp 1.5jt** |
| Desktop | Rp 0 | Rp 0 | **Rp 0** |
| **All** | **Rp 1.9jt** | **Rp 1.5jt** | **Rp 1.9jt** |

## 🎯 Recommended Path

### Start (Month 1-2): PWA Only - Rp 0
```bash
npm run deploy-pwa
```
- Validate product-market fit
- Get early user feedback
- Zero cost, maximum learning

### Growth (Month 3-4): Add Android - Rp 390k
```bash
eas build --platform android
```
- 70% Indonesian market uses Android
- One-time $25 payment
- iOS users still use PWA

### Scale (Month 5+): Add iOS - Rp 1.5jt
```bash
npm run build-ios-prod
```
- Premium market segment
- Full platform coverage
- Maximum reach

## 🆘 Need Help?

1. Check error message
2. Read relevant guide in docs/
3. Check EAS/Firebase console
4. Google the error
5. Ask in Expo/Firebase community

## ✅ Pre-deployment Checklist

- [ ] Test app thoroughly
- [ ] Update version in app.json
- [ ] Prepare app icons (192x192, 512x512)
- [ ] Write app description
- [ ] Take screenshots
- [ ] Setup Firebase project
- [ ] Configure environment variables
- [ ] Test on real devices
- [ ] Prepare privacy policy
- [ ] Setup analytics

## 🔗 Useful Links

- Firebase Console: https://console.firebase.google.com
- Expo Dashboard: https://expo.dev
- Play Console: https://play.google.com/console
- App Store Connect: https://appstoreconnect.apple.com
- Apple Developer: https://developer.apple.com

---

**Good luck! 🚀**
