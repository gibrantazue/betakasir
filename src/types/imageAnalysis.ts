// Image Analysis Types
export type AnalysisType = 'receipt' | 'product' | 'barcode' | 'general';

export interface ImageAnalysisResult {
  type: AnalysisType;
  confidence: number;
  data: any;
  insights: string[];
  timestamp: Date;
}

export interface ReceiptData {
  storeName?: string;
  date?: string;
  items: ReceiptItem[];
  total?: number;
  tax?: number;
  paymentMethod?: string;
}

export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface ProductInfo {
  name: string;
  category?: string;
  suggestedPrice?: number;
  description?: string;
  barcode?: string;
}

export interface BarcodeData {
  code: string;
  format: string;
  product?: any;
}

export interface ImageUploadState {
  isUploading: boolean;
  isAnalyzing: boolean;
  progress: number;
  error: string | null;
  result: ImageAnalysisResult | null;
}
