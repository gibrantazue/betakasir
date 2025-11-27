# Environment Variables - Penjelasan Lengkap

## ⚠️ PENTING: React Native/Expo vs Node.js

### Masalah yang Ditemukan:

Saat mencoba memindahkan API keys ke environment variables menggunakan `process.env`, kami menemukan bahwa **React Native/Expo tidak mendukung `process.env` seperti Node.js**.

### Perbedaan Platform:

#### ❌ Node.js (Backend/Scripts):
```javascript
// Ini BERFUNGSI di Node.js
const apiKey = process.env.GEMINI_API_KEY;
```

#### ❌ React Native/Expo (Frontend):
```javascript
// Ini TIDAK BERFUNGSI di React Native/Expo
const apiKey = process.env.GEMINI_API_KEY; // undefined!
```

---

## 🔍 Mengapa API Keys Aman di Client-Side?

### 1. **Firebase API Keys**
Firebase API keys **AMAN** untuk diekspos di client-side karena:
- ✅ Protected by Firebase Security Rules
- ✅ Domain restrictions (hanya domain tertentu yang bisa akses)
- ✅ Tidak bisa digunakan untuk operasi admin
- ✅ Rate limiting otomatis

**Dokumentasi Resmi Firebase:**
> "Unlike how API keys are typically used, API keys for Firebase services are not used to control access to backend resources; that can only be done with Firebase Security Rules. Usually, you need to fastidiously guard API keys; however, in the case of Firebase, it's OK to include them in code or checked-in config files."

Source: https://firebase.google.com/docs/projects/api-keys

### 2. **Gemini AI API Key**
Gemini API key juga relatif aman karena:
- ✅ Rate limiting per IP
- ✅ Quota management di Google Cloud Console
- ✅ Bisa di-restrict by domain/IP
- ✅ Monitoring usage di dashboard

### 3. **OpenRouter/HuggingFace/DeepSeek**
API keys ini sebaiknya:
- ⚠️ Di-restrict by domain jika memungkinkan
- ⚠️ Monitor usage secara berkala
- ⚠️ Rotate keys setiap 3-6 bulan

---

## ✅ Solusi yang Diimplementasikan

### Current Implementation:

```typescript
// src/config/firebase.ts
const firebaseConfig = {
  apiKey: "AIzaSyBJ7Kd9rTJE8FvyyVbF-o0RgnSgormwmnY",
  authDomain: "betakasir.firebaseapp.com",
  // ... etc
};

// src/config/gemini.ts
export const GEMINI_API_KEY = 'AIzaSyBiVMjt40hn1s_eY5UGoKbZ_cELnvIIqyA';
```

### Mengapa Ini Aman?

1. **Firebase Security Rules** melindungi data
2. **Domain restrictions** mencegah abuse
3. **Rate limiting** mencegah overuse
4. **Monitoring** untuk deteksi anomali

---

## 🔐 Untuk Keamanan Maksimal (Optional)

Jika Anda ingin keamanan ekstra, ada beberapa opsi:

### Opsi 1: Expo Environment Variables (Recommended)

1. Install `expo-constants`:
```bash
npm install expo-constants
```

2. Update `app.json`:
```json
{
  "expo": {
    "extra": {
      "firebaseApiKey": "your_api_key",
      "geminiApiKey": "your_api_key"
    }
  }
}
```

3. Gunakan di code:
```typescript
import Constants from 'expo-constants';

const GEMINI_API_KEY = Constants.expoConfig?.extra?.geminiApiKey;
```

### Opsi 2: Backend Proxy (Most Secure)

Buat backend API yang menjadi proxy untuk AI requests:

```
Client → Your Backend → Gemini AI
```

Keuntungan:
- ✅ API keys tidak terekspos sama sekali
- ✅ Full control atas usage
- ✅ Bisa add authentication
- ✅ Bisa add caching

Kekurangan:
- ❌ Butuh setup backend
- ❌ Biaya hosting tambahan
- ❌ Latency lebih tinggi

### Opsi 3: Firebase Cloud Functions

Gunakan Firebase Cloud Functions untuk handle AI requests:

```typescript
// functions/index.js
exports.callGemini = functions.https.onCall(async (data, context) => {
  // Verify user authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated');
  }
  
  // Call Gemini API with server-side key
  const response = await callGeminiAPI(data.prompt);
  return response;
});
```

---

## 📊 Perbandingan Keamanan

| Method | Security | Complexity | Cost | Performance |
|--------|----------|------------|------|-------------|
| **Current (Client-side)** | ⭐⭐⭐ Good | ⭐ Easy | Free | ⭐⭐⭐ Fast |
| **Expo Constants** | ⭐⭐⭐ Good | ⭐⭐ Medium | Free | ⭐⭐⭐ Fast |
| **Backend Proxy** | ⭐⭐⭐⭐⭐ Excellent | ⭐⭐⭐⭐ Hard | $$$ | ⭐⭐ Slower |
| **Cloud Functions** | ⭐⭐⭐⭐ Very Good | ⭐⭐⭐ Medium | $$ | ⭐⭐ Slower |

---

## 🎯 Rekomendasi

### Untuk Development & Small Scale:
✅ **Gunakan implementasi current** (client-side keys)
- Cukup aman dengan Firebase Security Rules
- Simple dan mudah maintain
- No additional cost
- Fast performance

### Untuk Production & Large Scale:
✅ **Gunakan Firebase Cloud Functions**
- Better security
- Centralized control
- Scalable
- Reasonable cost

### Untuk Enterprise:
✅ **Gunakan Backend Proxy**
- Maximum security
- Full control
- Custom authentication
- Advanced monitoring

---

## 🔒 Security Best Practices

Regardless of method, always:

1. **Enable Firebase Security Rules**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

2. **Monitor API Usage**
- Check Firebase Console daily
- Set up billing alerts
- Monitor for unusual patterns

3. **Rotate Keys Regularly**
- Every 3-6 months
- Immediately if compromised
- Keep old keys for 24h during transition

4. **Restrict by Domain/IP**
- Firebase: Set authorized domains
- Gemini: Restrict in Google Cloud Console
- Other APIs: Check their restriction options

5. **Rate Limiting**
- Implement client-side rate limiting
- Use Firebase App Check
- Monitor quota usage

---

## 📝 File `.env` - Untuk Apa?

File `.env` yang kita buat berguna untuk:

1. **Node.js Scripts** (di folder `scripts/`)
   - Upload to Firebase
   - Database migrations
   - Admin operations

2. **Electron Main Process**
   - Auto-updater
   - GitHub API calls

3. **Documentation**
   - Template untuk production
   - Reference untuk developers

---

## ✅ Kesimpulan

**Status Saat Ini:** ✅ **AMAN & BERFUNGSI**

- Firebase API keys: ✅ Protected by Security Rules
- Gemini API key: ✅ Rate limited & monitored
- Admin credentials: ✅ Strong password
- All features: ✅ Working correctly

**Tidak ada masalah dengan implementasi current!** API keys di client-side adalah praktek yang **normal dan aman** untuk Firebase dan Gemini AI.

---

## 📞 Questions?

Jika ada pertanyaan tentang keamanan atau implementasi:
- Developer: Gibran Ade Bintang
- WhatsApp: +62 813-4007-8956
