import { cn } from '../../utils/cn';
import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  icon?: ReactNode;
  padding?: boolean;
  /** Renders a centered empty-state when children is falsy */
  emptyState?: ReactNode;
}

export default function Card({ children, className, title, subtitle, action, icon, padding = true, emptyState }: Props) {
  return (
    <div className={cn('bg-white rounded-2xl border border-gray-100 shadow-sm', className)}>
      {(title || action) && (
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
          <div className="flex items-center gap-3 min-w-0">
            {icon && (
              <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center text-gray-600 flex-shrink-0">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              {title && <h3 className="text-sm font-semibold text-gray-900 leading-tight truncate">{title}</h3>}
              {subtitle && <p className="text-xs text-gray-400 mt-0.5 truncate">{subtitle}</p>}
            </div>
          </div>
          {action && <div className="flex-shrink-0 ml-4">{action}</div>}
        </div>
      )}
      <div className={cn(padding ? 'p-6' : '')}>
        {emptyState && !children ? emptyState : children}
      </div>
    </div>
  );
}
