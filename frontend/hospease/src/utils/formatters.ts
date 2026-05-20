import { format, parseISO, differenceInDays, isToday, isYesterday, formatDistanceToNow } from 'date-fns';

/** Safely parse a date string — handles ISO strings, arrays, null, undefined */
function safeParse(dateStr: unknown): Date | null {
  if (!dateStr) return null;
  // Jackson can return arrays like [2026,5,20] instead of ISO strings
  if (Array.isArray(dateStr)) {
    try {
      const [y, m, d, h = 0, min = 0, s = 0] = dateStr as number[];
      return new Date(y, m - 1, d, h, min, s);
    } catch { return null; }
  }
  if (typeof dateStr === 'number') return new Date(dateStr);
  if (typeof dateStr === 'string') {
    try { return parseISO(dateStr); }
    catch { return null; }
  }
  return null;
}

export const formatCurrency = (amount: unknown, currency = 'USD'): string => {
  const n = typeof amount === 'number' ? amount : parseFloat(String(amount ?? 0));
  if (isNaN(n)) return '$0.00';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, minimumFractionDigits: 2 }).format(n);
};

export const formatDate = (dateStr: unknown, fmt = 'MMM d, yyyy'): string => {
  const d = safeParse(dateStr);
  if (!d) return String(dateStr ?? '—');
  try { return format(d, fmt); }
  catch { return String(dateStr); }
};

export const formatDateTime = (dateStr: unknown): string => {
  const d = safeParse(dateStr);
  if (!d) return String(dateStr ?? '—');
  try { return format(d, 'MMM d, yyyy · h:mm a'); }
  catch { return String(dateStr); }
};

export const formatRelative = (dateStr: unknown): string => {
  const d = safeParse(dateStr);
  if (!d) return String(dateStr ?? '—');
  try {
    if (isToday(d))     return `Today, ${format(d, 'h:mm a')}`;
    if (isYesterday(d)) return `Yesterday, ${format(d, 'h:mm a')}`;
    return formatDistanceToNow(d, { addSuffix: true });
  } catch { return String(dateStr); }
};

export const formatNights = (checkIn: unknown, checkOut: unknown): number => {
  const ci = safeParse(checkIn);
  const co = safeParse(checkOut);
  if (!ci || !co) return 0;
  try { return Math.max(0, differenceInDays(co, ci)); }
  catch { return 0; }
};

export const formatPercent = (value: unknown, decimals = 1): string => {
  const n = typeof value === 'number' ? value : parseFloat(String(value ?? 0));
  if (isNaN(n)) return '0%';
  return `${n.toFixed(decimals)}%`;
};

export const formatNumber = (value: unknown): string => {
  const n = typeof value === 'number' ? value : parseFloat(String(value ?? 0));
  if (isNaN(n)) return '0';
  return new Intl.NumberFormat('en-US').format(n);
};
