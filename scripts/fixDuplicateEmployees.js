// Script untuk membersihkan data karyawan duplikat
// Jalankan: node scripts/fixDuplicateEmployees.js

const admin = require('firebase-admin');
const serviceAccount = require('../firebase-admin-key.json');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}

const db = admin.firestore();

async function fixDuplicateEmployees() {
  try {
    console.log('🔍 Mencari data karyawan duplikat...\n');
    
    // Get all sellers
    const sellersSnapshot = await db.collection('sellers').get();
    
    for (const sellerDoc of sellersSnapshot.docs) {
      const sellerId = sellerDoc.id;
      const sellerData = sellerDoc.data();
      
      console.log(`\n📋 Checking seller: ${sellerData.displayName || sellerData.email} (${sellerId})`);
      
      // Get all employees for this seller
      const employeesSnapshot = await db
        .collection('sellers')
        .doc(sellerId)
        .collection('employees')
        .get();
      
      if (employeesSnapshot.empty) {
        console.log('  ℹ️  No employees found');
        continue;
      }
      
      console.log(`  📊 Total employees: ${employeesSnapshot.size}`);
      
      // Group by employeeId to find duplicates
      const employeeMap = new Map();
      const duplicates = [];
      
      employeesSnapshot.docs.forEach(doc => {
        const data = doc.data();
        const employeeId = data.employeeId;
        
        if (employeeMap.has(employeeId)) {
          // Found duplicate!
          duplicates.push({
            docId: doc.id,
            employeeId: employeeId,
            name: data.name,
            username: data.username,
            createdAt: data.createdAt
          });
        } else {
          employeeMap.set(employeeId, {
            docId: doc.id,
            employeeId: employeeId,
            name: data.name,
            username: data.username,
            createdAt: data.createdAt
          });
        }
      });
      
      if (duplicates.length === 0) {
        console.log('  ✅ No duplicates found');
        continue;
      }
      
      console.log(`  ⚠️  Found ${duplicates.length} duplicate(s):`);
      
      // Show duplicates
      for (const dup of duplicates) {
        const original = employeeMap.get(dup.employeeId);
        console.log(`\n    🔴 DUPLICATE:`);
        console.log(`       Employee ID: ${dup.employeeId}`);
        console.log(`       Name: ${dup.name}`);
        console.log(`       Username: ${dup.username}`);
        console.log(`       Doc ID: ${dup.docId}`);
        console.log(`       Created: ${dup.createdAt}`);
        console.log(`\n    🟢 ORIGINAL:`);
        console.log(`       Employee ID: ${original.employeeId}`);
        console.log(`       Name: ${original.name}`);
        console.log(`       Username: ${original.username}`);
        console.log(`       Doc ID: ${original.docId}`);
        console.log(`       Created: ${original.createdAt}`);
        
        // Delete duplicate (keep the original)
        console.log(`\n    🗑️  Deleting duplicate...`);
        await db
          .collection('sellers')
          .doc(sellerId)
          .collection('employees')
          .doc(dup.docId)
          .delete();
        
        console.log(`    ✅ Duplicate deleted!`);
      }
      
      console.log(`\n  ✅ Cleaned up ${duplicates.length} duplicate(s) for this seller`);
    }
    
    console.log('\n\n✅ All duplicates cleaned up successfully!');
    console.log('\n📝 Summary:');
    console.log('   - Checked all sellers');
    console.log('   - Removed duplicate employees');
    console.log('   - Kept original employees');
    
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    process.exit(0);
  }
}

// Run the script
fixDuplicateEmployees();
