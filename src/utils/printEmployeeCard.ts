// Utility untuk generate dan print ID card karyawan

import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import { Employee } from '../types/employee';
import { getRoleDisplayName, getRoleColor } from './employeeHelpers';

// Generate QR Code sticker untuk ditempel di ID card
export async function generateEmployeeBarcodeHTML(employee: Employee, storeName: string): Promise<string> {
  // Create QR code data dengan username dan password (plain text, tidak di-hash)
  // Format JSON untuk mudah di-parse saat scan
  const qrData = JSON.stringify({
    username: employee.username,
    employeeId: employee.employeeId,
    name: employee.name,
    type: 'employee_login'
  });

  // Encode data untuk URL
  const encodedData = encodeURIComponent(qrData);
  
  // Generate QR Code menggunakan API gratis (quickchart.io)
  // API ini generate QR code real yang bisa di-scan
  const qrCodeURL = `https://quickchart.io/qr?text=${encodedData}&size=300&margin=2&ecLevel=H`;
  
  // Alternative API (jika quickchart.io down):
  // const qrCodeURL = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodedData}&ecc=H`;
  // const qrCodeURL = `https://chart.googleapis.com/chart?cht=qr&chs=300x300&chl=${encodedData}&choe=UTF-8`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>QR Code - ${employee.name}</title>
  <style>
    @page { 
      margin: 0; 
      size: 80mm 100mm;
    }
    * { 
      -webkit-print-color-adjust: exact !important; 
      print-color-adjust: exact !important; 
      margin: 0; 
      padding: 0; 
      box-sizing: border-box; 
    }
    body { 
      font-family: Arial, Helvetica, sans-serif; 
      background: white;
      margin: 0;
      padding: 0;
    }
  </style>
</head>
<body style="background: white; color: #000;">
  <!-- QR Code Sticker - Single Page -->
  <div style="width: 80mm; height: 100mm; background: white; border: 2px dashed #999; border-radius: 4px; padding: 5mm; text-align: center; page-break-after: always;">
    
    <!-- Store Name -->
    <div style="font-size: 12px; font-weight: bold; color: #333; margin-bottom: 4mm; text-transform: uppercase;">${storeName}</div>
    
    <!-- Real QR Code from API -->
    <div style="width: 60mm; height: 60mm; margin: 0 auto; background: white; padding: 0; display: flex; align-items: center; justify-content: center;">
      <img src="${qrCodeURL}" 
           style="width: 100%; height: 100%; object-fit: contain;" 
           alt="QR Code"
           crossorigin="anonymous" />
    </div>
    
    <!-- Employee Info -->
    <div style="margin-top: 4mm;">
      <div style="font-size: 13px; font-weight: bold; color: #000; margin-bottom: 2mm;">${employee.name}</div>
      <div style="font-size: 16px; font-family: 'Courier New', monospace; font-weight: bold; color: #000; letter-spacing: 2px;">${employee.employeeId}</div>
    </div>
    
    <div style="font-size: 9px; color: #666; margin-top: 3mm;">Scan untuk login otomatis</div>
    
  </div>
</body>
</html>`;
}

// Generate full ID card (untuk preview/reference saja)
export async function generateEmployeeCardHTML(employee: Employee, storeName: string): Promise<string> {
  const roleColor = getRoleColor(employee.role);
  const roleDisplay = getRoleDisplayName(employee.role);
  const joinDate = new Date(employee.joinDate);
  const validUntil = new Date(joinDate);
  validUntil.setFullYear(validUntil.getFullYear() + 1);

  // Konversi hex color ke RGB untuk background
  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : { r: 220, g: 20, b: 60 };
  };

  const rgb = hexToRgb(roleColor);
  const bgLight = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.15)`;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>ID Card - ${employee.name}</title>
  <style>
    @page { margin: 0; size: 85.6mm 53.98mm; }
    * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; padding: 5mm; background: white; }
  </style>
