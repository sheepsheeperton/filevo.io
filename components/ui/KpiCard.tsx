import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface KpiCardProps {
  title: string;
  count: number;
  description: string;
  helperText: string;
  color?: 'red' | 'orange' | 'green' | 'blue' | 'teal' | 'amber' | 'violet' | 'gray';
  icon?: ReactNode;
  className?: string;
}

export function KpiCard({ 
  title, 
  count, 
  description, 
  helperText, 
  color = 'gray',
  icon,
  className 
}: KpiCardProps) {
  const colorClasses = {
    red: 'text-red-500',
    orange: 'text-orange-500',
    green: 'text-green-500',
    blue: 'text-blue-500',
    teal: 'text-teal-500',
    amber: 'text-amber-500',
    violet: 'text-violet-500',
    gray: 'text-gray-500'
  };

  const dotColorClasses = {
    red: 'bg-red-500',
    orange: 'bg-orange-500',
    green: 'bg-green-500',
    blue: 'bg-blue-500',
    teal: 'bg-teal-500',
    amber: 'bg-amber-500',
    violet: 'bg-violet-500',
    gray: 'bg-gray-500'
  };

  return (
    <div className={cn("rounded-2xl bg-surface border border-border p-6", className)}>
      <div className="flex items-center gap-2 mb-2">
        <div className={cn("w-2 h-2 rounded-full", dotColorClasses[color])}></div>
        <div className="text-sm text-fg-subtle">{title}</div>
      </div>
      <div className={cn("mt-2 text-3xl font-semibold tracking-tight", colorClasses[color])}>
        {count}
      </div>
      <div className="mt-2 text-xs text-fg-muted">
        {description}
      </div>
      <div className="mt-3 pt-3 border-t border-border text-xs text-fg-subtle leading-relaxed">
        {helperText}
      </div>
      {icon && (
        <div className="mt-3 flex justify-end">
          {icon}
        </div>
      )}
    </div>
  );
}
