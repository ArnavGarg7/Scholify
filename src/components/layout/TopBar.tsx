import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../../stores/settingsStore';

export default function TopBar() {
  const navigate = useNavigate();
  const studentName = useSettingsStore((s) => s.studentName);
  const initials = studentName
    ? studentName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : 'SC';

  return (
    <header className="fixed top-0 w-full z-50 glass shadow-[0_8px_32px_rgba(0,0,0,0.3)] flex items-center justify-between px-5 h-14 border-b border-rf-cyan-dim">
      <div 
        onClick={() => navigate('/onboarding')}
        className="flex items-center gap-3 cursor-pointer group"
      >
        <div className="w-8 h-8 rounded-full bg-rf-surface border border-rf-cyan-dim flex items-center justify-center text-rf-cyan text-xs font-bold font-mono group-hover:bg-rf-card transition-colors">
          {initials}
        </div>
        <span className="font-headline font-extrabold text-rf-cyan text-lg tracking-tight group-hover:text-white transition-colors">
          Scholify
        </span>
      </div>
      <button
        onClick={() => navigate('/settings')}
        className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-rf-surface transition-colors active:scale-95"
      >
        <span className="material-symbols-outlined text-gray-400 text-[20px]">
          notifications
        </span>
      </button>
    </header>
  );
}
