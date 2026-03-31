import { useLocation, useNavigate } from 'react-router-dom';

const NAV_ITEMS = [
  { path: '/', label: 'Home', icon: 'home' },
  { path: '/attendance', label: 'Attendance', icon: 'event_available' },
  { path: '/grades', label: 'Grades', icon: 'grade' },
  { path: '/assignments', label: 'Assignments', icon: 'assignment' },
  { path: '/more', label: 'More', icon: 'menu' },
];

export default function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const isMoreActive = ['/exams', '/study', '/cgpa', '/settings', '/more', '/calendar'].some((p) =>
    location.pathname.startsWith(p)
  );

  return (
    <nav className="fixed bottom-0 w-full md:hidden z-50 glass rounded-t-2xl shadow-[0_-4px_24px_rgba(0,0,0,0.3)] flex justify-around items-center h-20 px-4 pb-safe border-t border-rf-cyan-dim">
      {NAV_ITEMS.map((item) => {
        const active = item.path === '/more' ? isMoreActive : isActive(item.path);
        return (
          <button
            key={item.path}
            onClick={() => {
              if (item.path === '/more') {
                navigate('/more');
              } else {
                navigate(item.path);
              }
            }}
            className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-2xl transition-all duration-200 active:scale-90 ${
              active
                ? 'bg-rf-cyan/10 text-rf-cyan'
                : 'text-gray-500 hover:text-rf-cyan/70'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[22px] ${active ? 'filled' : ''}`}
            >
              {item.icon}
            </span>
            <span className="font-headline font-medium text-[10px] mt-1">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
