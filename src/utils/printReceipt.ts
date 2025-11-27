import { Transaction } from '../types';
import { formatCurrency, formatDateTime } from './helpers';
import { Platform } from 'react-native';

// Print untuk web menggunakan iframe tersembunyi (silent print)
export const printReceipt = async (transaction: Transaction, settings: any) => {
  const html = generateReceiptHTML(transaction, settings);

  if (Platform.OS === 'web') {
    // Check if running in Electron
    const isElectron = typeof window !== 'undefined' && (window as any).electron;
    
    if (isElectron) {
      // Use Electron's native print API
      try {
        console.log('🖨️ Using Electron print API');
        const result = await (window as any).electron.printReceipt(html);
        if (result.success) {
          console.log('✅ Print successful');
          return true;
        } else {
          console.error('❌ Print failed:', result.error);
          return false;
        }
      } catch (error) {
        console.error('❌ Electron print error:', error);
        // Fallback to iframe method
      }
    }
    
    // Fallback: Gunakan iframe tersembunyi untuk silent print (browser)
    try {
      // Hapus iframe lama jika ada
      const oldIframe = document.getElementById('print-iframe');
      if (oldIframe) {
        oldIframe.remove();
      }

      // Buat iframe baru
      const iframe = document.createElement('iframe');
      iframe.id = 'print-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';

      document.body.appendChild(iframe);

      // Tulis HTML ke iframe
      const iframeDoc = iframe.contentWindow?.document;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(html);
        iframeDoc.close();

        // Tunggu load selesai, lalu print
        iframe.onload = () => {
          setTimeout(() => {
            try {
              iframe.contentWindow?.focus();
              iframe.contentWindow?.print();

              // Hapus iframe setelah print
              setTimeout(() => {
                iframe.remove();
              }, 1000);
            } catch (e) {
              console.error('Print error:', e);
            }
          }, 500);
        };

        return true;
      }
      return false;
    } catch (error) {
      console.error('Print error:', error);
      return false;
    }
  } else {
    // Untuk mobile, gunakan expo-print (jika ada)
    try {
      const Print = require('expo-print');
      await Print.printAsync({ html });
      return true;
    } catch (error) {
      console.error('Print error:', error);
      return false;
    }
  }
};

