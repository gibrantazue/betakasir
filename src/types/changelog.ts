export interface ChangelogEntry {
  id: string;
  version: string;
  date: string;
  title: string;
  description: string;
  changes: ChangelogItem[];
  type: 'major' | 'minor' | 'patch';
  createdAt: any;
  updatedAt: any;
}

export interface ChangelogItem {
  category: 'feature' | 'improvement' | 'bugfix' | 'breaking' | 'security' | 'performance';
  text: string;
}

export const CHANGELOG_CATEGORIES = {
  feature: {
    label: 'Fitur Baru',
    icon: 'sparkles',
    color: '#10B981'
  },
  improvement: {
    label: 'Peningkatan',
    icon: 'trending-up',
    color: '#3B82F6'
  },
  bugfix: {
    label: 'Perbaikan Bug',
    icon: 'bug',
    color: '#F59E0B'
  },
  breaking: {
    label: 'Breaking Change',
    icon: 'warning',
    color: '#EF4444'
  },
  security: {
    label: 'Keamanan',
    icon: 'shield-checkmark',
    color: '#DC143C'
  },
  performance: {
    label: 'Performa',
    icon: 'speedometer',
    color: '#8B5CF6'
  }
};
