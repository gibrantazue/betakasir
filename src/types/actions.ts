// AI Action Types
export type ActionType = 
  | 'report' 
  | 'product' 
  | 'communication' 
  | 'system' 
  | 'data';

export type ActionStatus = 'pending' | 'executing' | 'success' | 'failed' | 'cancelled';

export interface AIAction {
  id: string;
  name: string;
  description: string;
  type: ActionType;
  icon: string;
  parameters: ActionParameter[];
  execute: (params: Record<string, any>) => Promise<ActionResult>;
  requiresConfirmation: boolean;
  requiresPermission?: string;
  examples?: string[];
}

export interface ActionParameter {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'select' | 'file';
  required: boolean;
  description: string;
  options?: { label: string; value: any }[];
  default?: any;
  validation?: (value: any) => boolean | string;
}

export interface ActionResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
  duration?: number;
}

export interface ActionExecution {
  id: string;
  actionId: string;
  actionName: string;
  parameters: Record<string, any>;
  status: ActionStatus;
  result?: ActionResult;
  startTime: Date;
  endTime?: Date;
  userId: string;
}

export interface ActionIntent {
  action: string | null;
  confidence: number;
  parameters: Record<string, any>;
  rawMessage: string;
}
