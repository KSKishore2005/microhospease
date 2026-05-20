import { cn } from '../../utils/cn';
import type { ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'gold' | 'success';
type Size = 'xs' | 'sm' | 'md' | 'lg';

const variants: Record<Variant, string> = {
  primary:   'bg-navy-900 text-white hover:bg-navy-800 shadow-sm hover:shadow-md active:scale-[0.98]',
  secondary: 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50 hover:border-gray-300 shadow-sm active:scale-[0.98]',
  ghost:     'text-gray-600 hover:bg-gray-100 hover:text-gray-900 active:scale-[0.98]',
  danger:    'bg-rose-600 text-white hover:bg-rose-700 shadow-sm hover:shadow-md active:scale-[0.98]',
  gold:      'bg-gradient-to-r from-gold-500 to-gold-400 text-white shadow-sm hover:shadow-md hover:from-gold-600 hover:to-gold-500 active:scale-[0.98]',
  success:   'bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm hover:shadow-md active:scale-[0.98]',
};

const sizes: Record<Size, string> = {
  xs: 'px-2.5 py-1   text-xs  gap-1.5',
  sm: 'px-3   py-1.5 text-xs  gap-1.5',
  md: 'px-4   py-2   text-sm  gap-2',
  lg: 'px-5   py-2.5 text-sm  gap-2',
};

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  icon?: React.ReactNode;
}

export default function Button({
  variant = 'primary', size = 'md', loading, icon, children, className, disabled, ...rest
}: Props) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-500/40 focus-visible:ring-offset-1',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading
        ? <Loader2 size={14} className="animate-spin" />
        : icon && <span className="flex-shrink-0">{icon}</span>
      }
      {children}
    </button>
  );
}
