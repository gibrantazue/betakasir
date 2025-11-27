// Script untuk membersihkan duplikat di localStorage
// Copy-paste script ini ke Console browser (F12)

(async function cleanDuplicates() {
  console.log('🔍 Checking for duplicate employees in localStorage...\n');
  
  try {
    // Get current store data
    const storeData = localStorage.getItem('app-storage');
    if (!storeData) {
      console.log('❌ No app-storage found in localStorage');
      return;
    }
    
    const store = JSON.parse(storeData);
    const employees = store.state?.employees || [];
    
    console.log(`📊 Total employees in localStorage: ${employees.length}`);
    
    if (employees.length === 0) {
      console.log('ℹ️  No employees found');
      return;
    }
    
    // Find duplicates by employeeId
    const seen = new Map();
    const duplicates = [];
    const unique = [];
    
    employees.forEach((emp, index) => {
      const key = emp.employeeId;
      
      if (seen.has(key)) {
        console.log(`\n🔴 DUPLICATE FOUND:`);
        console.log(`   Employee ID: ${emp.employeeId}`);
        console.log(`   Name: ${emp.name}`);
        console.log(`   Username: ${emp.username}`);
        console.log(`   Index: ${index}`);
        duplicates.push(emp);
      } else {
        seen.set(key, emp);
        unique.push(emp);
      }
    });
    
    if (duplicates.length === 0) {
      console.log('\n✅ No duplicates found! Data is clean.');
      return;
    }
    
    console.log(`\n⚠️  Found ${duplicates.length} duplicate(s)`);
    console.log(`✅ Keeping ${unique.length} unique employee(s)`);
    
    // Update store with unique employees only
    store.state.employees = unique;
    localStorage.setItem('app-storage', JSON.stringify(store));
    
    console.log('\n✅ Duplicates removed from localStorage!');
    console.log('\n📋 Remaining employees:');
    unique.forEach((emp, i) => {
      console.log(`   ${i + 1}. ${emp.name} (${emp.username}) - ${emp.employeeId}`);
    });
    
    console.log('\n🔄 Reloading page to apply changes...');
    setTimeout(() => {
      location.reload();
    }, 2000);
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
})();
