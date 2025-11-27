# Requirements Document - Employee Management System

## Introduction

Sistem manajemen karyawan untuk BetaKasir yang memungkinkan pemilik toko (Seller) untuk mengelola karyawan dengan role-based access control. Sistem ini mirip dengan yang digunakan di Indomaret dan Alfamart, di mana karyawan dapat login menggunakan ID card atau username/password untuk mengakses sistem kasir.

## Glossary

- **Seller**: Pemilik toko yang memiliki akses penuh ke semua fitur aplikasi
- **Employee/Karyawan**: Staff toko yang memiliki akses terbatas sesuai role yang diberikan
- **ID Card**: Kartu identitas karyawan yang dapat dicetak dan digunakan untuk login
- **Role**: Tingkat akses yang diberikan kepada user (Seller, Cashier, Manager, dll)
- **Permission**: Hak akses spesifik untuk fitur tertentu (view products, edit products, dll)
- **Employee Login**: Halaman login khusus untuk karyawan dengan scan ID atau input manual
- **QR Code/Barcode**: Kode unik pada ID card untuk login cepat

## Requirements

### Requirement 1: Role Management System

**User Story:** Sebagai Seller, saya ingin membuat dan mengelola role karyawan dengan hak akses yang berbeda, sehingga saya dapat mengontrol akses ke fitur-fitur aplikasi.

#### Acceptance Criteria

1. WHEN Seller membuka halaman Karyawan, THE System SHALL menampilkan daftar role yang tersedia (Seller, Manager, Cashier)
2. WHEN Seller membuat role baru, THE System SHALL memungkinkan Seller untuk memilih permission untuk role tersebut
3. THE System SHALL menyimpan role dengan permission yang telah ditentukan
4. WHEN Seller mengubah permission role, THE System SHALL memperbarui hak akses semua karyawan dengan role tersebut
5. THE System SHALL memiliki role default: Seller (full access), Manager (limited admin), Cashier (kasir only)

### Requirement 2: Employee Account Management

**User Story:** Sebagai Seller, saya ingin membuat akun karyawan dengan informasi lengkap, sehingga karyawan dapat login dan bekerja sesuai role mereka.

#### Acceptance Criteria

1. WHEN Seller klik tombol "Tambah Karyawan", THE System SHALL menampilkan form input data karyawan
2. THE System SHALL meminta input: Nama Lengkap, Username, Password, Email, No. Telepon, Alamat, Foto, Role
3. WHEN Seller submit form, THE System SHALL generate Employee ID unik untuk karyawan
4. THE System SHALL generate QR Code unik untuk ID card karyawan
5. THE System SHALL menyimpan data karyawan ke database dengan status "Active"
6. WHEN Seller ingin edit data karyawan, THE System SHALL memungkinkan perubahan semua field kecuali Employee ID
7. WHEN Seller ingin nonaktifkan karyawan, THE System SHALL mengubah status menjadi "Inactive" tanpa menghapus data

### Requirement 3: Employee Login System

**User Story:** Sebagai Karyawan, saya ingin login menggunakan ID card atau username/password, sehingga saya dapat mengakses sistem kasir dengan cepat.

#### Acceptance Criteria

1. WHEN aplikasi dibuka, THE System SHALL menampilkan pilihan "Login Seller" dan "Login Karyawan"
2. WHEN user pilih "Login Karyawan", THE System SHALL menampilkan halaman employee login
3. THE System SHALL menyediakan 2 metode login: Scan ID Card dan Manual Input
4. WHEN karyawan scan QR Code dari ID card, THE System SHALL otomatis login karyawan tersebut
5. WHEN karyawan input username dan password, THE System SHALL validasi kredensial dan login jika valid
6. IF kredensial salah, THEN THE System SHALL menampilkan error "Username atau Password salah"
7. IF karyawan status "Inactive", THEN THE System SHALL menolak login dengan pesan "Akun tidak aktif"
8. WHEN login berhasil, THE System SHALL redirect ke halaman sesuai role (Cashier → Kasir, Manager → Dashboard)

### Requirement 4: ID Card Generation and Printing

**User Story:** Sebagai Seller, saya ingin mencetak ID card karyawan langsung dari aplikasi, sehingga karyawan memiliki kartu identitas untuk login.

#### Acceptance Criteria

