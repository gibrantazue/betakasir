// Quick Actions Types
export type QuickActionCategory = 'sales' | 'products' | 'employees' | 'insights' | 'help';

export interface QuickAction {
  id: string;
  icon: string;
  label: string;
  prompt: string;
  category: QuickActionCategory;
  requiresData?: boolean;
  screen?: string; // Show only on specific screen
}

export interface QuickActionGroup {
  title: string;
  actions: QuickAction[];
}
