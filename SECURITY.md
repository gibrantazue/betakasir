# Security Guidelines - BetaKasir

## 🔒 Keamanan Aplikasi

### Environment Variables

**PENTING:** Semua credentials dan API keys harus disimpan di file `.env` dan **TIDAK BOLEH** di-commit ke repository.

### Setup Awal

1. Copy `.env.example` ke `.env`:
```bash
cp .env.example .env
```

2. Edit `.env` dan isi dengan credentials Anda:
```env
# Admin Credentials - WAJIB DIGANTI!
ADMIN_EMAIL=your_admin@email.com
ADMIN_PASSWORD=your_very_strong_password_min_12_chars

# Firebase Configuration
FIREBASE_API_KEY=your_firebase_api_key
FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
# ... dst
```

### Checklist Keamanan

#### ✅ Sebelum Production:

- [ ] Ganti `ADMIN_EMAIL` dan `ADMIN_PASSWORD` dengan credentials yang kuat
- [ ] Password minimal 12 karakter dengan kombinasi huruf, angka, dan simbol
- [ ] Pastikan `.env` ada di `.gitignore`
- [ ] Jangan hardcode API keys di source code
- [ ] Enable Firebase Security Rules
- [ ] Enable 2FA untuk admin account (jika tersedia)
- [ ] Rotate API keys secara berkala (setiap 3-6 bulan)

#### 🔐 Password Requirements:

- Minimal 12 karakter
- Kombinasi huruf besar dan kecil
- Minimal 1 angka
- Minimal 1 karakter spesial (!@#$%^&*)
- Tidak menggunakan kata umum atau tanggal lahir

#### 🚨 Jika API Key Terekspos:

1. **Segera revoke** API key yang terekspos
2. Generate API key baru
3. Update `.env` dengan key baru
4. Restart aplikasi
5. Monitor usage untuk aktivitas mencurigakan

### Firebase Security Rules

Pastikan Firestore rules sudah dikonfigurasi dengan benar:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users collection - only owner can read/write
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Sellers collection - only owner can read/write
    match /sellers/{sellerId} {
      allow read, write: if request.auth != null && request.auth.uid == sellerId;
      
      match /{document=**} {
        allow read, write: if request.auth != null && request.auth.uid == sellerId;
      }
    }
    
    // Admin only collections
    match /admin/{document=**} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

### API Rate Limiting

Implementasikan rate limiting untuk mencegah abuse:

- Max 100 requests per menit per user
- Max 1000 requests per jam per IP
- Temporary ban (1 jam) setelah 5 failed login attempts

### Monitoring & Logging

- Log semua admin actions
- Monitor failed login attempts
- Alert jika ada aktivitas mencurigakan
- Regular security audits

### Backup & Recovery

- Backup data setiap hari
- Simpan backup di lokasi terpisah
- Test restore procedure secara berkala
- Encrypt backup files

### Contact

Jika menemukan security vulnerability, segera hubungi:
- Email: security@betakasir.com
- WhatsApp: +62 813-4007-8956

**DO NOT** post security issues di public GitHub issues!

---

Last Updated: 2025-01-24
