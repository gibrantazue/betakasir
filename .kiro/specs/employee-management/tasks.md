# Implementation Plan - Employee Management System

## Overview
Implementation plan untuk sistem manajemen karyawan dengan role-based access control, employee login, dan ID card printing.

---

## Phase 1: Foundation & Data Models

### - [ ] 1. Setup TypeScript Types and Interfaces
- [ ] 1.1 Create `src/types/employee.ts` with Employee, EmployeeRole, Permission, ActivityLog, EmployeeSession interfaces
  - Define Employee interface dengan semua fields (id, username, password, fullName, email, phone, address, photo, role, qrCode, status, timestamps)
  - Define EmployeeRole interface dengan permissions array
  - Define Permission type dengan semua permission constants
  - Define ActivityLog interface untuk tracking aktivitas
  - Define EmployeeSession interface untuk session management
  - _Requirements: 1.1, 2.2, 5.1_

- [ ] 1.2 Create `src/utils/permissions.ts` with permission constants and helper functions
  - Export semua permission constants sebagai enum atau object
  - Create helper function `hasPermission(role: EmployeeRole, permission: Permission): boolean`
  - Create helper function `getDefaultRoles(): EmployeeRole[]` untuk Seller, Manager, Cashier
  - _Requirements: 1.1, 5.1_

### - [ ] 2. Update Zustand Store for Employee Management
- [ ] 2.1 Add employee state to `src/store/useStore.ts`
  - Add `employees: Employee[]` state
  - Add `currentEmployee: Employee | null` untuk active employee session
  - Add `employeeSession: EmployeeSession | null` untuk session tracking
  - Add `activityLogs: ActivityLog[]` untuk activity history
  - _Requirements: 2.3, 3.8, 7.1_

- [ ] 2.2 Implement employee CRUD operations in store
  - `addEmployee(employee: Employee): void` - Tambah karyawan baru
  - `updateEmployee(id: string, data: Partial<Employee>): void` - Update data karyawan
  - `deleteEmployee(id: string): void` - Soft delete (set status inactive)
  - `getEmployeeById(id: string): Employee | undefined` - Get employee by ID
  - `getEmployeeByUsername(username: string): Employee | undefined` - Get by username
  - Save to AsyncStorage setelah setiap operasi
  - _Requirements: 2.3, 2.6, 2.7_

- [ ] 2.3 Implement employee session management in store
  - `loginEmployee(username: string, password: string): Promise<boolean>` - Login employee
  - `loginEmployeeByQR(qrCode: string): Promise<boolean>` - Login via QR scan
  - `logoutEmployee(): void` - Logout dan clear session
  - `switchEmployee(newEmployeeId: string): void` - Quick switch untuk shift change
  - `checkSessionExpiry(): boolean` - Check apakah session masih valid (8 jam)
  - _Requirements: 3.3, 3.4, 3.5, 8.1_

- [ ] 2.4 Implement activity logging in store
  - `logActivity(action: ActivityAction, description: string, metadata?: any): void`
  - Auto-log saat login, logout, transaction, dll
  - Save activity logs to AsyncStorage
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

---

## Phase 2: Utility Functions & Helpers

### - [ ] 3. Create Employee Utility Functions
- [ ] 3.1 Create `src/utils/generateEmployeeID.ts`
  - Function `generateEmployeeID(existingEmployees: Employee[]): string`
  - Generate format: "EMP001", "EMP002", dst (auto-increment)
  - Check uniqueness dengan existing employees
  - _Requirements: 2.3_

- [ ] 3.2 Create `src/utils/generateQRCode.ts`
  - Install package: `expo install react-native-qrcode-svg`
  - Function `generateQRCodeData(employeeId: string): string`
  - Generate unique QR data dengan format: `BETAKASIR:EMP:${employeeId}:${timestamp}`
  - Include signature untuk security
  - _Requirements: 2.4, 4.2_

