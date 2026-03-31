import { useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';

const MAIN_ITEMS = [
  { path: '/', label: 'Home', icon: 'home' },
  { path: '/attendance', label: 'Attendance', icon: 'event_available' },
  { path: '/grades', label: 'Grades', icon: 'grade' },
  { path: '/assignments', label: 'Assignments', icon: 'assignment' },
];

const MORE_ITEMS = [
  { path: '/calendar', label: 'Academic Calendar', icon: 'calendar_month' },
  { path: '/exams', label: 'Exam Countdown', icon: 'timer' },
  { path: '/study', label: 'Study Timer', icon: 'self_improvement' },
  { path: '/cgpa', label: 'CGPA Planner', icon: 'calculate' },
  { path: '/settings', label: 'Settings', icon: 'settings' },
];

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <aside
      className={`hidden md:flex flex-col fixed left-0 top-0 h-full z-40 bg-rf-surface border-r border-rf-cyan-dim transition-all duration-300 ${
        collapsed ? 'w-16' : 'w-60'
      }`}
    >
      {/* Logo */}
      <div 
        onClick={() => navigate('/')}
        className="h-14 flex items-center px-4 border-b border-rf-cyan-dim gap-3 cursor-pointer group hover:bg-rf-card/50 transition-colors"
      >
        <img src="/scholify-logo.png" alt="Scholify" className="w-8 h-8 rounded-lg object-contain flex-shrink-0 group-hover:scale-105 transition-transform" />
        {!collapsed && (
          <span className="font-headline font-extrabold text-rf-cyan text-lg tracking-tight group-hover:text-white transition-colors">
            Scholify
          </span>
        )}
      </div>

      {/* Main Nav */}
      <nav className="flex-1 py-4 px-2 space-y-1">
        {MAIN_ITEMS.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
              isActive(item.path)
                ? 'bg-rf-cyan/10 text-rf-cyan border border-rf-cyan-dim'
                : 'text-gray-400 hover:bg-rf-card hover:text-gray-200'
            }`}
          >
            <span className={`material-symbols-outlined text-[20px] ${isActive(item.path) ? 'filled' : ''}`}>
              {item.icon}
            </span>
            {!collapsed && (
              <span className="text-sm font-medium">{item.label}</span>
            )}
          </button>
        ))}

        <div className="my-4 border-t border-rf-cyan-dim/30" />

        {!collapsed && (
          <p className="px-3 text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-2">
            More
          </p>
        )}
        {MORE_ITEMS.map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
              isActive(item.path)
                ? 'bg-rf-cyan/10 text-rf-cyan border border-rf-cyan-dim'
                : 'text-gray-400 hover:bg-rf-card hover:text-gray-200'
            }`}
          >
            <span className={`material-symbols-outlined text-[20px] ${isActive(item.path) ? 'filled' : ''}`}>
              {item.icon}
            </span>
            {!collapsed && (
              <span className="text-sm font-medium">{item.label}</span>
            )}
          </button>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="mx-2 mb-4 flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-gray-500 hover:bg-rf-card transition-colors"
      >
        <span className="material-symbols-outlined text-[20px]">
          {collapsed ? 'chevron_right' : 'chevron_left'}
        </span>
        {!collapsed && <span className="text-xs font-medium">Collapse</span>}
      </button>
    </aside>
  );
}
