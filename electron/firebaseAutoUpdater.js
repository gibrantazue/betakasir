const { dialog, app } = require('electron');
const log = require('electron-log');
const https = require('https');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Configure logging
log.transports.file.level = 'info';

let mainWindow;
let downloadInProgress = false;

// Firebase Storage URL (public access)
const FIREBASE_STORAGE_BASE = 'https://firebasestorage.googleapis.com/v0/b/betakasir-f7c2e.appspot.com/o';
const VERSION_INFO_URL = `${FIREBASE_STORAGE_BASE}/updates%2Flatest.json?alt=media`;

function setupAutoUpdater(window) {
  mainWindow = window;
  log.info('Firebase Auto-updater initialized');
}

async function checkForUpdates() {
  if (downloadInProgress) {
    log.info('Download already in progress');
    return;
  }

  log.info('Checking for updates from Firebase...');
  
  try {
    // Get latest version info from Firebase
    const versionInfo = await fetchVersionInfo();
    const currentVersion = app.getVersion();
    
    log.info(`Current version: ${currentVersion}`);
    log.info(`Latest version: ${versionInfo.version}`);
    
    if (isNewerVersion(versionInfo.version, currentVersion)) {
      // Update available
      log.info('Update available!');
      
      if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send('update-available', {
          version: versionInfo.version,
          releaseNotes: versionInfo.releaseNotes,
          downloadUrl: versionInfo.downloadUrl
        });
      }
      
      // Show dialog
      const dialogOpts = {
        type: 'info',
        buttons: ['Download Update', 'Nanti'],
        title: 'Update Tersedia',
        message: `Versi baru tersedia: v${versionInfo.version}`,
        detail: `Versi saat ini: v${currentVersion}\n\nApa yang baru:\n${versionInfo.releaseNotes || 'Bug fixes dan improvements'}\n\nDownload dan install update sekarang?`
      };
      
      const response = await dialog.showMessageBox(mainWindow, dialogOpts);
      
      if (response.response === 0) {
        // User clicked "Download Update"
        downloadUpdate(versionInfo);
      }
    } else {
      // No update available
      log.info('App is up to date');
      
      if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send('update-not-available', {
          version: currentVersion
        });
      }
      
      // Show "up to date" dialog
      const dialogOpts = {
        type: 'info',
        buttons: ['OK'],
        title: 'Sudah Terbaru',
        message: 'Aplikasi Sudah Versi Terbaru!',
        detail: `Versi saat ini: v${currentVersion}\n\nAnda sudah menggunakan versi terbaru.`
      };
      
      dialog.showMessageBox(mainWindow, dialogOpts);
    }
  } catch (error) {
    log.error('Error checking for updates:', error);
    
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('update-error', {
        message: error.message
      });
    }
    
    // Show user-friendly error
    const dialogOpts = {
      type: 'info',
      buttons: ['OK'],
      title: 'Sudah Terbaru',
      message: 'Aplikasi Sudah Versi Terbaru!',
      detail: `Versi saat ini: v${app.getVersion()}\n\nTidak dapat memeriksa update saat ini.`
    };
    
    dialog.showMessageBox(mainWindow, dialogOpts);
  }
}

function fetchVersionInfo() {
  return new Promise((resolve, reject) => {
    https.get(VERSION_INFO_URL, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const versionInfo = JSON.parse(data);
          resolve(versionInfo);
        } catch (error) {
          reject(new Error('Failed to parse version info'));
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

function isNewerVersion(latestVersion, currentVersion) {
  // Remove 'v' prefix if exists
  const latest = latestVersion.replace('v', '').split('.').map(Number);
  const current = currentVersion.replace('v', '').split('.').map(Number);
  
  for (let i = 0; i < 3; i++) {
    if (latest[i] > current[i]) return true;
    if (latest[i] < current[i]) return false;
  }
  
  return false;
}

function downloadUpdate(versionInfo) {
  if (downloadInProgress) {
    log.info('Download already in progress');
    return;
  }
  
  downloadInProgress = true;
  log.info('Starting download:', versionInfo.downloadUrl);
  
  // Show downloading dialog
  const dialogOpts = {
    type: 'info',
    buttons: [],
    title: 'Downloading Update',
    message: 'Mengunduh Update...',
    detail: 'Mohon tunggu, sedang mengunduh update...'
  };
  
  // Note: This is a simple implementation
  // For production, you should show a progress bar
  
  const tempDir = app.getPath('temp');
  const fileName = `BetaKasir-Setup-${versionInfo.version}.exe`;
  const filePath = path.join(tempDir, fileName);
  
  const file = fs.createWriteStream(filePath);
  
  https.get(versionInfo.downloadUrl, (response) => {
    const totalSize = parseInt(response.headers['content-length'], 10);
    let downloadedSize = 0;
    
    response.on('data', (chunk) => {
      downloadedSize += chunk.length;
      const percent = Math.round((downloadedSize / totalSize) * 100);
      
      // Send progress to renderer
      if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send('download-progress', {
          percent,
          transferred: downloadedSize,
          total: totalSize
        });
      }
      
      log.info(`Download progress: ${percent}%`);
    });
    
    response.pipe(file);
    
    file.on('finish', () => {
      file.close();
      downloadInProgress = false;
      
      log.info('Download completed:', filePath);
      
      // Send download completed event
      if (mainWindow && mainWindow.webContents) {
        mainWindow.webContents.send('update-downloaded', {
          version: versionInfo.version,
          filePath
        });
      }
      
      // Show install dialog
      const installDialogOpts = {
        type: 'info',
        buttons: ['Install Sekarang', 'Nanti'],
        title: 'Update Downloaded',
        message: 'Update Berhasil Diunduh!',
        detail: `Versi ${versionInfo.version} siap diinstall.\n\nInstall sekarang? Aplikasi akan ditutup dan installer akan dijalankan.`
      };
      
      dialog.showMessageBox(mainWindow, installDialogOpts).then((response) => {
        if (response.response === 0) {
          // User clicked "Install Sekarang"
          installUpdate(filePath);
        }
      });
    });
  }).on('error', (error) => {
    downloadInProgress = false;
    log.error('Download error:', error);
    
    // Clean up partial download
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send('update-error', {
        message: 'Download gagal: ' + error.message
      });
    }
    
    const errorDialogOpts = {
      type: 'error',
      buttons: ['OK'],
      title: 'Download Gagal',
      message: 'Gagal Mengunduh Update',
      detail: `Error: ${error.message}\n\nSilakan coba lagi nanti.`
    };
    
    dialog.showMessageBox(mainWindow, errorDialogOpts);
  });
}

function installUpdate(installerPath) {
  log.info('Installing update:', installerPath);
  
  // Run installer
  exec(`"${installerPath}"`, (error) => {
    if (error) {
      log.error('Failed to run installer:', error);
    }
  });
  
  // Quit app to allow installation
  setTimeout(() => {
    app.quit();
  }, 1000);
}

module.exports = {
  setupAutoUpdater,
  checkForUpdates
};
