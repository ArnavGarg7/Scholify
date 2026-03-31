import { motion } from 'framer-motion';

interface EmptyStateProps {
  icon: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: 'default' | 'celebration' | 'search';
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  variant = 'default',
}: EmptyStateProps) {
  const bgGradient = {
    default: 'from-rf-cyan/5 to-transparent',
    celebration: 'from-rf-amber/5 to-transparent',
    search: 'from-primary/5 to-transparent',
  }[variant];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={`rf-card p-8 text-center border border-dashed border-rf-cyan-dim/30 bg-gradient-to-b ${bgGradient} relative overflow-hidden`}
    >
      {/* Decorative circles */}
      <div className="absolute -top-6 -right-6 w-24 h-24 bg-rf-cyan/5 rounded-full blur-2xl" />
      <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-primary/5 rounded-full blur-xl" />

      <div className="relative z-10">
        {/* Animated Icon */}
        <motion.div
          initial={{ y: -5 }}
          animate={{ y: 5 }}
          transition={{ repeat: Infinity, repeatType: 'reverse', duration: 2, ease: 'easeInOut' }}
          className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-rf-surface border border-rf-cyan-dim/20 mb-4"
        >
          <span className="material-symbols-outlined text-3xl text-gray-500">{icon}</span>
        </motion.div>

        <h3 className="text-base font-headline font-bold text-white mb-1">{title}</h3>
        <p className="text-sm text-gray-500 mb-5 max-w-xs mx-auto">{description}</p>

        {actionLabel && onAction && (
          <button
            onClick={onAction}
            className="rf-btn-primary px-6 py-2.5 text-sm rounded-full inline-flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            {actionLabel}
          </button>
        )}
      </div>
    </motion.div>
  );
}