- [ ] 3.3 Create `src/utils/hashPassword.ts`
  - Install package: `npm install bcryptjs @types/bcryptjs`
  - Function `hashPassword(password: string): Promise<string>` - Hash dengan bcrypt
  - Function `comparePassword(password: string, hash: string): Promise<boolean>` - Verify password
  - Use salt rounds: 10
  - _Requirements: 3.4, Security_

- [ ] 3.4 Create `src/utils/validateEmployee.ts`
  - Function `validateEmployeeData(data: Partial<Employee>): { valid: boolean; errors: string[] }`
  - Validate: username unique, password min 6 char, email format, phone format
  - Return validation errors jika ada
  - _Requirements: 2.2, 2.3_

---

## Phase 3: Employee Login System

### - [ ] 4. Create Employee Login Screen
- [ ] 4.1 Create `src/screens/EmployeeLoginScreen.tsx` with tab navigation
  - Setup screen dengan 2 tabs: "Scan ID" dan "Manual Input"
  - Use `@react-navigation/material-top-tabs` untuk tab navigation
  - Add header dengan logo dan "Login Karyawan" title
  - Add "Kembali ke Login Seller" button
  - _Requirements: 3.1, 3.2_

- [ ] 4.2 Implement QR Code Scanner tab
  - Install: `expo install expo-camera expo-barcode-scanner`
  - Use `BarCodeScanner` component untuk scan QR code
  - Show camera preview dengan overlay guide
  - Handle QR scan result dan validate format
  - Call `loginEmployeeByQR()` saat QR valid
  - Show loading state saat processing
  - _Requirements: 3.4_

- [ ] 4.3 Implement Manual Input tab
  - Create form dengan username dan password input
  - Add password visibility toggle (eye icon)
  - Add "Login" button dengan loading state
  - Validate input sebelum submit
  - Call `loginEmployee()` dengan credentials
  - _Requirements: 3.5_

- [ ] 4.4 Handle login success and errors
  - IF login success, redirect ke dashboard sesuai role (Cashier → Kasir, Manager → Home)
  - IF credentials salah, show error "Username atau Password salah"
  - IF employee inactive, show error "Akun tidak aktif. Hubungi admin."
  - Log activity saat login berhasil
  - _Requirements: 3.6, 3.7, 3.8_

### - [ ] 5. Update App Navigation for Employee Login
- [ ] 5.1 Update `App.tsx` to add employee login route
  - Add EmployeeLoginScreen ke navigation stack
  - Add logic untuk show employee login option di initial screen
  - Handle navigation berdasarkan user type (Seller vs Employee)
  - _Requirements: 3.1_

- [ ] 5.2 Create initial login selection screen
  - Screen dengan 2 pilihan: "Login Seller" dan "Login Karyawan"
  - Design dengan card/button besar untuk easy selection
  - Navigate ke LoginScreen atau EmployeeLoginScreen sesuai pilihan
  - _Requirements: 3.1_

---

## Phase 4: Employee Management Dashboard

### - [ ] 6. Create Employees Screen (Main Dashboard)
- [ ] 6.1 Create `src/screens/EmployeesScreen.tsx` with employee list
  - Setup screen dengan header "Karyawan" dan tombol "+ Tambah"
  - Show statistics cards: Total, Aktif, Nonaktif
  - Implement search bar untuk filter by nama atau employee ID
  - Add filter dropdown untuk role (All, Seller, Manager, Cashier)
  - _Requirements: 6.1, 6.2, 6.3_

- [ ] 6.2 Create `src/components/EmployeeCard.tsx` component
  - Display: Foto, Nama, Employee ID, Role, Status badge
  - Add action buttons: Edit, Print ID Card, Deactivate/Activate
  - Use TouchableOpacity untuk navigate ke detail
  - Style dengan card design yang clean
  - _Requirements: 6.1_

- [ ] 6.3 Implement employee list with FlatList
  - Use FlatList untuk render employee cards
  - Implement pull-to-refresh
  - Add empty state "Belum ada karyawan"
  - Sort by: newest first, alphabetical, role
  - _Requirements: 6.1, 6.2_

