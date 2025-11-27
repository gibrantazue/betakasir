const { contextBridge, ipcRenderer } = require('electron');

// Expose electron API to renderer process
contextBridge.exposeInMainWorld('electron', {
  // Check for updates
  checkForUpdates: () => {
    console.log('🚀 Preload: checkForUpdates called');
    ipcRenderer.send('check-for-updates');
  },
  
  // Listen for update events
  onUpdateAvailable: (callback) => {
    ipcRenderer.on('update-available', (event, info) => callback(info));
  },
  
  onUpdateNotAvailable: (callback) => {
    ipcRenderer.on('update-not-available', (event, info) => callback(info));
  },
  
  onUpdateDownloaded: (callback) => {
    ipcRenderer.on('update-downloaded', (event, info) => callback(info));
  },
  
  onUpdateError: (callback) => {
    ipcRenderer.on('update-error', (event, error) => callback(error));
  },
  
  onDownloadProgress: (callback) => {
    ipcRenderer.on('download-progress', (event, progress) => callback(progress));
  },
  
  // Install update and restart
  installUpdate: () => {
    console.log('🚀 Preload: installUpdate called');
    ipcRenderer.send('install-update');
  },
  
  // Get app version
  getVersion: () => {
    return ipcRenderer.invoke('get-version');
  },
  
  // Print receipt
  printReceipt: (htmlContent) => {
    console.log('🖨️ Preload: printReceipt called');
    return ipcRenderer.invoke('print-receipt', htmlContent);
  },
  
  // Platform info
  platform: process.platform,
  isElectron: true,
});

console.log('✅ Preload script loaded - electron API exposed');
