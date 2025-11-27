# Design Document - Employee Management System

## Overview

Sistem manajemen karyawan untuk BetaKasir yang mengimplementasikan role-based access control (RBAC) dengan fitur employee login menggunakan ID card scan atau manual input. Sistem ini dirancang untuk mendukung multi-user dengan permission yang dapat dikustomisasi, mirip dengan sistem yang digunakan di retail modern seperti Indomaret dan Alfamart.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     BetaKasir Application                    │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Seller     │  │   Manager    │  │   Cashier    │      │
│  │   (Owner)    │  │   (Admin)    │  │   (Staff)    │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                  │                  │               │
│         └──────────────────┴──────────────────┘               │
│                            │                                  │
│                   ┌────────▼────────┐                        │
│                   │  Auth Context   │                        │
│                   │  (Role Check)   │                        │
│                   └────────┬────────┘                        │
│                            │                                  │
│         ┌──────────────────┼──────────────────┐              │
│         │                  │                  │              │
│  ┌──────▼──────┐  ┌────────▼────────┐  ┌─────▼──────┐      │
│  │  Employee   │  │   Permission    │  │  Activity  │      │
│  │  Management │  │   Control       │  │  Logger    │      │
│  └─────────────┘  └─────────────────┘  └────────────┘      │
│                                                               │
├─────────────────────────────────────────────────────────────┤
│                      Data Layer                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  AsyncStorage│  │   Zustand    │  │   Firebase   │      │
│  │  (Local DB)  │  │   (State)    │  │  (Optional)  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Component Structure

```
src/
├── screens/
│   ├── EmployeesScreen.tsx          # Halaman utama manajemen karyawan
│   ├── EmployeeFormScreen.tsx       # Form tambah/edit karyawan
│   ├── EmployeeDetailScreen.tsx     # Detail karyawan
│   ├── EmployeeLoginScreen.tsx      # Login khusus karyawan
│   ├── RoleManagementScreen.tsx     # Kelola role dan permission
│   └── ActivityLogScreen.tsx        # Log aktivitas karyawan
├── components/
│   ├── EmployeeCard.tsx             # Card item karyawan
│   ├── IDCardTemplate.tsx           # Template ID card untuk print
│   ├── QRCodeScanner.tsx            # Scanner QR code
│   ├── PermissionGuard.tsx          # HOC untuk cek permission
│   └── RoleSelector.tsx             # Dropdown pilih role
├── context/
│   └── EmployeeAuthContext.tsx      # Context untuk employee session
├── hooks/
│   ├── usePermission.tsx            # Hook cek permission
│   └── useEmployeeSession.tsx       # Hook manage employee session
├── utils/
│   ├── generateQRCode.ts            # Generate QR code untuk ID
│   ├── generateEmployeeID.ts        # Generate unique employee ID
│   ├── hashPassword.ts              # Hash password dengan bcrypt
│   ├── printIDCard.ts               # Print ID card
│   └── permissions.ts               # Permission constants
└── types/
    └── employee.ts                  # TypeScript types
```

## Data Models

### Employee Type

```typescript
interface Employee {
  id: string;                    // Unique employee ID (auto-generated)
  employeeNumber: string;        // Display ID (e.g., "EMP001")
  username: string;              // Username untuk login (unique)
  password: string;              // Hashed password
  fullName: string;              // Nama lengkap
  email: string;                 // Email
  phone: string;                 // No. telepon
  address: string;               // Alamat lengkap
  photo: string;                 // URL/base64 foto
  role: EmployeeRole;            // Role karyawan
  qrCode: string;                // QR code untuk scan login
  status: 'active' | 'inactive'; // Status karyawan
  createdAt: string;             // Timestamp dibuat
  updatedAt: string;             // Timestamp update terakhir
  createdBy: string;             // ID seller yang buat
  lastLogin?: string;            // Timestamp login terakhir
  idCardPrintedAt?: string;      // Timestamp cetak ID card
}
```

### Role Type

```typescript
interface EmployeeRole {
  id: string;                    // Role ID
  name: string;                  // Nama role (Seller, Manager, Cashier)
  displayName: string;           // Display name (Pemilik, Manajer, Kasir)
  permissions: Permission[];     // Array permission
  isDefault: boolean;            // Apakah role default
  createdAt: string;
}

type Permission = 
  // Dashboard
  | 'view_dashboard'
  | 'view_analytics'
  
  // Products
  | 'view_products'
  | 'add_product'
  | 'edit_product'
  | 'delete_product'
  
  // Cashier
  | 'access_cashier'
  | 'process_transaction'
  | 'void_transaction'
  
  // Transactions
  | 'view_transactions'
  | 'view_transaction_detail'
  | 'delete_transaction'
  | 'export_transactions'
  
  // Customers
  | 'view_customers'
  | 'add_customer'
  | 'edit_customer'
  | 'delete_customer'
  
  // Reports
  | 'view_reports'
  | 'export_reports'
  
  // Employees
  | 'view_employees'
  | 'add_employee'
  | 'edit_employee'
  | 'delete_employee'
  | 'print_id_card'
  
  // Settings
  | 'view_settings'
  | 'edit_settings'
  
  // Roles
  | 'manage_roles'
  | 'manage_permissions';
```

