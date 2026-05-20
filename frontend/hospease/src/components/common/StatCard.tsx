import { cn } from '../../utils/cn';
import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface Props {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  trend?: { value: number; label: string };
  color?: 'navy' | 'gold' | 'emerald' | 'rose' | 'blue' | 'purple' | 'amber';
  className?: string;
}

const iconStyles: Record<NonNullable<Props['color']>, string> = {
  navy:    'stat-icon-navy',
  gold:    'stat-icon-gold',
  emerald: 'stat-icon-emerald',
  rose:    'stat-icon-rose',
  blue:    'stat-icon-blue',
  purple:  'stat-icon-purple',
  amber:   'stat-icon-amber',
};

const bgAccents: Record<NonNullable<Props['color']>, string> = {
  navy:    'from-navy-50/60 to-transparent',
  gold:    'from-gold-50/60 to-transparent',
  emerald: 'from-emerald-50/60 to-transparent',
  rose:    'from-rose-50/60 to-transparent',
  blue:    'from-blue-50/60 to-transparent',
  purple:  'from-purple-50/60 to-transparent',
  amber:   'from-amber-50/60 to-transparent',
};

export default function StatCard({ title, value, subtitle, icon, trend, color = 'navy', className }: Props) {
  return (
    <div className={cn(
      'relative overflow-hidden bg-white rounded-2xl border border-gray-100 shadow-sm p-5',
      'hover:shadow-md hover:-translate-y-0.5 transition-all duration-200',
      className
    )}>
      {/* Subtle bg gradient */}
      <div className={cn('absolute inset-0 bg-gradient-to-br opacity-40 pointer-events-none', bgAccents[color])} />

      <div className="relative flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-1.5 leading-none">{value}</p>
          {subtitle && <p className="text-xs text-gray-400 mt-1.5">{subtitle}</p>}
          {trend && (
            <div className={cn(
              'flex items-center gap-1 mt-2.5 text-xs font-semibold',
              trend.value >= 0 ? 'text-emerald-600' : 'text-rose-500'
            )}>
              {trend.value >= 0
                ? <TrendingUp size={12} className="flex-shrink-0" />
                : <TrendingDown size={12} className="flex-shrink-0" />
              }
              <span>{Math.abs(trend.value)}%</span>
              <span className="text-gray-400 font-normal">{trend.label}</span>
            </div>
          )}
        </div>

        <div className={cn(
          'w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md',
          iconStyles[color]
        )}>
          <span className="text-white">{icon}</span>
        </div>
      </div>
    </div>
  );
}
