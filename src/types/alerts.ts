// Proactive Alert Types
export type AlertType = 'warning' | 'info' | 'success' | 'opportunity' | 'critical';
export type AlertCategory = 'stock' | 'sales' | 'system' | 'opportunity' | 'employee';
export type AlertPriority = 'low' | 'medium' | 'high' | 'critical';

export interface ProactiveAlert {
  id: string;
  type: AlertType;
  category: AlertCategory;
  title: string;
  message: string;
  priority: AlertPriority;
  timestamp: Date;
  isRead: boolean;
  isDismissed: boolean;
  data?: any; // Additional context data
  action?: {
    label: string;
    type: 'navigate' | 'execute' | 'external';
    target: string;
    params?: any;
  };
  expiresAt?: Date; // Auto-dismiss after this time
  conditions?: {
    minValue?: number;
    maxValue?: number;
    comparison?: 'gt' | 'lt' | 'eq' | 'gte' | 'lte';
    field?: string;
  };
}

export interface AlertRule {
  id: string;
  name: string;
  description: string;
  category: AlertCategory;
  isEnabled: boolean;
  checkInterval: number; // in minutes
  conditions: {
    field: string;
    operator: 'gt' | 'lt' | 'eq' | 'gte' | 'lte' | 'contains';
    value: any;
    timeframe?: 'today' | 'week' | 'month';
  }[];
  alertTemplate: {
    type: AlertType;
    title: string;
    message: string;
    priority: AlertPriority;
  };
  lastChecked?: Date;
  lastTriggered?: Date;
}

export interface AlertStats {
  total: number;
  unread: number;
  byType: Record<AlertType, number>;
  byCategory: Record<AlertCategory, number>;
  byPriority: Record<AlertPriority, number>;
}
