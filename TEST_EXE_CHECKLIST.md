# Test EXE Checklist - BetaKasir

## 🎯 Tujuan: Membuktikan API Berfungsi di EXE

---

## 📋 Pre-Test Checklist

- [ ] Node.js installed
- [ ] npm dependencies installed (`npm install`)
- [ ] Internet connection active
- [ ] Disk space > 500MB (untuk build)

---

## 🔨 Step 1: Build EXE

### Command:
```bash
npm run build-electron
```

### Expected Output:
```
✔ Building web version...
✔ Fixing HTML paths...
✔ Fixing favicon...
✔ Building Electron app...
✔ Packaging for Windows...
✔ Creating installer...

Output: dist/BetaKasir Setup 1.2.1.exe
```

### Time: ~5-10 minutes

---

## 📦 Step 2: Install EXE

1. Navigate to `dist/` folder
2. Double-click `BetaKasir Setup 1.2.1.exe`
3. Follow installation wizard
4. Launch application

---

## 🧪 Step 3: Test APIs

### Test 1: Firebase Authentication ✅

**Action:**
1. Open BetaKasir.exe
2. Click "Register" or "Login"
3. Enter email & password
4. Click "Login"

**Expected Result:**
- ✅ Login successful
- ✅ Redirected to Home screen
- ✅ User data loaded

**If Failed:**
- ❌ Error: "Firebase not initialized"
- ❌ Error: "Invalid API key"
- 🔍 Check: DevTools Console (Ctrl+Shift+I)

---

### Test 2: Firestore Database ✅

**Action:**
1. Go to "Produk" tab
2. Click "Tambah Produk"
3. Fill product details
4. Click "Simpan"
5. Close app
6. Open app again
7. Check if product still exists

**Expected Result:**
- ✅ Product saved successfully
- ✅ Product persists after restart
- ✅ Real-time sync working

**If Failed:**
- ❌ Error: "Firestore not initialized"
- ❌ Product disappears after restart
- 🔍 Check: Internet connection

---

### Test 3: Gemini AI ✅

**Action:**
1. Click AI Assistant button (bottom right)
2. Type: "Halo, apa kabar?"
3. Press Enter
4. Wait for response

**Expected Result:**
- ✅ AI responds in Indonesian
- ✅ Response is relevant
- ✅ No error messages

**If Failed:**
- ❌ Error: "API key invalid"
- ❌ Error: "Quota exceeded"
- 🔍 Check: Gemini API Console

---

### Test 4: GitHub Auto-Update ✅

**Action:**
1. Go to Settings
2. Click "Cek Update"
3. Wait for response

**Expected Result:**
- ✅ Dialog appears: "Sudah Terbaru" or "Update Tersedia"
- ✅ No error messages
- ✅ Version check working

**If Failed:**
- ❌ Error: "Cannot check for updates"
- ❌ No dialog appears
- 🔍 Check: GitHub API rate limit

---

### Test 5: Firebase Storage ✅

**Action:**
1. Go to "Produk" tab
2. Click "Tambah Produk"
3. Click "Upload Gambar"
4. Select image file
5. Click "Simpan"

**Expected Result:**
- ✅ Image uploaded successfully
- ✅ Image displays in product list
- ✅ Image URL saved to Firestore

**If Failed:**
- ❌ Error: "Upload failed"
- ❌ Image not displaying
- 🔍 Check: Firebase Storage rules

---

## 🔍 Advanced Testing

### Test DevTools Console

1. Open EXE
2. Press `Ctrl + Shift + I`
3. Go to Console tab
4. Look for initialization logs:

**Expected Logs:**
```
🔥 Initializing Firebase...
🔥 Project: betakasir
🔥 Platform: web
✅ Firebase app initialized
✅ Firebase Auth initialized
✅ Firestore initialized
✅ Firebase Storage initialized
```

**If No Logs:**
- ❌ API keys not loaded
- 🔍 Check: Build process

---

### Test Network Tab

1. Open DevTools (Ctrl+Shift+I)
2. Go to Network tab
3. Perform actions (login, add product, etc.)
4. Check API calls:

**Expected Requests:**
```
✅ identitytoolkit.googleapis.com (Firebase Auth)
✅ firestore.googleapis.com (Firestore)
✅ firebasestorage.googleapis.com (Storage)
✅ generativelanguage.googleapis.com (Gemini AI)
✅ api.github.com (GitHub)
```

**If Failed:**
- ❌ Requests blocked (CORS error)
- ❌ 401/403 errors (Auth failed)
- 🔍 Check: API keys validity

---

## 📊 Test Results Template

### Test Summary:

| Test | Status | Notes |
|------|--------|-------|
| Firebase Auth | ⬜ Pass / ⬜ Fail | |
| Firestore | ⬜ Pass / ⬜ Fail | |
| Gemini AI | ⬜ Pass / ⬜ Fail | |
| GitHub API | ⬜ Pass / ⬜ Fail | |
| Firebase Storage | ⬜ Pass / ⬜ Fail | |

### Overall Status:
- ⬜ All tests passed ✅
- ⬜ Some tests failed ⚠️
- ⬜ All tests failed ❌

---

## 🐛 Troubleshooting

### Problem: "Firebase not initialized"

**Solution:**
1. Check `src/config/firebase.ts` has API keys
2. Rebuild: `npm run build-electron`
3. Reinstall EXE

### Problem: "Network error"

**Solution:**
1. Check internet connection
2. Check firewall settings
3. Try different network

### Problem: "API key invalid"

**Solution:**
1. Verify API keys in Firebase Console
2. Check API key restrictions
3. Regenerate API keys if needed

### Problem: "Quota exceeded"

**Solution:**
1. Check Firebase Console usage
2. Check Gemini AI Console quota
3. Wait for quota reset (daily)

---

## ✅ Success Criteria

### Minimum Requirements:
- ✅ Firebase Auth working
- ✅ Firestore working
- ✅ Basic features working

### Full Success:
- ✅ All 5 tests passed
- ✅ No errors in console
- ✅ All features working smoothly

---

## 📝 Report Template

```
=== BetaKasir EXE Test Report ===

Date: [DATE]
Version: 1.2.1
Tester: [NAME]

Build Status:
- Build time: [TIME]
- Build size: [SIZE]
- Build success: [YES/NO]

Test Results:
1. Firebase Auth: [PASS/FAIL]
2. Firestore: [PASS/FAIL]
3. Gemini AI: [PASS/FAIL]
4. GitHub API: [PASS/FAIL]
5. Firebase Storage: [PASS/FAIL]

Issues Found:
- [LIST ISSUES]

Conclusion:
- [READY/NOT READY] for production

Tested by: [NAME]
Signature: [SIGNATURE]
```

---

## 🚀 Next Steps After Testing

### If All Tests Pass:
1. ✅ Mark as production-ready
2. ✅ Create release notes
3. ✅ Upload to GitHub Releases
4. ✅ Distribute to users

### If Some Tests Fail:
1. 🔍 Debug issues
2. 🔧 Fix problems
3. 🔄 Rebuild and retest
4. 📝 Document fixes

---

## 📞 Support

If you encounter issues during testing:

**Developer:**
- Name: Gibran Ade Bintang
- WhatsApp: +62 813-4007-8956
- Email: gibran@betakasir.com

**Resources:**
- Firebase Console: https://console.firebase.google.com
- Gemini AI Console: https://makersuite.google.com
- GitHub Releases: https://github.com/gibrantazue/betakasir/releases

---

**Status:** 📋 Ready for Testing  
**Last Updated:** 2025-01-24
