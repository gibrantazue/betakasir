import { ActionIntent } from '../types/actions';
import { aiActionsService } from './aiActionsService';

class IntentDetectionService {
  // Detect action intent from user message
  detectIntent(message: string): ActionIntent {
    const lowerMessage = message.toLowerCase();
    const actions = aiActionsService.getActions();

    // Check each action's examples
    for (const action of actions) {
      if (action.examples) {
        for (const example of action.examples) {
          if (this.matchesExample(lowerMessage, example.toLowerCase())) {
            const parameters = this.extractParameters(message, action.id);
            return {
              action: action.id,
              confidence: 0.8,
              parameters,
              rawMessage: message,
            };
          }
        }
      }
    }

    // Pattern matching for common actions
    const intent = this.patternMatch(lowerMessage);
    if (intent.action) {
      return intent;
    }

    // No action detected
    return {
      action: null,
      confidence: 0,
      parameters: {},
      rawMessage: message,
    };
  }

  // Check if message matches example
  private matchesExample(message: string, example: string): boolean {
    // Simple keyword matching
    const exampleWords = example.split(' ').filter(w => w.length > 3);
    const matchCount = exampleWords.filter(word => message.includes(word)).length;
    return matchCount >= exampleWords.length * 0.6; // 60% match
  }

  // Pattern matching for common actions
  private patternMatch(message: string): ActionIntent {
    // Generate report patterns
    if (
      (message.includes('buat') || message.includes('generate')) &&
      (message.includes('laporan') || message.includes('report'))
    ) {
      const period = this.extractPeriod(message);
      return {
        action: 'generate-sales-report',
        confidence: 0.9,
        parameters: { period },
        rawMessage: message,
      };
    }

    // Update price patterns
    if (
      (message.includes('update') || message.includes('ubah') || message.includes('ganti')) &&
      (message.includes('harga') || message.includes('price'))
    ) {
      const { productId, newPrice } = this.extractPriceUpdate(message);
      if (productId && newPrice) {
        return {
          action: 'update-product-price',
          confidence: 0.85,
          parameters: { productId, newPrice },
          rawMessage: message,
        };
      }
    }

    // Update stock patterns
    if (
      (message.includes('update') || message.includes('ubah') || message.includes('tambah')) &&
      (message.includes('stok') || message.includes('stock'))
    ) {
      const { productId, quantity } = this.extractStockUpdate(message);
      if (productId && quantity) {
        return {
          action: 'update-product-stock',
          confidence: 0.85,
          parameters: { productId, quantity },
          rawMessage: message,
        };
      }
    }

    // Backup patterns
    if (
      (message.includes('backup') || message.includes('export')) &&
      (message.includes('data') || message.includes('semua'))
    ) {
      return {
        action: 'backup-data',
        confidence: 0.9,
        parameters: {},
        rawMessage: message,
      };
    }

    // Clear cache patterns
    if (
      (message.includes('clear') || message.includes('bersihkan') || message.includes('hapus')) &&
      (message.includes('cache') || message.includes('temporary'))
    ) {
      return {
        action: 'clear-cache',
        confidence: 0.9,
        parameters: {},
        rawMessage: message,
      };
    }

    return {
      action: null,
      confidence: 0,
      parameters: {},
      rawMessage: message,
    };
  }

  // Extract period from message
  private extractPeriod(message: string): string {
    if (message.includes('hari ini') || message.includes('today')) return 'today';
    if (message.includes('minggu') || message.includes('week')) return 'week';
    if (message.includes('bulan') || message.includes('month')) return 'month';
    return 'today';
  }

  // Extract product and price from message
  private extractPriceUpdate(message: string): { productId: string | null; newPrice: number | null } {
    // Extract product name (between "harga" and "jadi/ke")
    const productMatch = message.match(/harga\s+([a-zA-Z0-9\s]+?)\s+(jadi|ke|menjadi)/i);
    const productId = productMatch ? productMatch[1].trim() : null;

    // Extract price (numbers)
    const priceMatch = message.match(/(\d+)/);
    const newPrice = priceMatch ? parseInt(priceMatch[1]) : null;

    return { productId, newPrice };
  }

  // Extract product and quantity from message
  private extractStockUpdate(message: string): { productId: string | null; quantity: number | null } {
    // Extract product name
    const productMatch = message.match(/stok\s+([a-zA-Z0-9\s]+?)\s+(jadi|ke|menjadi|sebanyak)/i);
    const productId = productMatch ? productMatch[1].trim() : null;

    // Extract quantity
    const quantityMatch = message.match(/(\d+)/);
    const quantity = quantityMatch ? parseInt(quantityMatch[1]) : null;

    return { productId, quantity };
  }

  // Extract parameters for specific action
  private extractParameters(message: string, actionId: string): Record<string, any> {
    switch (actionId) {
      case 'generate-sales-report':
        return { period: this.extractPeriod(message) };
      
      case 'update-product-price':
        return this.extractPriceUpdate(message);
      
      case 'update-product-stock':
        return this.extractStockUpdate(message);
      
      default:
        return {};
    }
  }

  // Check if message is an action request
  isActionRequest(message: string): boolean {
    const intent = this.detectIntent(message);
    return intent.action !== null && intent.confidence > 0.7;
  }
}

// Export singleton instance
export const intentDetectionService = new IntentDetectionService();