export const generateReceiptHTML = (transaction: Transaction, settings: any) => {
  const storeName = settings?.storeName || 'BETA KASIR';
  const storeAddress = settings?.storeAddress || 'Jl. Contoh No. 123, Jakarta';
  const storePhone = settings?.storePhone || 'Telp: 021-12345678';
  const receiptFooter = settings?.receiptFooter || 'Terima Kasih Atas Kunjungan Anda';
  const receiptNote = settings?.receiptNote || 'Barang yang sudah dibeli\ntidak dapat ditukar/dikembalikan';
  const receiptWebsite = settings?.receiptWebsite || 'www.betakasir.com';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Struk - ${transaction.id}</title>
  <style>
    @page { margin: 0; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; margin: 0; padding: 0; }
    body { font-family: 'Courier New', monospace; padding: 20px; max-width: 400px; margin: 0 auto; background: white; }
    .print-button {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: #dc2626;
      color: white;
      border: none;
      padding: 15px 30px;
      font-size: 16px;
      font-weight: bold;
      border-radius: 8px;
      cursor: pointer;
      box-shadow: 0 4px 6px rgba(0,0,0,0.3);
      z-index: 9999;
    }
    .print-button:hover {
      background: #b91c1c;
    }
    .print-button:active {
      transform: scale(0.95);
    }
    @media print {
      .print-button { display: none !important; }
    }
  </style>
  <script>
    function printReceipt() {
      window.print();
    }
    // Auto-trigger print dialog after page loads
    window.addEventListener('load', function() {
      setTimeout(function() {
        window.print();
      }, 500);
    });
  </script>
</head>
<body style="background: white; color: #000;">
  <div style="text-align: center; padding-bottom: 15px; margin-bottom: 15px; border-bottom: 3px solid #000;">
    <div style="font-size: 22px; font-weight: bold; color: #000; margin-bottom: 8px; text-transform: uppercase;">${storeName}</div>
    <div style="font-size: 13px; color: #000; margin: 3px 0;">${storeAddress}</div>
    <div style="font-size: 13px; color: #000; margin: 3px 0;">Telp: ${storePhone}</div>
  </div>
  <div style="margin: 15px 0; padding: 10px 0; border-bottom: 1px dashed #000;">
    <div style="display: flex; justify-content: space-between; margin: 5px 0; color: #000; font-size: 13px;">
      <span style="font-weight: bold; color: #000;">No. Transaksi:</span>
      <span style="color: #000;">${transaction.id.substring(0, 12)}</span>
    </div>
    <div style="display: flex; justify-content: space-between; margin: 5px 0; color: #000; font-size: 13px;">
      <span style="font-weight: bold; color: #000;">Tanggal:</span>
      <span style="color: #000;">${formatDateTime(transaction.createdAt)}</span>
    </div>
    <div style="display: flex; justify-content: space-between; margin: 5px 0; color: #000; font-size: 13px;">
      <span style="font-weight: bold; color: #000;">Kasir:</span>
      <span style="color: #000;">${transaction.cashierId}</span>
    </div>
  </div>
  <div style="margin: 15px 0;">
    ${transaction.items.map((item) => `
    <div style="margin: 8px 0;">
      <div style="font-weight: bold; color: #000; margin-bottom: 2px;">${item.product.name}</div>
      <div style="display: flex; justify-content: space-between; font-size: 13px; color: #000;">
        <span style="color: #000;">${item.quantity} x ${formatCurrency(item.product.price)}</span>
        <span style="color: #000;">${formatCurrency(item.product.price * item.quantity)}</span>
      </div>
    </div>
    `).join('')}
  </div>
  <div style="margin: 20px 0; padding-top: 15px; border-top: 2px solid #000;">
    <div style="display: flex; justify-content: space-between; margin: 12px 0; padding-top: 12px; border-top: 2px solid #000;">
      <span style="font-size: 18px; font-weight: bold; color: #000;">TOTAL</span>
      <span style="font-size: 18px; font-weight: bold; color: #000;">${formatCurrency(transaction.total)}</span>
    </div>
    ${transaction.paymentMethod === 'cash' ? `
    <div style="display: flex; justify-content: space-between; margin: 8px 0; font-size: 14px;">
      <span style="font-weight: 600; color: #000;">Tunai</span>
      <span style="font-weight: 600; color: #000;">${formatCurrency(transaction.cashReceived || 0)}</span>
    </div>
    <div style="display: flex; justify-content: space-between; margin: 8px 0; font-size: 14px;">
      <span style="font-weight: 600; color: #000;">Kembalian</span>
      <span style="font-weight: 600; color: #000;">${formatCurrency(transaction.change || 0)}</span>
    </div>
    ` : `
    <div style="display: flex; justify-content: space-between; margin: 8px 0; font-size: 14px;">
      <span style="font-weight: 600; color: #000;">Pembayaran</span>
      <span style="font-weight: 600; color: #000;">${transaction.paymentMethod.toUpperCase()}</span>
    </div>
    `}
  </div>
  <div style="text-align: center; margin-top: 20px; padding-top: 15px; border-top: 2px dashed #000;">
    <div style="font-size: 12px; color: #000; margin: 5px 0; font-weight: bold;">${receiptFooter}</div>
    ${receiptNote.split('\n').map((line: string) => `<div style="font-size: 11px; color: #000; margin: 3px 0;">${line}</div>`).join('')}
    ${receiptWebsite ? `<div style="font-size: 11px; color: #000; margin-top: 10px; font-weight: bold;">${receiptWebsite}</div>` : ''}
  </div>
  
  <!-- Print Button (hidden when printing) -->
  <button class="print-button" onclick="printReceipt()">🖨️ CETAK STRUK</button>
</body>
</html>`;
};
