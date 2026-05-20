import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import { useToastStore, type Toast } from '../../store/toastStore';

export default function ToastProvider() {
  const { toasts, removeToast } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={removeToast} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: (id: string) => void }) {
  const icons = {
    success: <CheckCircle className="text-emerald-500 flex-shrink-0" size={18} />,
    error: <AlertCircle className="text-rose-500 flex-shrink-0" size={18} />,
    warning: <Info className="text-amber-500 flex-shrink-0" size={18} />,
    info: <Info className="text-blue-500 flex-shrink-0" size={18} />,
  };

  const bgColors = {
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    error: 'bg-rose-50 border-rose-200 text-rose-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  };

  return (
    <div
      className={`flex items-center gap-3 p-4 rounded-xl border shadow-lg backdrop-blur-md transition-all duration-300 pointer-events-auto animate-fade-in-right ${bgColors[toast.type]}`}
      role="alert"
    >
      {icons[toast.type]}
      <p className="text-sm font-semibold flex-1 leading-snug">{toast.message}</p>
      <button
        onClick={() => onClose(toast.id)}
        className="text-gray-400 hover:text-gray-600 transition-colors p-0.5 rounded-lg hover:bg-black/5"
      >
        <X size={14} />
      </button>
    </div>
  );
}