### - [ ] 7. Create Employee Form Screen
- [ ] 7.1 Create `src/screens/EmployeeFormScreen.tsx` for add/edit
  - Setup form dengan ScrollView
  - Add photo picker untuk upload foto karyawan
  - Input fields: Nama Lengkap, Username, Password, Email, Phone, Address
  - Add role selector dropdown
  - Add "Simpan" dan "Batal" buttons
  - _Requirements: 2.1, 2.2_

- [ ] 7.2 Implement photo upload functionality
  - Use `expo-image-picker` untuk pick dari gallery atau camera
  - Resize image untuk optimize storage (max 500x500)
  - Convert to base64 untuk save di AsyncStorage
  - Show preview setelah upload
  - _Requirements: 2.2_

- [ ] 7.3 Implement form validation and submission
  - Validate semua fields sebelum submit
  - Check username uniqueness
  - Hash password sebelum save
  - Generate employee ID dan QR code otomatis
  - Call `addEmployee()` atau `updateEmployee()` dari store
  - Navigate back setelah success
  - _Requirements: 2.3, 2.4, 2.6_

### - [ ] 8. Create Employee Detail Screen
- [ ] 8.1 Create `src/screens/EmployeeDetailScreen.tsx`
  - Show full employee information dengan layout yang rapi
  - Display: Foto besar, Nama, Employee ID, Role, Status, Contact info
  - Add action buttons: Edit, Print ID Card, Deactivate, Delete
  - Show statistics: Total transaksi, Last login, Created date
  - _Requirements: 6.4_

- [ ] 8.2 Implement employee actions
  - Edit: Navigate ke EmployeeFormScreen dengan data
  - Print ID Card: Call print function (implement di phase 5)
  - Deactivate/Activate: Toggle status dengan confirmation
  - Delete: Soft delete dengan confirmation dialog
  - _Requirements: 2.6, 2.7_

---

## Phase 5: ID Card Generation & Printing

### - [ ] 9. Create ID Card Template Component
- [ ] 9.1 Create `src/components/IDCardTemplate.tsx` for front side
  - Design layout dengan ukuran 85.6mm x 54mm (ID card standard)
  - Header: Logo BetaKasir dan nama toko
  - Body: Foto karyawan, Nama, Role, Employee ID
  - Footer: Valid period, Store name
  - Use inline styles untuk print compatibility
  - _Requirements: 4.2, 4.3_

- [ ] 9.2 Create back side template in same component
  - Large QR code di center (menggunakan `react-native-qrcode-svg`)
  - Text: "Scan QR code untuk login cepat"
  - Contact info: Phone, Website
  - Instructions untuk penggunaan
  - _Requirements: 4.2, 4.3_

- [ ] 9.3 Create `src/utils/printIDCard.ts` utility
  - Function `printIDCard(employee: Employee): Promise<void>`
  - Generate HTML dari ID card template (front & back)
  - Use `expo-print` untuk print
  - Support print 2 sisi (manual flip instruction)
  - Show print preview sebelum print
  - _Requirements: 4.4, 4.5_

### - [ ] 10. Integrate ID Card Printing
- [ ] 10.1 Add "Print ID Card" button to EmployeeDetailScreen
  - Button dengan icon printer
  - Show loading state saat generate
  - Call `printIDCard()` function
  - Show success message setelah print
  - _Requirements: 4.1, 4.4_

- [ ] 10.2 Add "Print ID Card" quick action to EmployeeCard
  - Icon button di employee card
  - Direct print tanpa buka detail
  - Log print activity dengan timestamp
  - _Requirements: 4.6_

---

## Phase 6: Role-Based Access Control

### - [ ] 11. Create Permission Guard Component
- [ ] 11.1 Create `src/components/PermissionGuard.tsx` HOC
  - Props: `permission: Permission`, `fallback?: ReactNode`, `children: ReactNode`
  - Check current employee role dan permissions
  - Render children jika ada permission, fallback jika tidak
  - Use `usePermission` hook untuk check
  - _Requirements: 5.1, 5.2, 5.3, 5.5_