1. WHEN Seller klik "Cetak ID Card" pada data karyawan, THE System SHALL generate template ID card
2. THE System SHALL menampilkan preview ID card dengan: Foto, Nama, Employee ID, Role, QR Code
3. THE System SHALL menggunakan desain profesional mirip ID card Indomaret/Alfamart
4. WHEN Seller klik "Print", THE System SHALL membuka print dialog dengan ukuran ID card (85.6mm x 54mm)
5. THE System SHALL support print 2 sisi (depan: info karyawan, belakang: barcode besar + instruksi)
6. THE System SHALL menyimpan history cetak ID card dengan timestamp

### Requirement 5: Role-Based Access Control

**User Story:** Sebagai System, saya ingin membatasi akses fitur berdasarkan role user, sehingga karyawan hanya dapat mengakses fitur sesuai hak akses mereka.

#### Acceptance Criteria

1. WHEN user dengan role "Cashier" login, THE System SHALL hanya menampilkan menu: Kasir, Riwayat Transaksi (view only)
2. WHEN user dengan role "Manager" login, THE System SHALL menampilkan menu: Kasir, Produk, Transaksi, Laporan (view only)
3. WHEN user dengan role "Seller" login, THE System SHALL menampilkan semua menu dengan full access
4. IF user mencoba akses halaman tanpa permission, THEN THE System SHALL redirect ke halaman "Access Denied"
5. THE System SHALL menyembunyikan tombol/fitur yang tidak ada permission-nya
6. WHEN karyawan melakukan transaksi, THE System SHALL mencatat Employee ID sebagai cashier

### Requirement 6: Employee Dashboard

**User Story:** Sebagai Seller, saya ingin melihat daftar karyawan dengan informasi lengkap, sehingga saya dapat mengelola tim dengan mudah.

#### Acceptance Criteria

1. WHEN Seller buka halaman Karyawan, THE System SHALL menampilkan tabel karyawan dengan kolom: Foto, Nama, Employee ID, Role, Status, Aksi
2. THE System SHALL menampilkan jumlah total karyawan aktif dan non-aktif
3. WHEN Seller search karyawan, THE System SHALL filter berdasarkan nama atau employee ID
4. WHEN Seller klik karyawan, THE System SHALL menampilkan detail lengkap karyawan
5. THE System SHALL menampilkan statistik: Total transaksi per karyawan, Jam kerja, Performance

### Requirement 7: Employee Activity Log

**User Story:** Sebagai Seller, saya ingin melihat log aktivitas karyawan, sehingga saya dapat monitor kinerja dan keamanan.

#### Acceptance Criteria

1. WHEN karyawan login, THE System SHALL mencatat timestamp login dengan Employee ID
2. WHEN karyawan logout, THE System SHALL mencatat timestamp logout
3. WHEN karyawan melakukan transaksi, THE System SHALL mencatat transaksi dengan Employee ID
4. THE System SHALL menyimpan log: Login/Logout, Transaksi, Perubahan data
5. WHEN Seller buka Activity Log, THE System SHALL menampilkan history aktivitas dengan filter by karyawan dan tanggal

### Requirement 8: Quick Switch Employee (Shift Change)

**User Story:** Sebagai Karyawan, saya ingin logout dan login karyawan lain dengan cepat, sehingga pergantian shift dapat dilakukan dengan efisien.

#### Acceptance Criteria

1. WHEN karyawan klik "Ganti Kasir", THE System SHALL menampilkan employee login tanpa logout dari aplikasi
2. THE System SHALL menyimpan session sebelumnya dan membuat session baru untuk karyawan baru
3. WHEN shift change, THE System SHALL mencatat timestamp pergantian
4. THE System SHALL menampilkan notifikasi "Shift changed: [Nama Lama] → [Nama Baru]"

## Non-Functional Requirements

### Security
- Password karyawan harus di-hash menggunakan bcrypt
- QR Code harus unique dan tidak dapat diprediksi
- Session timeout setelah 8 jam untuk keamanan
- Seller password required untuk aksi sensitif (delete karyawan, change role)

### Performance
- Employee login harus selesai dalam < 2 detik
- QR Code scan harus instant (< 1 detik)
- ID Card print preview harus load dalam < 3 detik

### Usability
- Employee login UI harus simple dan mudah digunakan (seperti di Indomaret)
- ID Card design harus profesional dan mudah dibaca
- Font size pada ID card harus cukup besar untuk dibaca dari jarak 30cm

### Compatibility
- ID Card harus bisa dicetak di printer standar (A4) dan printer ID card
- QR Code harus bisa di-scan dengan barcode scanner hardware dan kamera
- Support offline mode untuk employee login (cache credentials)
