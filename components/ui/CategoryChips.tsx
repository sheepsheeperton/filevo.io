"use client";

import { CategoryKey, getCategoryLabel, getCategoryColor } from '@/lib/categories';
import { cn } from '@/lib/utils';

interface CategoryChipsProps {
  value: CategoryKey;
  onChange: (value: CategoryKey) => void;
  showAll?: boolean;
  className?: string;
}

const categories: CategoryKey[] = ['all', 'onboarding', 'maintenance', 'audit'];

export function CategoryChips({ value, onChange, showAll = true, className }: CategoryChipsProps) {
  const displayCategories = showAll ? categories : categories.filter(c => c !== 'all');

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {displayCategories.map((category) => {
        const isActive = value === category;
        const color = getCategoryColor(category);
        
        return (
          <button
            key={category}
            onClick={() => onChange(category)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:hsl(var(--ring))] focus-visible:ring-offset-2",
              "hover:scale-105 active:scale-95",
              isActive ? [
                // Active styles based on color
                color === 'teal' && "bg-teal-100 text-teal-800 border border-teal-200 dark:bg-teal-900/30 dark:text-teal-300 dark:border-teal-800",
                color === 'amber' && "bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800",
                color === 'violet' && "bg-violet-100 text-violet-800 border border-violet-200 dark:bg-violet-900/30 dark:text-violet-300 dark:border-violet-800",
                color === 'gray' && "bg-gray-100 text-gray-800 border border-gray-200 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700"
              ] : [
                // Inactive styles
                "bg-surface text-fg-muted border border-border hover:bg-elev hover:text-fg"
              ]
            )}
            aria-pressed={isActive}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onChange(category);
              }
            }}
          >
            {getCategoryLabel(category)}
          </button>
        );
      })}
    </div>
  );
}
