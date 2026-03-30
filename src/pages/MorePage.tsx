import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const MORE_LINKS = [
  { path: '/exams', label: 'Exam Countdown', icon: 'timer', desc: 'Track upcoming exams' },
  { path: '/study', label: 'Study Timer', icon: 'self_improvement', desc: 'Pomodoro focus sessions' },
  { path: '/cgpa', label: 'CGPA Planner', icon: 'calculate', desc: 'Plan your semester GPA' },
  { path: '/settings', label: 'Settings', icon: 'settings', desc: 'Profile & preferences' },
];

export default function MorePage() {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="pt-6 space-y-4"
    >
      <h1 className="text-2xl font-headline font-extrabold text-white tracking-tight mb-6">
        More
      </h1>
      <div className="space-y-3">
        {MORE_LINKS.map((link) => (
          <button
            key={link.path}
            onClick={() => navigate(link.path)}
            className="w-full rf-card p-4 flex items-center gap-4 group hover:translate-y-[-1px] transition-all active:scale-[0.98]"
          >
            <div className="w-11 h-11 rounded-xl bg-rf-cyan/10 flex items-center justify-center text-rf-cyan group-hover:bg-rf-cyan/20 transition-colors">
              <span className="material-symbols-outlined">{link.icon}</span>
            </div>
            <div className="text-left flex-1">
              <p className="text-sm font-bold text-white">{link.label}</p>
              <p className="text-xs text-gray-500">{link.desc}</p>
            </div>
            <span className="material-symbols-outlined text-gray-600 group-hover:text-rf-cyan transition-colors">
              chevron_right
            </span>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