### Activity Log Type

```typescript
interface ActivityLog {
  id: string;
  employeeId: string;            // ID karyawan
  employeeName: string;          // Nama karyawan
  action: ActivityAction;        // Jenis aktivitas
  description: string;           // Deskripsi aktivitas
  metadata?: any;                // Data tambahan (transaction ID, dll)
  timestamp: string;             // Waktu aktivitas
  ipAddress?: string;            // IP address (optional)
}

type ActivityAction =
  | 'login'
  | 'logout'
  | 'shift_change'
  | 'transaction_created'
  | 'transaction_voided'
  | 'product_added'
  | 'product_edited'
  | 'product_deleted'
  | 'settings_changed';
```

### Employee Session Type

```typescript
interface EmployeeSession {
  employee: Employee;            // Data karyawan
  loginTime: string;             // Waktu login
  lastActivity: string;          // Aktivitas terakhir
  sessionId: string;             // Unique session ID
  expiresAt: string;             // Waktu expire (8 jam)
}
```

## Components and Interfaces

### 1. EmployeesScreen (Main Dashboard)

**Purpose**: Halaman utama untuk mengelola karyawan

**Features**:
- List semua karyawan dengan search dan filter
- Statistik: Total karyawan, Active, Inactive
- Tombol tambah karyawan
- Card karyawan dengan foto, nama, role, status
- Quick actions: Edit, Print ID, Deactivate

**UI Layout**:
```
┌─────────────────────────────────────────────────────────┐
│  Karyawan                                    [+ Tambah] │
├─────────────────────────────────────────────────────────┤
│  [🔍 Cari karyawan...]  [Filter: All ▼]  [Role: All ▼] │
├─────────────────────────────────────────────────────────┤
│  📊 Total: 12  |  ✅ Aktif: 10  |  ❌ Nonaktif: 2      │
├─────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────┐  │
│  │ [📷]  John Doe          #EMP001    [Edit] [🖨️]  │  │
│  │       Kasir             ✅ Aktif    [❌]          │  │
│  └──────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────┐  │
│  │ [📷]  Jane Smith        #EMP002    [Edit] [🖨️]  │  │
│  │       Manajer           ✅ Aktif    [❌]          │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 2. EmployeeLoginScreen

**Purpose**: Halaman login khusus untuk karyawan

**Features**:
- 2 tab: Scan ID dan Manual Input
- QR code scanner untuk scan ID card
- Input username dan password
- Tombol "Kembali ke Login Seller"

**UI Layout**:
```
┌─────────────────────────────────────────────────────────┐
│                    Login Karyawan                        │
│                                                          │
│  [Scan ID Card]  [Manual Input]                         │
│                                                          │
│  ┌────────────────────────────────────────────────┐    │
│  │                                                 │    │
│  │         [📷 Scan QR Code ID Card]              │    │
│  │                                                 │    │
│  │         Arahkan kamera ke QR code              │    │
│  │         pada ID card karyawan                  │    │
│  │                                                 │    │
│  └────────────────────────────────────────────────┘    │
│                                                          │
│  Atau gunakan barcode scanner hardware                  │
│                                                          │
│  [← Kembali ke Login Seller]                            │
└─────────────────────────────────────────────────────────┘

Manual Input Tab:
┌─────────────────────────────────────────────────────────┐
│  Username                                                │
│  [_____________________]                                 │
│                                                          │
│  Password                                                │
│  [_____________________] [👁️]                           │
│                                                          │
│  [        Login        ]                                 │
│                                                          │
│  [← Kembali ke Login Seller]                            │
└─────────────────────────────────────────────────────────┘
```

### 3. IDCardTemplate Component

**Purpose**: Template untuk cetak ID card karyawan

**Design Specifications**:
- Ukuran: 85.6mm x 54mm (standar ID card)
- 2 sisi: Depan (info) dan Belakang (QR code besar)
- Warna: Sesuai branding BetaKasir (merah #DC143C)

**Front Side Layout**:
```
┌─────────────────────────────────────────┐
│  BETAKASIR                    [LOGO]    │
│  ─────────────────────────────────────  │
│                                         │
│  ┌─────┐                                │
│  │     │   JOHN DOE                     │
│  │FOTO │   Kasir                        │
│  │     │   #EMP001                      │
│  └─────┘                                │
│                                         │
│  Valid: 01/2025 - 12/2025              │
│  ─────────────────────────────────────  │
│  Toko: BetaKasir Store                 │
└─────────────────────────────────────────┘
```

**Back Side Layout**:
```
┌─────────────────────────────────────────┐
│                                         │
│         ┌─────────────────┐            │
│         │                 │            │
│         │   [QR CODE]     │            │
│         │                 │            │
│         └─────────────────┘            │
│                                         │
│  Scan QR code untuk login cepat        │
│                                         │
│  Hubungi: 021-12345678                 │
│  www.betakasir.com                     │
└─────────────────────────────────────────┘
```

### 4. PermissionGuard Component

**Purpose**: HOC untuk protect route/component berdasarkan permission

**Usage**:
```typescript
<PermissionGuard permission="add_product">
  <AddProductButton />