</head>
<body style="background: white; color: #000;">
  <!-- ID Card Container -->
  <div style="width: 85.6mm; height: 53.98mm; background: white; border: 2px solid #000; border-radius: 6px; overflow: hidden; position: relative;">
    
    <!-- Header -->
    <div style="background: ${roleColor}; padding: 8px 10px; color: white; border-bottom: 2px solid #000;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="vertical-align: middle;">
            <div style="font-size: 16px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 2px; color: white;">${storeName}</div>
            <div style="font-size: 9px; color: white; opacity: 0.9;">EMPLOYEE ID CARD</div>
          </td>
          <td style="vertical-align: middle; text-align: right;">
            <div style="font-size: 11px; font-weight: bold; font-family: 'Courier New', monospace; color: white;">${employee.employeeId}</div>
          </td>
        </tr>
      </table>
    </div>
    
    <!-- Body -->
    <div style="padding: 8px 10px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="width: 65px; vertical-align: top; padding-right: 8px;">
            <!-- Photo -->
            <div style="width: 65px; height: 80px; border: 2px solid ${roleColor}; border-radius: 4px; background: ${bgLight}; text-align: center; padding-top: 20px;">
              <div style="font-size: 36px; font-weight: bold; color: ${roleColor};">${employee.name.charAt(0).toUpperCase()}</div>
            </div>
          </td>
          <td style="vertical-align: top;">
            <!-- Info -->
            <div style="font-size: 14px; font-weight: bold; color: #000; text-transform: uppercase; margin-bottom: 4px; line-height: 1.2;">${employee.name}</div>
            <div style="display: inline-block; background: ${roleColor}; color: white; padding: 2px 8px; border-radius: 3px; font-size: 9px; font-weight: bold; margin-bottom: 6px;">${roleDisplay}</div>
            <div style="font-size: 9px; color: #333; line-height: 1.5;">
              ${employee.phone ? `<div style="margin-bottom: 2px;"><span style="font-weight: bold; display: inline-block; width: 45px;">Phone:</span> ${employee.phone}</div>` : ''}
              ${employee.email ? `<div style="margin-bottom: 2px;"><span style="font-weight: bold; display: inline-block; width: 45px;">Email:</span> ${employee.email}</div>` : ''}
              <div style="margin-bottom: 2px;"><span style="font-weight: bold; display: inline-block; width: 45px;">Joined:</span> ${joinDate.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
            </div>
          </td>
        </tr>
      </table>
    </div>
    
    <!-- Footer with QR Code -->
    <div style="position: absolute; bottom: 0; left: 0; right: 0; background: #f5f5f5; border-top: 1px solid #ddd; padding: 5px 10px;">
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="width: 30mm; vertical-align: middle;">
            <div style="font-size: 7px; color: #666; margin-bottom: 2px; text-align: center;">SCAN TO LOGIN</div>
            <!-- Mini QR Code -->
            <div style="width: 25mm; height: 25mm; background: white; border: 2px solid #333; margin: 0 auto;">
              <div style="width: 100%; height: 100%; background: repeating-linear-gradient(0deg, #000 0px, #000 2px, #fff 2px, #fff 4px), repeating-linear-gradient(90deg, #000 0px, #000 2px, #fff 2px, #fff 4px);"></div>
            </div>
            <div style="font-size: 7px; text-align: center; font-family: 'Courier New', monospace; font-weight: bold; margin-top: 2px; color: #000;">${employee.employeeId}</div>
          </td>
          <td style="vertical-align: middle; text-align: right; font-size: 7px; color: #666; padding-left: 8px;">
            <div style="font-weight: bold; margin-bottom: 2px;">VALID UNTIL</div>
            <div style="color: #000; font-weight: bold; font-size: 9px;">${validUntil.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' }).toUpperCase()}</div>
          </td>
        </tr>
      </table>
    </div>
    
  </div>
</body>
</html>`;
}

// Print barcode sticker (untuk ditempel di ID card dari Canva)
// Download QR code as image
export async function downloadEmployeeQRCode(employee: Employee, storeName: string): Promise<void> {
  try {
    // Create QR data
    const qrData = JSON.stringify({
      username: employee.username,
      employeeId: employee.employeeId,
      name: employee.name,
      type: 'employee_login'
    });

    const encodedData = encodeURIComponent(qrData);
    const qrCodeURL = `https://quickchart.io/qr?text=${encodedData}&size=500&margin=2&ecLevel=H`;

    // Check if running on web
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      // Web: Download using anchor tag
      const link = document.createElement('a');
      link.href = qrCodeURL;
      link.download = `QR_${employee.employeeId}_${employee.name.replace(/\s+/g, '_')}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // Mobile: Use expo-file-system and expo-sharing
      const FileSystem = require('expo-file-system');
      const Sharing = require('expo-sharing');
      
      const fileUri = FileSystem.documentDirectory + `QR_${employee.employeeId}.png`;
      
      // Download QR code
      const downloadResult = await FileSystem.downloadAsync(qrCodeURL, fileUri);
      
      // Share the file
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(downloadResult.uri);
      }
    }
  } catch (error) {
    console.error('Error downloading QR code:', error);
    throw error;
  }
}

// Print QR code sticker (untuk ditempel di ID card dari Canva)
export async function printEmployeeBarcode(employee: Employee, storeName: string): Promise<void> {
  try {
    const html = await generateEmployeeBarcodeHTML(employee, storeName);
    
    // Check if running on web
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      // Web: Use iframe for printing
      const oldIframe = document.getElementById('print-barcode-iframe');
      if (oldIframe) {
        oldIframe.remove();
      }

      const iframe = document.createElement('iframe');
      iframe.id = 'print-barcode-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';

      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentWindow?.document;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(html);
        iframeDoc.close();

        iframe.onload = () => {
          setTimeout(() => {
            try {
              iframe.contentWindow?.focus();
              iframe.contentWindow?.print();

              setTimeout(() => {
                iframe.remove();
              }, 1000);
            } catch (e) {
              console.error('Print error:', e);
            }
          }, 500);
        };
      }
    } else {
      // Mobile: Use expo-print
      const { uri } = await Print.printToFileAsync({ html });
      await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    }
  } catch (error) {
    console.error('Error printing barcode:', error);
    throw error;
  }
}

// Print full ID card (untuk preview/reference)
export async function printEmployeeCard(employee: Employee, storeName: string): Promise<void> {
  try {
    const html = await generateEmployeeCardHTML(employee, storeName);
    
    // Check if running on web
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      // Web: Use iframe for printing
      const oldIframe = document.getElementById('print-id-card-iframe');
      if (oldIframe) {
        oldIframe.remove();
      }

      const iframe = document.createElement('iframe');
      iframe.id = 'print-id-card-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';

      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentWindow?.document;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(html);
        iframeDoc.close();

        iframe.onload = () => {
          setTimeout(() => {
            try {
              iframe.contentWindow?.focus();
              iframe.contentWindow?.print();

              setTimeout(() => {
                iframe.remove();
              }, 1000);
            } catch (e) {
              console.error('Print error:', e);
            }
          }, 500);
        };
      }
    } else {
      // Mobile: Use expo-print
      const { uri } = await Print.printToFileAsync({ html });
      await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    }
  } catch (error) {
    console.error('Error printing employee card:', error);
    throw error;
  }
}

export async function printMultipleEmployeeCards(employees: Employee[], storeName: string): Promise<void> {
  try {
    // Generate HTML for all cards
    const cardsHTML = await Promise.all(
      employees.map(emp => generateEmployeeCardHTML(emp, storeName))
    );
    
    // Combine all cards in one document
    const combinedHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          @page { margin: 0; }
          * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          body { margin: 0; padding: 20px; background: white; }
          .page-break { page-break-after: always; }
        </style>
      </head>
      <body>
        ${cardsHTML.map((html, index) => `
          <div class="${index < cardsHTML.length - 1 ? 'page-break' : ''}">
            ${html.replace(/<!DOCTYPE html>|<html>|<\/html>|<head>.*?<\/head>|<body.*?>|<\/body>/gs, '')}
          </div>
        `).join('')}
      </body>
      </html>
    `;
    
    // Check if running on web
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      // Web: Use iframe for printing
      const oldIframe = document.getElementById('print-multiple-cards-iframe');
      if (oldIframe) {
        oldIframe.remove();
      }

      const iframe = document.createElement('iframe');
      iframe.id = 'print-multiple-cards-iframe';
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = 'none';

      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentWindow?.document;
      if (iframeDoc) {
        iframeDoc.open();
        iframeDoc.write(combinedHTML);
        iframeDoc.close();

        iframe.onload = () => {
          setTimeout(() => {
            try {
              iframe.contentWindow?.focus();
              iframe.contentWindow?.print();

              setTimeout(() => {
                iframe.remove();
              }, 1000);
            } catch (e) {
              console.error('Print error:', e);
            }
          }, 500);
        };
      }
    } else {
      // Mobile: Use expo-print
      const { uri } = await Print.printToFileAsync({ html: combinedHTML });
      await shareAsync(uri, { UTI: '.pdf', mimeType: 'application/pdf' });
    }
  } catch (error) {
    console.error('Error printing multiple employee cards:', error);
    throw error;
  }
}
