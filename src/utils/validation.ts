// Input Validation Utilities

/**
 * Validate email format
 */
export const validateEmail = (email: string): { valid: boolean; error?: string } => {
  if (!email || email.trim().length === 0) {
    return { valid: false, error: 'Email tidak boleh kosong' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Format email tidak valid' };
  }
  
  return { valid: true };
};

/**
 * Validate phone number (Indonesian format)
 */
export const validatePhone = (phone: string): { valid: boolean; error?: string } => {
  if (!phone || phone.trim().length === 0) {
    return { valid: false, error: 'Nomor telepon tidak boleh kosong' };
  }
  
  // Remove spaces, dashes, and parentheses
  const cleanPhone = phone.replace(/[\s\-\(\)]/g, '');
  
  // Check if starts with +62, 62, or 0
  const phoneRegex = /^(\+62|62|0)[0-9]{9,12}$/;
  if (!phoneRegex.test(cleanPhone)) {
    return { valid: false, error: 'Format nomor telepon tidak valid (min 10 digit)' };
  }
  
  return { valid: true };
};

/**
 * Validate password strength
 */
export const validatePassword = (password: string): { valid: boolean; error?: string; strength?: 'weak' | 'medium' | 'strong' } => {
  if (!password || password.length === 0) {
    return { valid: false, error: 'Password tidak boleh kosong' };
  }
  
  if (password.length < 6) {
    return { valid: false, error: 'Password minimal 6 karakter' };
  }
  
  // Check password strength
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  const criteriaCount = [hasUpperCase, hasLowerCase, hasNumbers, hasSpecialChar].filter(Boolean).length;
  
  if (criteriaCount >= 3 && password.length >= 8) {
    strength = 'strong';
  } else if (criteriaCount >= 2 && password.length >= 6) {
    strength = 'medium';
  }
  
  return { valid: true, strength };
};

/**
 * Validate price (must be positive number)
 */
export const validatePrice = (price: number | string): { valid: boolean; error?: string } => {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  if (isNaN(numPrice)) {
    return { valid: false, error: 'Harga harus berupa angka' };
  }
  
  if (numPrice < 0) {
    return { valid: false, error: 'Harga tidak boleh negatif' };
  }
  
  if (numPrice === 0) {
    return { valid: false, error: 'Harga tidak boleh 0' };
  }
  
  return { valid: true };
};

/**
 * Validate stock (must be non-negative integer)
 */
export const validateStock = (stock: number | string): { valid: boolean; error?: string } => {
  const numStock = typeof stock === 'string' ? parseInt(stock) : stock;
  
  if (isNaN(numStock)) {
    return { valid: false, error: 'Stok harus berupa angka' };
  }
  
  if (numStock < 0) {
    return { valid: false, error: 'Stok tidak boleh negatif' };
  }
  
  if (!Number.isInteger(numStock)) {
    return { valid: false, error: 'Stok harus berupa bilangan bulat' };
  }
  
  return { valid: true };
};

/**
 * Validate product name
 */
export const validateProductName = (name: string): { valid: boolean; error?: string } => {
  if (!name || name.trim().length === 0) {
    return { valid: false, error: 'Nama produk tidak boleh kosong' };
  }
  
  if (name.trim().length < 3) {
    return { valid: false, error: 'Nama produk minimal 3 karakter' };
  }
  
  if (name.length > 100) {
    return { valid: false, error: 'Nama produk maksimal 100 karakter' };
  }
  
  return { valid: true };
};

/**
 * Validate barcode
 */
export const validateBarcode = (barcode: string): { valid: boolean; error?: string } => {
  if (!barcode || barcode.trim().length === 0) {
    return { valid: true }; // Barcode is optional
  }
  
  // Remove spaces
  const cleanBarcode = barcode.replace(/\s/g, '');
  
  // Check if contains only numbers and letters
  const barcodeRegex = /^[A-Za-z0-9]+$/;
  if (!barcodeRegex.test(cleanBarcode)) {
    return { valid: false, error: 'Barcode hanya boleh berisi huruf dan angka' };
  }
  
  if (cleanBarcode.length < 4) {
    return { valid: false, error: 'Barcode minimal 4 karakter' };
  }
  
  if (cleanBarcode.length > 50) {
    return { valid: false, error: 'Barcode maksimal 50 karakter' };
  }
  
  return { valid: true };
};

/**
 * Validate username
 */
export const validateUsername = (username: string): { valid: boolean; error?: string } => {
  if (!username || username.trim().length === 0) {
    return { valid: false, error: 'Username tidak boleh kosong' };
  }
  
  if (username.length < 4) {
    return { valid: false, error: 'Username minimal 4 karakter' };
  }
  
  if (username.length > 20) {
    return { valid: false, error: 'Username maksimal 20 karakter' };
  }
  
  // Only alphanumeric and underscore
  const usernameRegex = /^[a-zA-Z0-9_]+$/;
  if (!usernameRegex.test(username)) {
    return { valid: false, error: 'Username hanya boleh berisi huruf, angka, dan underscore' };
  }
  
  return { valid: true };
};

/**
 * Validate required field
 */
export const validateRequired = (value: any, fieldName: string): { valid: boolean; error?: string } => {
  if (value === null || value === undefined || value === '') {
    return { valid: false, error: `${fieldName} tidak boleh kosong` };
  }
  
  if (typeof value === 'string' && value.trim().length === 0) {
    return { valid: false, error: `${fieldName} tidak boleh kosong` };
  }
  
  return { valid: true };
};

/**
 * Sanitize string input (remove dangerous characters)
 */
export const sanitizeString = (input: string): string => {
  if (!input) return '';
  
  // Remove HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Remove script tags content
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  
  // Trim whitespace
  sanitized = sanitized.trim();
  
  return sanitized;
};

/**
 * Format phone number to standard format
 */
export const formatPhoneNumber = (phone: string): string => {
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Convert to standard format (0xxx-xxxx-xxxx)
  if (cleaned.startsWith('62')) {
    return '0' + cleaned.substring(2);
  }
  
  if (cleaned.startsWith('+62')) {
    return '0' + cleaned.substring(3);
  }
  
  return cleaned;
};
