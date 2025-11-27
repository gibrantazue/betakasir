// Quick test script to verify Electron API is available
// Run this in browser console after opening the app

console.log('🧪 Testing Electron API...');
console.log('');

// Test 1: Check if window.electron exists
if (typeof window !== 'undefined' && window.electron) {
  console.log('✅ TEST 1 PASS: window.electron is available');
  console.log('   Platform:', window.electron.platform);
  console.log('   Is Electron:', window.electron.isElectron);
} else {
  console.log('❌ TEST 1 FAIL: window.electron is NOT available');
  console.log('   This means preload script is not loaded');
}

console.log('');

// Test 2: Check if all required functions exist
if (window.electron) {
  const requiredFunctions = [
    'checkForUpdates',
    'onUpdateAvailable',
    'onUpdateDownloaded',
    'onDownloadProgress',
    'onUpdateError'
  ];
  
  let allFunctionsExist = true;
  requiredFunctions.forEach(fn => {
    if (typeof window.electron[fn] === 'function') {
      console.log(`✅ TEST 2.${requiredFunctions.indexOf(fn) + 1} PASS: ${fn} exists`);
    } else {
      console.log(`❌ TEST 2.${requiredFunctions.indexOf(fn) + 1} FAIL: ${fn} NOT found`);
      allFunctionsExist = false;
    }
  });
  
  if (allFunctionsExist) {
    console.log('');
    console.log('✅ ALL TESTS PASSED!');
    console.log('');
    console.log('🎯 Next: Go to Settings and click "Cek Update"');
    console.log('   Expected: Should NOT open GitHub');
    console.log('   Expected: Should show alert "Mengecek update..."');
  }
} else {
  console.log('❌ CANNOT RUN TEST 2: window.electron not available');
}

console.log('');
console.log('📝 Full API:');
console.log(window.electron);
