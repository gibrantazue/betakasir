# 🖨️ Print Fix Guide - BetaKasir v1.2.2

## Masalah
Saat mencoba print struk di aplikasi Electron, muncul error:
```
"This app doesn't support print preview"
```

## Penyebab
- React Native Web tidak support native print preview dialog
- `window.print()` tidak kompatibel dengan React Native Web di Electron
- Browser print API terbatas di environment Electron

## Solusi yang Diterapkan

### 1. Electron Native Print API
Menggunakan Electron's `webContents.print()` untuk printing native:

**File yang diubah:**
- `electron/main.js` - Tambah IPC handler `print-receipt`
- `electron/preload.js` - Expose `printReceipt` ke renderer
- `src/utils/printReceipt.ts` - Deteksi Electron dan gunakan native API

### 2. Cara Kerja

```
User klik Print
    ↓
printReceipt() deteksi environment
    ↓
Jika Electron → Gunakan window.electron.printReceipt()
    ↓
IPC call ke main process
    ↓
Main process buat hidden window
    ↓
Load HTML content
    ↓
Print silently (tanpa dialog)
    ↓
Close hidden window
```

### 3. Keuntungan

✅ **Silent Printing** - Langsung print tanpa dialog  
✅ **Native API** - Lebih stabil dan reliable  
✅ **Background Print** - Tidak mengganggu UI  
✅ **Fallback Support** - Tetap support browser biasa  

## Testing

### Test di Electron Dev:
```bash
npm run electron-dev
```

1. Login ke aplikasi
2. Buat transaksi baru
3. Klik tombol Print
4. Struk akan langsung terprint tanpa error

### Test di Production:
```bash
# Install aplikasi dari dist/BetaKasir Setup 1.2.2.exe
# Jalankan aplikasi
# Test print functionality
```

## Troubleshooting

### Print tidak muncul?
- Pastikan printer sudah terinstall dan online
- Check printer default di Windows Settings
- Coba print test page dari Windows

### Error "printer not found"?
- Set default printer di Windows
- Restart aplikasi Electron
- Check printer connection

### Print terlalu lambat?
- Reduce HTML complexity
- Optimize image sizes
- Check printer queue

## Code Reference

### electron/main.js
```javascript
ipcMain.handle('print-receipt', async (event, htmlContent) => {
  const printWindow = new BrowserWindow({ show: false });
  await printWindow.loadURL(`data:text/html;...`);
  await printWindow.webContents.print({ silent: true });
  printWindow.close();
});
```

### electron/preload.js
```javascript
contextBridge.exposeInMainWorld('electron', {
  printReceipt: (htmlContent) => {
    return ipcRenderer.invoke('print-receipt', htmlContent);
  }
});
```

### src/utils/printReceipt.ts
```typescript
if (isElectron) {
  const result = await window.electron.printReceipt(html);
  return result.success;
}
```

## Future Improvements

- [ ] Add print preview option (optional)
- [ ] Support multiple printers selection
- [ ] Add print settings (paper size, orientation)
- [ ] Implement print queue management
- [ ] Add print history/logs

---

**Fixed in:** v1.2.2  
**Date:** 24 November 2025  
**Status:** ✅ Resolved
