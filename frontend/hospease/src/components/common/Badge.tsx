import { cn } from '../../utils/cn';

type Variant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'gray' | 'purple';

const variants: Record<Variant, string> = {
  default: 'bg-navy-50  text-navy-700  ring-1 ring-navy-200/70',
  success: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/70',
  warning: 'bg-amber-50  text-amber-700  ring-1 ring-amber-200/70',
  danger:  'bg-rose-50   text-rose-700   ring-1 ring-rose-200/70',
  info:    'bg-blue-50   text-blue-700   ring-1 ring-blue-200/70',
  gray:    'bg-gray-100  text-gray-500   ring-1 ring-gray-200/70',
  purple:  'bg-purple-50 text-purple-700 ring-1 ring-purple-200/70',
};

const dots: Record<Variant, string> = {
  default: 'bg-navy-500',
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  danger:  'bg-rose-500',
  info:    'bg-blue-500',
  gray:    'bg-gray-400',
  purple:  'bg-purple-500',
};

interface Props {
  children: React.ReactNode;
  variant?: Variant;
  className?: string;
  dot?: boolean;
}

export default function Badge({ children, variant = 'default', className, dot = false }: Props) {
  return (
    <span className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap',
      variants[variant],
      className
    )}>
      {dot && <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', dots[variant])} />}
      {children}
    </span>
  );
}

