const { autoUpdater } = require('electron-updater');
const { dialog } = require('electron');
const log = require('electron-log');

// Configure logging
log.transports.file.level = 'info';
autoUpdater.logger = log;

// Configure auto-updater
autoUpdater.autoDownload = false; // Don't auto-download, ask user first
autoUpdater.autoInstallOnAppQuit = true;

// Fix GitHub API headers (prevent 406 error)
autoUpdater.requestHeaders = {
  'Accept': 'application/vnd.github.v3+json',
  'User-Agent': 'BetaKasir-Updater'
};

let mainWindow;

function setupAutoUpdater(window) {
  mainWindow = window;
  
  // Don't auto-check on startup - only check when user clicks manually
  // This prevents error dialogs when no GitHub release exists yet
  
  log.info('Auto-updater initialized (manual check only)');
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
  
  // Send event to renderer
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send('update-available', info);
  }
  
  // Auto-download immediately (no dialog)
  log.info('Auto-downloading update...');
  autoUpdater.downloadUpdate();
});

// Event: Update not available
autoUpdater.on('update-not-available', (info) => {
  log.info('Update not available:', info);
  
  // Send event to renderer (silent, no dialog)
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send('update-not-available', info);
  }
  
  // No dialog shown - silent check
  log.info('App is up to date - no dialog shown');
});

// Event: Download progress
autoUpdater.on('download-progress', (progressObj) => {
  let message = `Download speed: ${progressObj.bytesPerSecond}`;
  message += ` - Downloaded ${progressObj.percent}%`;
  message += ` (${progressObj.transferred}/${progressObj.total})`;
  
  log.info(message);
  
  // Send progress to renderer
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send('download-progress', {
      percent: Math.round(progressObj.percent),
      transferred: progressObj.transferred,
      total: progressObj.total
    });
  }
});

// Event: Update downloaded
autoUpdater.on('update-downloaded', (info) => {
  log.info('Update downloaded:', info);
  
  // Send event to renderer
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send('update-downloaded', info);
  }
  
  // Auto-install and restart after 3 seconds
  log.info('Update downloaded, restarting app in 3 seconds...');
  setTimeout(() => {
    autoUpdater.quitAndInstall(false, true);
  }, 3000);
});

// Event: Error
autoUpdater.on('error', (err) => {
  log.error('Auto-updater error:', err);
  
  // Send error to renderer
  if (mainWindow && mainWindow.webContents) {
    mainWindow.webContents.send('update-error', {
      message: err.message,
      stack: err.stack
    });
  }
  
  // Show user-friendly error message
  const errorMessage = err.message || 'Unknown error';
  
  // Check if error is related to missing GitHub release
  const isNoReleaseError = 
    errorMessage.includes('Cannot find latest release') ||
    errorMessage.includes('latest.yml') ||
    errorMessage.includes('404') ||
    errorMessage.includes('HttpError: 404');
  
  if (isNoReleaseError) {
    // This is normal if no GitHub release exists yet - treat as "up to date"
    log.info('No GitHub release found - treating as up to date');
    
    // Send "update-not-available" event instead of error
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('update-not-available', {
        version: require('../package.json').version
      });
    }
    
    // Show positive "up to date" dialog instead of error
    const dialogOpts = {
      type: 'info',
      buttons: ['OK'],
      title: 'Sudah Terbaru',
      message: 'Aplikasi Sudah Versi Terbaru!',
      detail: `Versi saat ini: ${require('../package.json').version}\n\nAnda sudah menggunakan versi terbaru.`
    };
    
    dialog.showMessageBox(mainWindow, dialogOpts);
  } else {
    // Show actual error for other cases (network issues, etc)
    log.error('Actual error (not 404):', errorMessage);
    const dialogOpts = {
      type: 'error',
      buttons: ['OK'],
      title: 'Error Cek Update',
      message: 'Gagal Cek Update',
      detail: `Error: ${errorMessage}\n\nSilakan coba lagi nanti.`
    };
    
    dialog.showMessageBox(mainWindow, dialogOpts);
  }
});

module.exports = {
  setupAutoUpdater,
  checkForUpdates
};
