// Quick test to verify RestockScreen can be imported
console.log('🧪 Testing RestockScreen import...');

try {
  // Test import RestockScreen
  const RestockScreen = require('./src/screens/RestockScreen.tsx');
  console.log('✅ RestockScreen imported successfully');
  console.log('📦 RestockScreen:', RestockScreen);
  
  // Test import restockService
  const restockService = require('./src/services/restockService.ts');
  console.log('✅ restockService imported successfully');
  console.log('🔧 restockService:', restockService);
  
  // Test import types
  const types = require('./src/types/restock.ts');
  console.log('✅ restock types imported successfully');
  console.log('📝 Types:', types);
  
  console.log('\n✅ All imports successful! Restock feature is ready.');
} catch (error) {
  console.error('❌ Import failed:', error);
  console.error('Stack:', error.stack);
}
