#!/usr/bin/env node

/**
 * Build Script untuk macOS
 * 
 * Script ini membantu build aplikasi BetaKasir untuk macOS
 * dengan validasi dan error handling yang lebih baik
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Colors untuk console output
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkPlatform() {
  log('\n🔍 Checking platform...', 'cyan');
  
  if (process.platform !== 'darwin') {
    log('\n❌ ERROR: macOS build can only be done on macOS!', 'red');
    log('\n📝 You are currently on: ' + process.platform, 'yellow');
    log('\n💡 Solutions:', 'cyan');
    log('   1. Transfer project to a MacBook and build there', 'yellow');
    log('   2. Use GitHub Actions to build in the cloud', 'yellow');
    log('   3. See BUILD_MACOS_GUIDE.md for details', 'yellow');
    process.exit(1);
  }
  
  log('✅ Platform: macOS', 'green');
}

function checkNodeVersion() {
  log('\n🔍 Checking Node.js version...', 'cyan');
  
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.split('.')[0].substring(1));
  
  if (majorVersion < 16) {
    log(`\n❌ ERROR: Node.js 16+ required, you have ${nodeVersion}`, 'red');
    log('\n💡 Download from: https://nodejs.org', 'yellow');
    process.exit(1);
  }
  
  log(`✅ Node.js version: ${nodeVersion}`, 'green');
}

function checkXcode() {
  log('\n🔍 Checking Xcode Command Line Tools...', 'cyan');
  
  try {
    execSync('xcode-select -p', { stdio: 'ignore' });
    log('✅ Xcode Command Line Tools installed', 'green');
  } catch (error) {
    log('\n❌ ERROR: Xcode Command Line Tools not found!', 'red');
    log('\n💡 Install with: xcode-select --install', 'yellow');
    process.exit(1);
  }
}

function checkDependencies() {
  log('\n🔍 Checking dependencies...', 'cyan');
  
  if (!fs.existsSync(path.join(__dirname, '..', 'node_modules'))) {
    log('⚠️  node_modules not found, installing...', 'yellow');
    try {
      execSync('npm install', { stdio: 'inherit' });
      log('✅ Dependencies installed', 'green');
    } catch (error) {
      log('\n❌ ERROR: Failed to install dependencies', 'red');
      process.exit(1);
    }
  } else {
    log('✅ Dependencies found', 'green');
  }
}

function checkEnvFile() {
  log('\n🔍 Checking environment variables...', 'cyan');
  
  const envPath = path.join(__dirname, '..', '.env');
  
  if (!fs.existsSync(envPath)) {
    log('⚠️  .env file not found', 'yellow');
    log('💡 Copy .env.example to .env and configure it', 'yellow');
    
    const envExamplePath = path.join(__dirname, '..', '.env.example');
    if (fs.existsSync(envExamplePath)) {
      log('📋 Creating .env from .env.example...', 'cyan');
      fs.copyFileSync(envExamplePath, envPath);
      log('✅ .env created, please configure it before building', 'green');
    }
  } else {
    log('✅ .env file found', 'green');
  }
}

function checkDiskSpace() {
  log('\n🔍 Checking disk space...', 'cyan');
  
  try {
    const output = execSync('df -h .', { encoding: 'utf8' });
    const lines = output.split('\n');
    if (lines.length > 1) {
      const parts = lines[1].split(/\s+/);
      const available = parts[3];
      log(`✅ Available disk space: ${available}`, 'green');
    }
  } catch (error) {
    log('⚠️  Could not check disk space', 'yellow');
  }
}

function cleanBuild() {
  log('\n🧹 Cleaning previous build...', 'cyan');
  
  const distPath = path.join(__dirname, '..', 'dist');
  const webBuildPath = path.join(__dirname, '..', 'web-build');
  
  if (fs.existsSync(distPath)) {
    fs.rmSync(distPath, { recursive: true, force: true });
    log('✅ Cleaned dist folder', 'green');
  }
  
  if (fs.existsSync(webBuildPath)) {
    fs.rmSync(webBuildPath, { recursive: true, force: true });
    log('✅ Cleaned web-build folder', 'green');
  }
}

function buildWeb() {
  log('\n📦 Building web version...', 'cyan');
  log('⏳ This may take a few minutes...', 'yellow');
  
  try {
    execSync('npm run build-web', { stdio: 'inherit' });
    log('\n✅ Web build completed', 'green');
  } catch (error) {
    log('\n❌ ERROR: Web build failed', 'red');
    process.exit(1);
  }
}

function buildMac() {
  log('\n🍎 Building macOS application...', 'cyan');
  log('⏳ This may take 5-10 minutes...', 'yellow');
  log('💡 Grab a coffee ☕', 'magenta');
  
  try {
    execSync('electron-builder --mac', { stdio: 'inherit' });
    log('\n✅ macOS build completed!', 'green');
  } catch (error) {
    log('\n❌ ERROR: macOS build failed', 'red');
    process.exit(1);
  }
}

function showResults() {
  log('\n🎉 BUILD SUCCESSFUL!', 'green');
  log('\n📦 Build artifacts:', 'cyan');
  
  const distPath = path.join(__dirname, '..', 'dist');
  
  if (fs.existsSync(distPath)) {
    const files = fs.readdirSync(distPath);
    const dmgFiles = files.filter(f => f.endsWith('.dmg'));
    
    if (dmgFiles.length > 0) {
      dmgFiles.forEach(file => {
        const filePath = path.join(distPath, file);
        const stats = fs.statSync(filePath);
        const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        log(`   ✅ ${file} (${sizeMB} MB)`, 'green');
      });
      
      log('\n📍 Location: dist/', 'cyan');
      log('\n🚀 Next steps:', 'cyan');
      log('   1. Open the .dmg file', 'yellow');
      log('   2. Drag BetaKasir.app to Applications folder', 'yellow');
      log('   3. Launch from Applications', 'yellow');
      log('\n💡 If you get security warning:', 'cyan');
      log('   Right-click > Open (first time only)', 'yellow');
    } else {
      log('⚠️  No .dmg files found in dist/', 'yellow');
    }
  }
}

// Main execution
async function main() {
  log('\n╔════════════════════════════════════════╗', 'cyan');
  log('║   BetaKasir macOS Build Script v1.0   ║', 'cyan');
  log('╚════════════════════════════════════════╝', 'cyan');
  
  try {
    checkPlatform();
    checkNodeVersion();
    checkXcode();
    checkDependencies();
    checkEnvFile();
    checkDiskSpace();
    
    log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
    log('   All checks passed! Starting build...', 'green');
    log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━', 'cyan');
    
    cleanBuild();
    buildWeb();
    buildMac();
    showResults();
    
    log('\n✨ Done! Happy selling with BetaKasir! ✨\n', 'magenta');
    
  } catch (error) {
    log('\n❌ Build failed with error:', 'red');
    log(error.message, 'red');
    process.exit(1);
  }
}

main();
