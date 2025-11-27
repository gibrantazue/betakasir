#!/usr/bin/env node

/**
 * Test GitHub Releases API
 * Cek apakah bisa fetch latest release dari GitHub
 */

const https = require('https');

console.log('🧪 Testing GitHub Releases API...\n');

const options = {
  hostname: 'api.github.com',
  path: '/repos/gibrantazue/betakasir/releases/latest',
  method: 'GET',
  headers: {
    'User-Agent': 'BetaKasir-App'
  }
};

const req = https.request(options, (res) => {
  let data = '';

  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    if (res.statusCode === 200) {
      const release = JSON.parse(data);
      
      console.log('✅ GitHub API Response:\n');
      console.log('Tag:', release.tag_name);
      console.log('Name:', release.name);
      console.log('Published:', release.published_at);
      console.log('\nAssets:');
      
      release.assets.forEach((asset, index) => {
        console.log(`${index + 1}. ${asset.name}`);
        console.log(`   URL: ${asset.browser_download_url}`);
        console.log(`   Size: ${(asset.size / 1024 / 1024).toFixed(2)} MB`);
      });
      
      console.log('\nChangelog:');
      const lines = release.body.split('\n');
      lines.forEach(line => {
        const trimmed = line.trim();
        if (trimmed.startsWith('-') || trimmed.startsWith('*') || trimmed.startsWith('•')) {
          console.log(`  ${trimmed}`);
        }
      });
      
      console.log('\n✅ GitHub API berfungsi dengan baik!');
      console.log('✅ Aplikasi akan otomatis deteksi update dari GitHub Releases');
      
    } else if (res.statusCode === 404) {
      console.log('❌ Error 404: Release tidak ditemukan');
      console.log('ℹ️  Pastikan sudah ada release di:');
      console.log('   https://github.com/gibrantazue/betakasir/releases');
      
    } else {
      console.log(`❌ Error ${res.statusCode}:`, data);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Network error:', error.message);
  console.log('ℹ️  Pastikan koneksi internet aktif');
});

req.end();
