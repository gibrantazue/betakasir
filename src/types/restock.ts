// Restock Types
export interface RestockItem {
  productId: string;
  productName: string;
  currentStock: number;
  requestedQuantity: number;
  estimatedCost: number;
  notes?: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone: string;
  address?: string;
  email?: string;
  products?: string[]; // Product IDs
  createdAt: string;
}

export interface RestockRequest {
  id: string;
  supplierName: string;
  supplierPhone: string;
  supplierAddress?: string;
  items: RestockItem[];
  totalAmount: number;
  notes?: string;
  status: 'pending' | 'sent' | 'confirmed' | 'received' | 'cancelled';
  createdAt: string;
  sentAt?: string;
  confirmedAt?: string;
  receivedAt?: string;
}
