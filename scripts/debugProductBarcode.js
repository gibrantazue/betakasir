// Script untuk debug barcode produk
// Jalankan di browser console untuk cek produk yang ada

console.log('🔍 DEBUG: Checking all products and their barcodes...\n');

// Get data from localStorage
const data = JSON.parse(localStorage.getItem('pos-app-data') || '{}');
const products = data.products || [];

console.log(`📦 Total products: ${products.length}\n`);

// List all products with their barcodes
products.forEach((product, index) => {
  console.log(`${index + 1}. ${product.name}`);
  console.log(`   🏷️ Barcode: "${product.barcode}" (${product.barcode ? product.barcode.length : 0} digit)`);
  console.log(`   💰 Harga: Rp ${product.price.toLocaleString()}`);
  console.log(`   📊 Stok: ${product.stock}`);
  console.log('');
});

// Search for specific barcode
const searchBarcode = '9311931024036';
console.log(`\n🔎 Searching for barcode: "${searchBarcode}"`);

const found = products.find(p => p.barcode === searchBarcode);

if (found) {
  console.log('✅ FOUND!');
  console.log(`   📦 Nama: ${found.name}`);
  console.log(`   🏷️ Barcode: ${found.barcode}`);
  console.log(`   💰 Harga: Rp ${found.price.toLocaleString()}`);
} else {
  console.log('❌ NOT FOUND!');
  console.log('\n📋 Available barcodes:');
  products.forEach(p => {
    if (p.barcode) {
      console.log(`   - ${p.name}: "${p.barcode}"`);
    } else {
      console.log(`   - ${p.name}: (no barcode)`);
    }
  });
}

// Check for similar barcodes
console.log(`\n🔍 Checking for similar barcodes...`);
products.forEach(p => {
  if (p.barcode && p.barcode.includes('931193102')) {
    console.log(`   ⚠️ Similar: ${p.name} - "${p.barcode}"`);
  }
});
