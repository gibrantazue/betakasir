// Restock Service - Generate surat pesanan dan kirim ke supplier
import { RestockRequest } from '../types/restock';
import { Product } from '../types';
import { whatsappService } from './whatsappService';

class RestockService {
  // Generate surat pesanan text
  generateRestockLetter(request: RestockRequest, storeName: string, storeAddress: string, storePhone: string): string {
    const today = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    let letter = `📄 *SURAT PESANAN BARANG*\n`;
    letter += `No: ${request.id}\n`;
    letter += `Tanggal: ${today}\n\n`;
    letter += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    letter += `*DARI:*\n`;
    letter += `${storeName}\n`;
    letter += `${storeAddress}\n`;
    letter += `Telp: ${storePhone}\n\n`;
    
    letter += `*KEPADA:*\n`;
    letter += `${request.supplierName}\n`;
    if (request.supplierAddress) {
      letter += `${request.supplierAddress}\n`;
    }
    letter += `Telp: ${request.supplierPhone}\n\n`;
    
    letter += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    letter += `*DAFTAR PESANAN:*\n\n`;
    
    request.items.forEach((item, index) => {
      letter += `${index + 1}. *${item.productName}*\n`;
      letter += `   Jumlah: ${item.requestedQuantity} pcs\n`;
      if (item.notes) {
        letter += `   Catatan: ${item.notes}\n`;
      }
      letter += `\n`;
    });
    
    letter += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    
    if (request.notes) {
      letter += `*CATATAN:*\n${request.notes}\n\n`;
    }
    
    letter += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n`;
    letter += `Mohon konfirmasi ketersediaan barang dan waktu pengiriman.\n\n`;
    letter += `Terima kasih atas kerjasamanya.\n\n`;
    letter += `_Surat ini dibuat otomatis oleh BetaKasir_`;
    
    return letter;
  }

  // Generate HTML untuk PDF
  generateRestockHTML(request: RestockRequest, storeName: string, storeAddress: string, storePhone: string): string {
    const today = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    let html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Surat Pesanan - ${request.id}</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      color: #333;
    }
    .header {
      text-align: center;
      border-bottom: 3px solid #DC143C;
      padding-bottom: 20px;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #DC143C;
      margin: 0;
      font-size: 24px;
    }
    .info-section {
      margin-bottom: 30px;
    }
    .info-box {
      background: #f5f5f5;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 15px;
    }
    .info-box h3 {
      margin: 0 0 10px 0;
      color: #DC143C;
      font-size: 16px;
    }
    .info-box p {
      margin: 5px 0;
      line-height: 1.6;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 20px 0;
    }
    th {
      background: #DC143C;
      color: white;
      padding: 12px;
      text-align: left;
      font-weight: bold;
    }
    td {
      padding: 10px 12px;
      border-bottom: 1px solid #ddd;
    }
    tr:hover {
      background: #f9f9f9;
    }
    .total-section {
      text-align: right;
      margin-top: 20px;
      padding: 15px;
      background: #f5f5f5;
      border-radius: 8px;
    }
    .total-amount {
      font-size: 20px;
      font-weight: bold;
      color: #DC143C;
    }
    .notes {
      background: #fff3cd;
      padding: 15px;
      border-left: 4px solid #ffc107;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 2px solid #ddd;
      color: #666;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>📄 SURAT PESANAN BARANG</h1>
    <p>No: ${request.id}</p>
    <p>Tanggal: ${today}</p>
  </div>

  <div class="info-section">
    <div class="info-box">
      <h3>DARI:</h3>
      <p><strong>${storeName}</strong></p>
      <p>${storeAddress}</p>
      <p>Telp: ${storePhone}</p>
    </div>

    <div class="info-box">
      <h3>KEPADA:</h3>
      <p><strong>${request.supplierName}</strong></p>
      ${request.supplierAddress ? `<p>${request.supplierAddress}</p>` : ''}
      <p>Telp: ${request.supplierPhone}</p>
    </div>
  </div>

  <h3 style="color: #DC143C;">DAFTAR PESANAN:</h3>
  <table>
    <thead>
      <tr>
        <th>No</th>
        <th>Nama Produk</th>
        <th>Jumlah</th>
      </tr>
    </thead>
    <tbody>
`;

    request.items.forEach((item, index) => {
      html += `
      <tr>
        <td>${index + 1}</td>
        <td>
          <strong>${item.productName}</strong>
          ${item.notes ? `<br><small style="color: #666;">${item.notes}</small>` : ''}
        </td>
        <td>${item.requestedQuantity} pcs</td>
      </tr>
`;
    });

    html += `
    </tbody>
  </table>
`;

    if (request.notes) {
      html += `
  <div class="notes">
    <strong>CATATAN:</strong><br>
    ${request.notes}
  </div>
`;
    }

    html += `
  <div class="footer">
    <p>Mohon konfirmasi ketersediaan barang dan waktu pengiriman.</p>
    <p>Terima kasih atas kerjasamanya.</p>
    <p><em>Surat ini dibuat otomatis oleh BetaKasir</em></p>
  </div>
</body>
</html>
`;

    return html;
  }

