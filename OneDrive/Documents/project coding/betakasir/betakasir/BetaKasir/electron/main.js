const { app, BrowserWindow, Menu, protocol } = require('electron');
const path = require('path');
const fs = require('fs');
const { URL } = require('url');

// Check if in development mode
const isDev = !app.isPackaged;

// Only require auto-updater in production
let setupAutoUpdater = null;
if (!isDev) {
  try {
    setupAutoUpdater = require('./autoUpdater').setupAutoUpdater;
    console.log('✅ Auto-updater loaded for production');
  } catch (error) {
    console.error('❌ Failed to load auto-updater:', error.message);
  }
} else {
  console.log('⚠️ Auto-updater DISABLED in development mode');
}

// Set app user model ID for Windows to ensure proper icon display
if (process.platform === 'win32') {
  app.setAppUserModelId('com.betakasir.app');
}

let mainWindow;

function createWindow() {
  // Get icon path - use absolute path to ensure it works in both dev and production
  let iconPath;
  if (isDev) {
    iconPath = path.join(__dirname, 'icon.ico');
  } else {
    // Try multiple possible locations in production
    const possiblePaths = [
      path.join(process.resourcesPath, 'icon.ico'),
      path.join(process.resourcesPath, 'electron', 'icon.ico'),
      path.join(__dirname, '..', 'icon.ico'),
      path.join(__dirname, 'icon.ico')
    ];
    
    iconPath = possiblePaths.find(p => fs.existsSync(p)) || possiblePaths[0];
  }
  
  console.log('Icon path:', iconPath);
  console.log('Icon exists:', fs.existsSync(iconPath));
  
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    backgroundColor: '#0a0a0a',
    icon: iconPath,
    title: 'BetaKasir - Sistem Kasir Modern',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      webSecurity: false,
    },
    autoHideMenuBar: true,
    frame: true,
    show: false,
  });
  
  // Force set icon after window creation (Windows specific fix)
  if (process.platform === 'win32') {
    mainWindow.setIcon(iconPath);
    // Set overlay icon for taskbar
    mainWindow.setOverlayIcon(iconPath, 'BetaKasir');
  }

  // Create menu with DevTools shortcut
  const template = [
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    }
  ];
  
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
  
  // Add fullscreen toggle with F11
  mainWindow.webContents.on('before-input-event', (event, input) => {
    if (input.key === 'F11' && input.type === 'keyDown') {
      const isFullScreen = mainWindow.isFullScreen();
      mainWindow.setFullScreen(!isFullScreen);
      event.preventDefault();
    }
  });

  // Load the app
  if (isDev) {
    // Development: load from Expo dev server
    mainWindow.loadURL('http://localhost:8081');
    mainWindow.webContents.openDevTools();
    mainWindow.once('ready-to-show', () => {
      mainWindow.show();
      
      // Setup auto-updater in development (for testing)
      if (isDev) {
        console.log('⚠️ Auto-updater in development mode - TESTING ONLY');
        // Uncomment line below to test auto-updater in dev mode
        // setupAutoUpdater(mainWindow);
      }
    });
  } else {
    // Production: Start local HTTP server for OAuth compatibility
    const http = require('http');
    const server = http.createServer((req, res) => {
      const url = require('url').parse(req.url).pathname;
      let filePath = path.join(__dirname, '../web-build', url === '/' ? 'index.html' : url);
      
      fs.readFile(filePath, (err, data) => {
        if (err) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }
        
        const ext = path.extname(filePath).toLowerCase();
        const mimeTypes = {
          '.html': 'text/html',
          '.js': 'text/javascript',
          '.css': 'text/css',
          '.json': 'application/json',
          '.png': 'image/png',
          '.jpg': 'image/jpeg',
          '.ttf': 'font/ttf',
          '.woff': 'font/woff',
          '.woff2': 'font/woff2',
        };
        
        res.writeHead(200, { 'Content-Type': mimeTypes[ext] || 'application/octet-stream' });
        res.end(data);
      });
    });
    
    server.listen(0, 'localhost', () => {
      const port = server.address().port;
      console.log(`✅ Local server running on http://localhost:${port}`);
      
      // Load from localhost for OAuth compatibility
      mainWindow.loadURL(`http://localhost:${port}`);
      
      mainWindow.once('ready-to-show', () => {
        console.log('✅ Window ready to show');
        mainWindow.show();
        
        // Setup auto-updater in production
        if (setupAutoUpdater) {
          setupAutoUpdater(mainWindow);
          console.log('✅ Auto-updater initialized');
        }
      });
      
      // Open DevTools to debug (disabled in production)
      // mainWindow.webContents.openDevTools();
    });
    
    // Close server when window closes
    mainWindow.on('closed', () => {
      if (server) {
        server.close();
      }
    });
  }
  
  // Log when page finishes loading
  mainWindow.webContents.on('did-finish-load', () => {
    console.log('✅ Page loaded successfully');
  });
  
  // Log any errors
  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    console.error('❌ Failed to load:', errorCode, errorDescription, validatedURL);
  });
  
  // Log console from renderer
  mainWindow.webContents.on('console-message', (_event, _level, message) => {
    console.log(`[Renderer]:`, message);
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links and OAuth
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Allow Google OAuth URLs
    if (url.includes('accounts.google.com') || url.includes('firebase')) {
      return { 
        action: 'allow',
        overrideBrowserWindowOptions: {
          icon: iconPath,
          title: 'Sign in - Google Accounts'
        }
      };
    }
    
    // Open other external links in default browser
    require('electron').shell.openExternal(url);
    return { action: 'deny' };
  });
  
  // Handle navigation for OAuth
  mainWindow.webContents.on('will-navigate', (event, url) => {
    console.log('Navigating to:', url);
    
    // Allow navigation to Google OAuth and Firebase
    if (url.includes('accounts.google.com') || 
        url.includes('firebase') || 
        url.includes('googleapis.com')) {
      // Allow navigation
      return;
    }
    
    // Prevent navigation to other external sites
    if (!url.startsWith('app://')) {
      event.preventDefault();
      require('electron').shell.openExternal(url);
    }
  });
}

// Register custom protocol before app is ready
app.whenReady().then(() => {
  if (!isDev) {
    // Register app:// protocol to serve local files
    protocol.handle('app', (request) => {
      const url = request.url.replace('app://', '');
      const filePath = path.normalize(path.join(__dirname, '../web-build', url));
      
      console.log('Serving:', filePath);
      
      return new Promise((resolve, reject) => {
        fs.readFile(filePath, (err, data) => {
          if (err) {
            console.error('Error reading file:', err);
            reject(err);
            return;
          }
          
          // Determine content type
          const ext = path.extname(filePath).toLowerCase();
          const mimeTypes = {
            '.html': 'text/html',
            '.js': 'text/javascript',
            '.css': 'text/css',
            '.json': 'application/json',
            '.png': 'image/png',
            '.jpg': 'image/jpeg',
            '.gif': 'image/gif',
            '.svg': 'image/svg+xml',
            '.ttf': 'font/ttf',
            '.woff': 'font/woff',
            '.woff2': 'font/woff2',
          };
          
          const mimeType = mimeTypes[ext] || 'application/octet-stream';
          
          resolve(new Response(data, {
            headers: { 'Content-Type': mimeType }
          }));
        });
      });
    });
  }
  
  createWindow();
});

// Quit when all windows are closed
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Activate (macOS)
app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Prevent multiple instances
const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });
}