</PermissionGuard>

// Atau untuk route
<PermissionGuard 
  permission="view_employees" 
  fallback={<AccessDenied />}
>
  <EmployeesScreen />
</PermissionGuard>
```

## Data Flow

### Employee Login Flow

```
User Action → Employee Login Screen
              ↓
         [Scan QR / Manual Input]
              ↓
         Validate Credentials
              ↓
         Check Employee Status
              ↓
         Create Session
              ↓
         Log Activity (login)
              ↓
         Redirect to Dashboard
              ↓
         Apply Permission Filters
```

### Transaction with Employee Tracking

```
Employee Login → Session Created
                      ↓
                 Access Cashier
                      ↓
                 Process Transaction
                      ↓
                 Save with Employee ID
                      ↓
                 Log Activity
                      ↓
                 Update Statistics
```

### ID Card Printing Flow

```
Seller → Employee Detail
              ↓
         Click "Print ID Card"
              ↓
         Generate QR Code
              ↓
         Render ID Card Template
              ↓
         Show Print Preview
              ↓
         Print (2 sides)
              ↓
         Log Print Activity
```

## Error Handling

### Login Errors
- **Invalid Credentials**: "Username atau password salah"
- **Inactive Account**: "Akun Anda tidak aktif. Hubungi admin."
- **Expired Session**: "Sesi Anda telah berakhir. Silakan login kembali."
- **QR Code Invalid**: "QR Code tidak valid atau sudah kadaluarsa"

### Permission Errors
- **Access Denied**: Redirect ke halaman "Akses Ditolak" dengan pesan
- **Feature Locked**: Tampilkan tooltip "Anda tidak memiliki akses ke fitur ini"

### Data Errors
- **Duplicate Username**: "Username sudah digunakan"
- **Duplicate Employee Number**: Auto-generate nomor baru
- **Photo Upload Failed**: "Gagal upload foto. Coba lagi."

## Testing Strategy

### Unit Tests
- Password hashing dan validation
- QR code generation dan validation
- Permission checking logic
- Employee ID generation (unique)

### Integration Tests
- Employee login flow (scan + manual)
- Role-based access control
- Activity logging
- Session management

### E2E Tests
- Complete employee creation flow
- Login → Transaction → Logout flow
- ID card printing
- Permission enforcement across screens

## Security Considerations

### Password Security
- Hash dengan bcrypt (salt rounds: 10)
- Minimum 6 karakter
- Tidak boleh sama dengan username
- Password reset hanya oleh Seller

### QR Code Security
- Generate dengan UUID + timestamp
- Expire setelah ID card dicetak ulang
- Validate signature untuk prevent forgery
- Rate limiting untuk scan attempts

### Session Security
- Session timeout: 8 jam
- Auto-logout saat inactive 30 menit
- Secure session storage
- Clear session on logout

### Permission Security
- Check permission di backend (jika ada)
- Validate permission sebelum action
- Log semua permission violations
- Seller password required untuk sensitive actions

## Performance Optimization

### Caching
- Cache employee list di memory
- Cache permission checks
- Lazy load employee photos
- Cache QR codes

### Lazy Loading
- Load employee details on demand
- Paginate employee list (20 per page)
- Lazy load activity logs

### Offline Support
- Cache employee credentials untuk offline login
- Sync activity logs saat online
- Queue transactions untuk sync

## Migration Plan

### Phase 1: Core Setup
- Add Employee types
- Update store with employee state
- Create basic CRUD operations

### Phase 2: Authentication
- Implement employee login
- Add session management
- Create permission system

### Phase 3: UI Components
- Build EmployeesScreen
- Build EmployeeLoginScreen
- Build ID card template

### Phase 4: Integration
- Integrate with existing screens
- Add permission guards
- Update transaction tracking

### Phase 5: Testing & Polish
- Test all flows
- Fix bugs
- Polish UI/UX
- Add documentation
