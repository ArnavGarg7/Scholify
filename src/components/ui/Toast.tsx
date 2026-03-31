import { useToastStore, ToastType } from '../../stores/toastStore';
import { motion, AnimatePresence } from 'framer-motion';

const iconMap: Record<ToastType, string> = {
  success: 'check_circle',
  error: 'error',
  info: 'info',
  warning: 'warning',
};

const colorMap: Record<ToastType, string> = {
  success: 'bg-rf-green/15 border-rf-green/30 text-rf-green',
  error: 'bg-rf-red/15 border-rf-red/30 text-rf-red',
  info: 'bg-rf-cyan/15 border-rf-cyan/30 text-rf-cyan',
  warning: 'bg-rf-amber/15 border-rf-amber/30 text-rf-amber',
};

export default function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  return (
    <div className="fixed top-16 right-4 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, x: 80, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 80, scale: 0.95 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className={`pointer-events-auto px-4 py-3 rounded-xl border backdrop-blur-lg flex items-center gap-3 shadow-[0_8px_32px_rgba(0,0,0,0.4)] cursor-pointer ${colorMap[toast.type]}`}
            onClick={() => removeToast(toast.id)}
          >
            <span className="material-symbols-outlined text-lg filled">{iconMap[toast.type]}</span>
            <p className="text-sm font-medium text-white flex-1">{toast.message}</p>
            <span className="material-symbols-outlined text-gray-500 text-sm hover:text-white transition-colors">close</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