- [ ] 11.2 Create `src/hooks/usePermission.tsx` custom hook
  - Hook: `usePermission(permission: Permission): boolean`
  - Get current employee dari store
  - Check apakah employee role punya permission
  - Return true/false
  - _Requirements: 5.1_

### - [ ] 12. Apply Permission Guards to Screens
- [ ] 12.1 Wrap ProductsScreen with permission guard
  - View: `view_products` permission
  - Add/Edit/Delete: respective permissions
  - Hide buttons jika tidak ada permission
  - _Requirements: 5.1, 5.5_

- [ ] 12.2 Wrap EmployeesScreen with permission guard
  - Require `view_employees` permission
  - Show "Access Denied" jika tidak ada akses
  - _Requirements: 5.1, 5.4_

- [ ] 12.3 Wrap SettingsScreen with permission guard
  - Require `view_settings` permission
  - Disable edit jika tidak ada `edit_settings`
  - _Requirements: 5.1_

- [ ] 12.4 Update navigation menu based on role
  - Filter menu items berdasarkan permissions
  - Cashier: hanya Kasir dan Transaksi (view only)
  - Manager: Kasir, Produk, Transaksi, Laporan (view only)
  - Seller: semua menu
  - _Requirements: 5.1, 5.2, 5.3_

### - [ ] 13. Update Transaction Tracking with Employee
- [ ] 13.1 Modify transaction creation to include employee ID
  - Add `cashierId: string` dan `cashierName: string` ke Transaction type
  - Auto-fill dengan current employee saat create transaction
  - Show cashier name di transaction detail
  - _Requirements: 5.6_

- [ ] 13.2 Update transaction list to show cashier
  - Display cashier name di transaction card
  - Add filter by cashier
  - _Requirements: 5.6, 6.5_

---

## Phase 7: Activity Logging & Monitoring

### - [ ] 14. Create Activity Log Screen
- [ ] 14.1 Create `src/screens/ActivityLogScreen.tsx`
  - List semua activity logs dengan FlatList
  - Show: Employee name, Action, Description, Timestamp
  - Add filter by: Employee, Date range, Action type
  - Add search functionality
  - _Requirements: 7.5_

- [ ] 14.2 Create `src/components/ActivityLogItem.tsx` component
  - Display activity dengan icon sesuai action type
  - Format timestamp dengan relative time (2 hours ago)
  - Show metadata jika ada (transaction ID, dll)
  - Color coding berdasarkan action type
  - _Requirements: 7.5_

### - [ ] 15. Implement Auto Activity Logging
- [ ] 15.1 Add activity logging to employee login/logout
  - Log saat employee login (manual atau QR)
  - Log saat employee logout
  - Include timestamp dan device info
  - _Requirements: 7.1, 7.2_

- [ ] 15.2 Add activity logging to transactions
  - Log saat transaction created
  - Log saat transaction voided/deleted
  - Include transaction ID dan amount
  - _Requirements: 7.3_

- [ ] 15.3 Add activity logging to data changes
  - Log saat product added/edited/deleted
  - Log saat settings changed
  - Include before/after values
  - _Requirements: 7.4_

---

## Phase 8: Quick Switch & Session Management

### - [ ] 16. Implement Quick Switch Feature
- [ ] 16.1 Add "Ganti Kasir" button to CashierScreen
  - Button di header atau sidebar
  - Icon: swap atau user-switch
  - Show confirmation dialog
  - _Requirements: 8.1_

- [ ] 16.2 Create quick switch modal
  - Show employee login (scan atau manual)
  - Tidak logout dari app, hanya switch employee
  - Save previous session untuk audit
  - Log shift change activity
  - _Requirements: 8.2, 8.3_

- [ ] 16.3 Show shift change notification
  - Toast/Alert: "Shift changed: [Old Name] → [New Name]"
  - Update UI dengan employee baru
  - Refresh permissions
  - _Requirements: 8.4_