  // Send restock request via WhatsApp
  async sendRestockRequest(request: RestockRequest, storeName: string, storeAddress: string, storePhone: string): Promise<boolean> {
    const message = this.generateRestockLetter(request, storeName, storeAddress, storePhone);
    
    return whatsappService.sendMessage({
      to: request.supplierPhone,
      message,
      type: 'text',
    });
  }

  // Load jsPDF library dynamically
  private async loadJsPDF(): Promise<any> {
    if (typeof window === 'undefined') {
      throw new Error('Not in browser environment');
    }

    // Check if already loaded
    if ((window as any).jspdf) {
      return (window as any).jspdf;
    }

    // Load from CDN
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js';
      script.onload = () => {
        resolve((window as any).jspdf);
      };
      script.onerror = () => {
        reject(new Error('Failed to load jsPDF library'));
      };
      document.head.appendChild(script);
    });
  }

  // Export to PDF (web only) - Auto download
  async exportToPDF(request: RestockRequest, storeName: string, storeAddress: string, storePhone: string): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('PDF export only available on web platform');
    }

    // Load jsPDF library
    const jspdfModule = await this.loadJsPDF();
    const { jsPDF } = jspdfModule;

    const today = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    // Create PDF
    const doc = new jsPDF();
    
    let y = 25;
    const lineHeight = 6;
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - (margin * 2);

    // Header with box
    doc.setFillColor(220, 20, 60);
    doc.rect(0, 0, pageWidth, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('SURAT PESANAN BARANG', pageWidth / 2, 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`No: ${request.id}`, pageWidth / 2, 23, { align: 'center' });
    doc.text(`Tanggal: ${today}`, pageWidth / 2, 29, { align: 'center' });

    // Reset text color
    doc.setTextColor(0, 0, 0);
    y = 45;

    // From section with background
    doc.setFillColor(245, 245, 245);
    doc.rect(margin, y, maxWidth, 28, 'F');
    
    y += 6;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('DARI:', margin + 5, y);
    y += lineHeight;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(storeName, margin + 5, y);
    y += lineHeight;
    
    doc.setFont('helvetica', 'normal');
    const storeAddressLines = doc.splitTextToSize(storeAddress, maxWidth - 10);
    doc.text(storeAddressLines, margin + 5, y);
    y += (storeAddressLines.length * lineHeight);
    doc.text(`Telp: ${storePhone}`, margin + 5, y);
    y += 10;

    // To section with background
    doc.setFillColor(245, 245, 245);
    const toHeight = request.supplierAddress ? 28 : 22;
    doc.rect(margin, y, maxWidth, toHeight, 'F');
    
    y += 6;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('KEPADA:', margin + 5, y);
    y += lineHeight;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(request.supplierName, margin + 5, y);
    y += lineHeight;
    
    doc.setFont('helvetica', 'normal');
    if (request.supplierAddress) {
      const supplierAddressLines = doc.splitTextToSize(request.supplierAddress, maxWidth - 10);
      doc.text(supplierAddressLines, margin + 5, y);
      y += (supplierAddressLines.length * lineHeight);
    }
    doc.text(`Telp: ${request.supplierPhone}`, margin + 5, y);
    y += 12;

    // Items section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('DAFTAR PESANAN', margin, y);
    y += 8;

    // Table header
    doc.setFillColor(220, 20, 60);
    doc.rect(margin, y - 5, maxWidth, 8, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('No', margin + 3, y);
    doc.text('Nama Produk', margin + 15, y);
    doc.text('Jumlah', pageWidth - margin - 30, y);
    
    doc.setTextColor(0, 0, 0);
    y += 8;

    // Table rows
    doc.setFont('helvetica', 'normal');
    request.items.forEach((item, index) => {
      // Alternate row colors
      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, y - 5, maxWidth, 12, 'F');
      }

      doc.setFont('helvetica', 'normal');
      doc.text(`${index + 1}`, margin + 3, y);
      
      doc.setFont('helvetica', 'bold');
      const productNameLines = doc.splitTextToSize(item.productName, 100);
      doc.text(productNameLines, margin + 15, y);
      
      doc.setFont('helvetica', 'normal');
      doc.text(`${item.requestedQuantity} pcs`, pageWidth - margin - 30, y);
      
      y += (productNameLines.length * lineHeight);

      if (item.notes) {
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        const notesLines = doc.splitTextToSize(`Catatan: ${item.notes}`, 100);
        doc.text(notesLines, margin + 15, y);
        y += (notesLines.length * 5);
        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
      }
      
      y += 6;
    });

    y += 5;

    // Notes section
    if (request.notes) {
      doc.setFillColor(255, 243, 205);
      const notesLines = doc.splitTextToSize(request.notes, maxWidth - 10);
      const notesHeight = (notesLines.length * lineHeight) + 12;
      doc.rect(margin, y, maxWidth, notesHeight, 'F');
      
      y += 6;
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('CATATAN:', margin + 5, y);
      y += lineHeight;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(notesLines, margin + 5, y);
      y += (notesLines.length * lineHeight) + 8;
    }

    // Footer
    y += 5;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Mohon konfirmasi ketersediaan barang dan waktu pengiriman.', margin, y);
    y += lineHeight + 2;
    doc.text('Terima kasih atas kerjasamanya.', margin, y);
    
    // Bottom line
    y = doc.internal.pageSize.getHeight() - 15;
    doc.setDrawColor(220, 20, 60);
    doc.setLineWidth(0.5);
    doc.line(margin, y, pageWidth - margin, y);
    
    y += 5;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text('Surat ini dibuat otomatis oleh BetaKasir', pageWidth / 2, y, { align: 'center' });

    // Save PDF
    doc.save(`Surat-Pesanan-${request.id}.pdf`);
  }

  // Load html2canvas library dynamically
  private async loadHtml2Canvas(): Promise<any> {
    if (typeof window === 'undefined') {
      throw new Error('Not in browser environment');
    }

    // Check if already loaded
    if ((window as any).html2canvas) {
      return (window as any).html2canvas;
    }

    // Load from CDN
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
      script.onload = () => {
        resolve((window as any).html2canvas);
      };
      script.onerror = () => {
        reject(new Error('Failed to load html2canvas library'));
      };
      document.head.appendChild(script);
    });
  }

  // Export to PNG (web only) - Auto download
  async exportToPNG(request: RestockRequest, storeName: string, storeAddress: string, storePhone: string): Promise<void> {
    if (typeof window === 'undefined') {
      throw new Error('PNG export only available on web platform');
    }

    // Load html2canvas library
    const html2canvas = await this.loadHtml2Canvas();

    const html = this.generateRestockHTML(request, storeName, storeAddress, storePhone);
    
    // Create temporary container
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.style.width = '800px';
    container.style.background = 'white';
    container.style.padding = '20px';
    container.innerHTML = html;
    document.body.appendChild(container);

    try {
      // Convert to canvas
      const canvas = await html2canvas(container, {
        backgroundColor: '#ffffff',
        scale: 2, // Higher quality
        logging: false,
        useCORS: true,
      });

      // Convert canvas to blob
      canvas.toBlob((blob: Blob | null) => {
        if (!blob) {
          throw new Error('Failed to create image');
        }

        // Create download link
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Surat-Pesanan-${request.id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        // Clean up
        document.body.removeChild(container);
      }, 'image/png');
    } catch (error) {
      document.body.removeChild(container);
      throw error;
    }
  }

  // Calculate suggested restock quantity based on sales history
  calculateSuggestedQuantity(product: Product, averageDailySales: number, daysToStock: number = 30): number {
    // Suggested quantity = average daily sales * days to stock - current stock
    const suggested = Math.ceil(averageDailySales * daysToStock) - product.stock;
    return Math.max(suggested, 0);
  }

  // Check if product needs restock
  needsRestock(product: Product, threshold: number = 10): boolean {
    return product.stock <= threshold;
  }
}

export const restockService = new RestockService();
