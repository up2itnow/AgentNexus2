/**
 * CategoryNav - Category Navigation Pills
 * 
 * Horizontal scrollable category selector
 */

'use client';

import { BarChart3, FileText, Cog, TrendingUp, BookOpen, MoreHorizontal } from 'lucide-react';
import type { AgentCategory } from '@/types/agent';
import { CATEGORY_LABELS } from '@/types/agent';

const CATEGORY_ICONS: Record<AgentCategory, React.ComponentType<{ className?: string }>> = {
  DATA_ANALYSIS: BarChart3,
  CONTENT_CREATION: FileText,
  AUTOMATION: Cog,
  TRADING: TrendingUp,
  RESEARCH: BookOpen,
  OTHER: MoreHorizontal,
};

interface CategoryNavProps {
  selectedCategory?: AgentCategory;
  onCategorySelect: (category?: AgentCategory) => void;
}

export function CategoryNav({ selectedCategory, onCategorySelect }: CategoryNavProps) {
  const categories: Array<{ value?: AgentCategory; label: string }> = [
    { value: undefined, label: 'All' },
    ...Object.entries(CATEGORY_LABELS).map(([value, label]) => ({
      value: value as AgentCategory,
      label,
    })),
  ];

  return (
    <div className="hide-scrollbar overflow-x-auto">
      <div className="flex gap-2 pb-2">
        {categories.map(({ value, label }) => {
          const isActive = selectedCategory === value;
          const Icon = value ? CATEGORY_ICONS[value] : null;

          return (
            <button
              key={value || 'all'}
              onClick={() => onCategorySelect(value)}
              className={`flex items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {Icon && <Icon className="h-4 w-4" />}
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

