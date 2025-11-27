const { BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * DIRECT PRINT: No preview window, directly show print dialog
 * This is the simplest and most reliable approach
 */
async function handlePrintReceipt(htmlContent) {
  try {
    console.log('🖨️ Print request received - Direct print mode');
    
    // Create hidden window for rendering
    const printWindow = new BrowserWindow({
      width: 400,
      height: 800,
      show: false, // Hidden window
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });
    
    // Load HTML content
    await printWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`);
    
    // Wait for content to load
    await new Promise(resolve => {
      printWindow.webContents.once('did-finish-load', resolve);
    });
    
    // Small delay to ensure rendering
    await new Promise(resolve => setTimeout(resolve, 500));
    
    console.log('✅ Content loaded, opening print dialog');
    
    // Directly trigger print dialog
    return new Promise((resolve) => {
      printWindow.webContents.print({
        silent: false, // Show print dialog
        printBackground: true,
        color: true,
        margins: { marginType: 'none' }
      }, (success, errorType) => {
        console.log('🖨️ Print result:', success, errorType);
        
        // Close window after print
        setTimeout(() => {
          if (!printWindow.isDestroyed()) {
            printWindow.close();
          }
        }, 500);
        
        if (!success && errorType !== 'cancelled') {
          console.error('❌ Print failed:', errorType);
          resolve({ success: false, error: errorType });
        } else {
          console.log('✅ Print completed');
          resolve({ success: true });
        }
      });
    });
    
  } catch (error) {
    console.error('❌ Print error:', error);
    return { success: false, error: error.message };
  }
}

module.exports = { handlePrintReceipt };
