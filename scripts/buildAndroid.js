#!/usr/bin/env node

/**
 * Script untuk build APK Android dan download otomatis ke folder dist/
 * Mirip seperti build EXE dan DMG
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const https = require('https');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
  cyan: '\x1b[36m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function execCommand(command, silent = false) {
  try {
    return execSync(command, { 
      stdio: silent ? 'pipe' : 'inherit',
      encoding: 'utf-8'
    });
  } catch (error) {
    if (silent) return null;
    throw error;
  }
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForBuild(buildId) {
  log('\n⏳ Menunggu build selesai...', colors.cyan);
  log('Ini bisa memakan waktu 15-30 menit', colors.yellow);
  
  let dots = 0;
  const maxDots = 3;
  
  while (true) {
    await sleep(30000); // Check setiap 30 detik
    
    try {
      const output = execCommand(`eas build:view ${buildId} --json`, true);
      const build = JSON.parse(output);
      
      if (build.status === 'FINISHED') {
        log('\n✓ Build selesai!', colors.green);
        return build.artifacts?.buildUrl;
      } else if (build.status === 'ERRORED' || build.status === 'CANCELED') {
        log(`\n✗ Build gagal dengan status: ${build.status}`, colors.red);
        return null;
      }
      
      // Show progress
      dots = (dots + 1) % (maxDots + 1);
      process.stdout.write(`\r⏳ Building${'.'.repeat(dots)}${' '.repeat(maxDots - dots)} (${build.status})`);
      
    } catch (error) {
      // Continue waiting
    }
  }
}

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    
    https.get(url, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        // Follow redirect
        return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      }
      
      const totalSize = parseInt(response.headers['content-length'], 10);
      let downloaded = 0;
      
      response.on('data', (chunk) => {
        downloaded += chunk.length;
        const percent = ((downloaded / totalSize) * 100).toFixed(1);
        process.stdout.write(`\r📥 Downloading: ${percent}%`);
      });
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(''); // New line
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function main() {
  const buildType = process.argv[2] || 'preview';
  const autoDownload = !process.argv.includes('--no-download');
  
  log('\n╔════════════════════════════════════════╗', colors.bright);
  log('║   BetaKasir - Android APK Builder     ║', colors.bright);
  log('╚════════════════════════════════════════╝', colors.bright);
  
  log(`\nBuild Profile: ${buildType}`, colors.yellow);
  log('Auto Download: ' + (autoDownload ? 'Yes' : 'No'), colors.yellow);

  // Check EAS CLI
  try {
    execCommand('eas --version', true);
  } catch {
    log('\n⚠️  EAS CLI belum terinstall!', colors.red);
    log('Install dengan: npm install -g eas-cli', colors.blue);
    process.exit(1);
  }

  // Check login
  try {
    execCommand('eas whoami', true);
    log('✓ Sudah login ke EAS', colors.green);
  } catch {
    log('\n⚠️  Belum login ke EAS!', colors.red);
    log('Login dengan: eas login', colors.blue);
    process.exit(1);
  }

  // Start build
  log('\n🚀 Memulai build APK Android...', colors.bright);
  
  try {
    const output = execCommand(
      `eas build --platform android --profile ${buildType} --non-interactive`,
      false
    );
    
    // Extract build ID from output
    const buildIdMatch = output?.toString().match(/Build ID: ([a-f0-9-]+)/i) || 
                        output?.toString().match(/https:\/\/expo\.dev\/.*\/builds\/([a-f0-9-]+)/i);
    const buildId = buildIdMatch ? buildIdMatch[1] : null;
    
    if (!buildId) {
      log('✗ Gagal mendapatkan build ID', colors.red);
      process.exit(1);
    }
    
    log(`✓ Build dimulai! ID: ${buildId}`, colors.green);
    log(`📊 Monitor: https://expo.dev/accounts/gibranargantara/projects/betakasir/builds/${buildId}`, colors.blue);
    
    if (!autoDownload) {
      log('\n✓ Build sedang berjalan di background', colors.green);
      log('Download manual dari dashboard setelah selesai', colors.yellow);
      return;
    }
    
    // Wait for build to complete
    const downloadUrl = await waitForBuild(buildId);
    
    if (!downloadUrl) {
      log('\n✗ Build gagal atau tidak ada URL download', colors.red);
      process.exit(1);
    }
    
    // Create dist folder
    const distDir = path.join(__dirname, '..', 'dist');
    if (!fs.existsSync(distDir)) {
      fs.mkdirSync(distDir, { recursive: true });
    }
    
    // Download APK
    const version = require('../package.json').version;
    const fileName = `BetaKasir-${version}-${buildType}.apk`;
    const filePath = path.join(distDir, fileName);
    
    log(`\n📥 Downloading APK ke dist/${fileName}...`, colors.cyan);
    await downloadFile(downloadUrl, filePath);
    
    const stats = fs.statSync(filePath);
    const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
    
    log('\n╔════════════════════════════════════════╗', colors.green);
    log('║        BUILD BERHASIL! 🎉             ║', colors.green);
    log('╚════════════════════════════════════════╝', colors.green);
    log(`\n✓ APK tersimpan di: dist/${fileName}`, colors.green);
    log(`✓ Ukuran file: ${fileSizeMB} MB`, colors.green);
    log('\n📱 Install APK di Android device:', colors.blue);
    log('   1. Transfer file ke Android', colors.blue);
    log('   2. Buka file APK', colors.blue);
    log('   3. Tap Install', colors.blue);
    
  } catch (error) {
    log('\n✗ Build gagal!', colors.red);
    log(error.message, colors.red);
    process.exit(1);
  }
}

main();
