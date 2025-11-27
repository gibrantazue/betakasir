import { ImageAnalysisResult, ReceiptData, ProductInfo, BarcodeData, AnalysisType } from '../types/imageAnalysis';
import { GEMINI_API_KEY } from '../config/gemini';

const GEMINI_VISION_API = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

class ImageAnalysisService {
  // Convert image to base64
  private async imageToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        // Remove data:image/...;base64, prefix
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  // Analyze image with Gemini Vision
  private async analyzeWithGemini(base64Image: string, prompt: string): Promise<string> {
    try {
      const response = await fetch(`${GEMINI_VISION_API}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt },
              {
                inline_data: {
                  mime_type: 'image/jpeg',
                  data: base64Image
                }
              }
            ]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const data = await response.json();
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      return text;
    } catch (error) {
      console.error('Gemini Vision API error:', error);
      throw error;
    }
  }

  // Analyze Receipt
  async analyzeReceipt(imageFile: File): Promise<ImageAnalysisResult> {
    try {
      const base64Image = await this.imageToBase64(imageFile);
      
      const prompt = `Analyze this receipt image and extract the following information in JSON format:
{
  "storeName": "store name",
  "date": "date",
  "items": [
    {"name": "item name", "quantity": 1, "price": 1000, "total": 1000}
  ],
  "total": total amount,
  "tax": tax amount if any
}

Extract all items with their names, quantities, and prices. Return ONLY valid JSON, no additional text.`;

      const response = await this.analyzeWithGemini(base64Image, prompt);
      
      // Parse JSON response
      let receiptData: ReceiptData;
      try {
        // Try to extract JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          receiptData = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found in response');
        }
      } catch (parseError) {
        // Fallback: create basic structure
        receiptData = {
          items: [],
          total: 0
        };
      }

      return {
        type: 'receipt',
        confidence: 0.85,
        data: receiptData,
        insights: [
          `Found ${receiptData.items?.length || 0} items`,
          `Total: Rp ${(receiptData.total || 0).toLocaleString('id-ID')}`,
        ],
        timestamp: new Date(),
      };
    } catch (error) {
      throw new Error(`Failed to analyze receipt: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Analyze Product
  async analyzeProduct(imageFile: File): Promise<ImageAnalysisResult> {
    try {
      const base64Image = await this.imageToBase64(imageFile);
      
      const prompt = `Analyze this product image and provide information in JSON format:
{
  "name": "product name",
  "category": "product category (e.g., Makanan, Minuman, Elektronik)",
  "suggestedPrice": estimated price in IDR,
  "description": "brief description"
}

Identify the product and suggest appropriate category and pricing for Indonesian market. Return ONLY valid JSON.`;

      const response = await this.analyzeWithGemini(base64Image, prompt);
      
      let productInfo: ProductInfo;
      try {
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          productInfo = JSON.parse(jsonMatch[0]);
        } else {
          throw new Error('No JSON found');
        }
      } catch (parseError) {
        productInfo = {
          name: 'Unknown Product',
          category: 'Lainnya',
          description: response.substring(0, 200),
        };
      }

      return {
        type: 'product',
        confidence: 0.8,
        data: productInfo,
        insights: [
          `Product: ${productInfo.name}`,
          `Category: ${productInfo.category || 'Unknown'}`,
          productInfo.suggestedPrice ? `Suggested Price: Rp ${productInfo.suggestedPrice.toLocaleString('id-ID')}` : '',
        ].filter(Boolean),
        timestamp: new Date(),
      };
    } catch (error) {
      throw new Error(`Failed to analyze product: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // General Image Analysis
  async analyzeGeneral(imageFile: File): Promise<ImageAnalysisResult> {
    try {
      const base64Image = await this.imageToBase64(imageFile);
      
      const prompt = `Analyze this image and describe what you see. Focus on:
- What type of image is this? (receipt, product, document, etc.)
- What are the main objects or text visible?
- Any relevant business information?

Provide a clear, concise analysis in Indonesian.`;

      const response = await this.analyzeWithGemini(base64Image, prompt);

      return {
        type: 'general',
        confidence: 0.9,
        data: { description: response },
        insights: [response.substring(0, 200)],
        timestamp: new Date(),
      };
    } catch (error) {
      throw new Error(`Failed to analyze image: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Auto-detect analysis type and analyze
  async autoAnalyze(imageFile: File): Promise<ImageAnalysisResult> {
    try {
      const base64Image = await this.imageToBase64(imageFile);
      
      // First, detect what type of image this is
      const detectionPrompt = `Look at this image and determine what it is. Reply with ONLY ONE WORD:
- "receipt" if it's a shopping receipt or invoice
- "product" if it's a product photo
- "general" for anything else

Reply with just one word, nothing else.`;

      const typeResponse = await this.analyzeWithGemini(base64Image, detectionPrompt);
      const detectedType = typeResponse.toLowerCase().trim();

      // Analyze based on detected type
      if (detectedType.includes('receipt')) {
        return await this.analyzeReceipt(imageFile);
      } else if (detectedType.includes('product')) {
        return await this.analyzeProduct(imageFile);
      } else {
        return await this.analyzeGeneral(imageFile);
      }
    } catch (error) {
      // Fallback to general analysis
      return await this.analyzeGeneral(imageFile);
    }
  }
}

// Export singleton instance
export const imageAnalysisService = new ImageAnalysisService();
