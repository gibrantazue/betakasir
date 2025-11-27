// Entry point - detect environment and load appropriate code
// This file is needed because Expo tries to load the "main" field in package.json

// Check if running in Electron
if (typeof process !== 'undefined' && process.versions && process.versions.electron) {
  // Running in Electron - load electron main process
  require('./electron/main.js');
} else {
  // Running in browser/Expo - load Expo entry
  require('expo/AppEntry');
}
