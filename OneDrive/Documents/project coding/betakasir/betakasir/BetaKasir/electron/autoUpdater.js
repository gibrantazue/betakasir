const { autoUpdater } = require('electron-updater');
const { dialog } = require('electron');
const log = require('electron-log');

// Configure logging
log.transports.file.level = 'info';
autoUpdater.logger = log;

// Configure auto-updater
autoUpdater.autoDownload = false; // Don't auto-download, ask user first
autoUpdater.autoInstallOnAppQuit = true;

let mainWindow;

function setupAutoUpdater(window) {
  mainWindow = window;
  
  // Check for updates on app start (after 3 seconds)
  setTimeout(() => {
    checkForUpdates();
  }, 3000);
  
  // Check for updates every 4 hours
  setInterval(() => {
    checkForUpdates();
  }, 4 * 60 * 60 * 1000);
}

function checkForUpdates() {
  log.info('Checking for updates...');
  autoUpdater.checkForUpdates().catch(err => {
    log.error('Error checking for updates:', err);
  });
}

// Event: Update available
autoUpdater.on('update-available', (info) => {
  log.info('Update available:', info);
  
  const dialogOpts = {
    type: 'info',
    buttons: ['Download Update', 'Nanti'],
    title: 'Update Tersedia',
    message: `Versi baru ${info.version} tersedia!`,
    detail: `Versi saat ini: ${require('../package.json').version}\n\nApakah Anda ingin mengunduh update sekarang?`
  };
  
  dialog.showMessageBox(mainWindow, dialogOpts).then((returnValue) => {
    if (returnValue.response === 0) {
      // User clicked "Download Update"
      autoUpdater.downloadUpdate();
      
      // Show downloading notification
      mainWindow.webContents.send('update-downloading');
    }
  });
});

// Event: Update not available
autoUpdater.on('update-not-available', (info) => {
  log.info('Update not available:', info);
});

// Event: Download progress
autoUpdater.on('download-progress', (progressObj) => {
  let message = `Download speed: ${progressObj.bytesPerSecond}`;
  message += ` - Downloaded ${progressObj.percent}%`;
  message += ` (${progressObj.transferred}/${progressObj.total})`;
  
  log.info(message);
  
  // Send progress to renderer
  mainWindow.webContents.send('update-progress', {
    percent: Math.round(progressObj.percent),
    transferred: progressObj.transferred,
    total: progressObj.total
  });
});

// Event: Update downloaded
autoUpdater.on('update-downloaded', (info) => {
  log.info('Update downloaded:', info);
  
  const dialogOpts = {
    type: 'info',
    buttons: ['Restart Sekarang', 'Nanti'],
    title: 'Update Siap',
    message: 'Update berhasil diunduh!',
    detail: 'Aplikasi akan restart untuk menginstall update. Pastikan semua data sudah tersimpan.'
  };
  
  dialog.showMessageBox(mainWindow, dialogOpts).then((returnValue) => {
    if (returnValue.response === 0) {
      // User clicked "Restart Now"
      setImmediate(() => autoUpdater.quitAndInstall());
    }
  });
});

// Event: Error
autoUpdater.on('error', (err) => {
  log.error('Auto-updater error:', err);
  
  dialog.showMessageBox(mainWindow, {
    type: 'error',
    title: 'Update Error',
    message: 'Terjadi kesalahan saat update',
    detail: err.message
  });
});

module.exports = {
  setupAutoUpdater,
  checkForUpdates
};
