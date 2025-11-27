// Simple script to check "business" references in code files only
const fs = require('fs');
const path = require('path');

console.log('🔍 Checking for "business" references in code files...\n');

const filesToCheck = [
  'src/screens/AdminDashboardScreen.tsx',
  'src/screens/BillingScreen.tsx',
  'src/screens/HomeScreen.tsx',
  'src/services/subscriptionService.ts',
  'src/types/subscription.ts',
  'src/components/FeatureGate.tsx',
  'src/hooks/useSubscription.ts'
];

let foundReferences = [];

filesToCheck.forEach(file => {
  const filePath = path.join(process.cwd(), file);
  
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    
    lines.forEach((line, index) => {
      // Check for "business" (case insensitive)
      if (line.toLowerCase().includes('business') && !line.includes('//') && !line.includes('businessName')) {
        foundReferences.push({
          file,
          line: index + 1,
          content: line.trim()
        });
      }
    });
  }
});

console.log('📊 Results:\n');

if (foundReferences.length === 0) {
  console.log('✅ No "business" references found in code files!');
  console.log('✅ All code has been updated to "pro"');
} else {
  console.log(`❌ Found ${foundReferences.length} references to "business":\n`);
  
  foundReferences.forEach(ref => {
    console.log(`📄 ${ref.file}:${ref.line}`);
    console.log(`   ${ref.content}`);
    console.log('');
  });
}

console.log('\n💡 Note: This only checks code files.');
console.log('💡 Database (Firestore) needs to be checked separately.');
console.log('💡 Use Firebase Console to check/update Firestore data.');