### - [ ] 17. Implement Session Timeout
- [ ] 17.1 Add session expiry check
  - Check session setiap 5 menit
  - Session timeout: 8 jam dari login
  - Auto-logout jika expired
  - Show warning 10 menit sebelum expire
  - _Requirements: Security_

- [ ] 17.2 Add inactivity timeout
  - Track last activity timestamp
  - Auto-logout setelah 30 menit inactive
  - Show countdown warning
  - _Requirements: Security_

---

## Phase 9: Role Management Screen

### - [ ] 18. Create Role Management Screen
- [ ] 18.1 Create `src/screens/RoleManagementScreen.tsx`
  - List semua roles dengan permissions
  - Show default roles: Seller, Manager, Cashier
  - Add "Tambah Role" button (optional)
  - _Requirements: 1.1_

- [ ] 18.2 Create role detail/edit screen
  - Show role name dan display name
  - Checklist semua available permissions
  - Group permissions by category (Products, Transactions, dll)
  - Save button untuk update permissions
  - _Requirements: 1.2, 1.4_

- [ ] 18.3 Implement role update functionality
  - Update role permissions di store
  - Refresh permissions untuk semua employees dengan role tersebut
  - Show success message
  - _Requirements: 1.4_

---

## Phase 10: Testing & Polish

### - [ ]* 19. Write Unit Tests
- [ ]* 19.1 Test password hashing and validation
  - Test `hashPassword()` dan `comparePassword()`
  - Test password validation rules
  - _Requirements: Security_

- [ ]* 19.2 Test QR code generation
  - Test `generateQRCodeData()` uniqueness
  - Test QR format validation
  - _Requirements: 4.2_

- [ ]* 19.3 Test permission checking logic
  - Test `hasPermission()` function
  - Test permission guard component
  - _Requirements: 5.1_

- [ ]* 19.4 Test employee ID generation
  - Test uniqueness
  - Test auto-increment
  - _Requirements: 2.3_

### - [ ]* 20. Integration Testing
- [ ]* 20.1 Test complete employee creation flow
  - Create employee → Generate ID → Generate QR → Save
  - Verify data saved correctly
  - _Requirements: 2.1-2.4_

- [ ]* 20.2 Test employee login flows
  - Test manual login dengan valid/invalid credentials
  - Test QR scan login
  - Test session creation
  - _Requirements: 3.3-3.8_

- [ ]* 20.3 Test role-based access control
  - Test permission guards untuk different roles
  - Test menu filtering
  - Test access denied scenarios
  - _Requirements: 5.1-5.5_

### - [ ] 21. UI/UX Polish
- [ ] 21.1 Add loading states to all async operations
  - Login loading
  - Save employee loading
  - Print ID card loading
  - _Requirements: UX_

- [ ] 21.2 Add success/error notifications
  - Toast messages untuk success actions
  - Error alerts dengan clear messages
  - Confirmation dialogs untuk destructive actions
  - _Requirements: UX_

- [ ] 21.3 Optimize performance
  - Lazy load employee photos
  - Cache permission checks
  - Optimize FlatList rendering
  - _Requirements: Performance_

- [ ] 21.4 Add animations and transitions
  - Smooth screen transitions
  - Card animations
  - Loading spinners
  - _Requirements: UX_

### - [ ] 22. Documentation
- [ ] 22.1 Create user guide for employee management
  - How to add employee
  - How to print ID card
  - How to login as employee
  - How to manage roles
  - _Requirements: Documentation_

- [ ] 22.2 Create developer documentation
  - Code structure explanation
  - Permission system guide
  - How to add new permissions
  - How to extend roles
  - _Requirements: Documentation_

---

## Notes

- Tasks marked with `*` are optional and can be skipped for MVP
- Each task should be completed and tested before moving to the next
- Refer to requirements.md and design.md for detailed specifications
- Use TypeScript for type safety
- Follow existing code style and patterns in the project
