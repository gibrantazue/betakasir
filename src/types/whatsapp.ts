// WhatsApp Integration Types

export interface WhatsAppConfig {
  enabled: boolean;
  phoneNumber: string; // Format: 6281234567890
  dailyReportTime: string; // Format: "20:00"
  enableAlerts: boolean;
  enableCommands: boolean;
}

export interface WhatsAppMessage {
  to: string;
  message: string;
  type: 'text' | 'image' | 'document';
  mediaUrl?: string;
}

export interface DailyReport {
  date: string;
  revenue: number;
  transactions: number;
  topProducts: Array<{ name: string; sold: number }>;
  lowStockProducts: Array<{ name: string; stock: number }>;
  summary: string;
}

export interface WhatsAppCommand {
  command: string;
  description: string;
  handler: (params?: string) => Promise<string>;
}

export interface WhatsAppAlert {
  id: string;
  type: 'low_stock' | 'high_sales' | 'low_sales' | 'error' | 'info';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  sent: boolean;
}
