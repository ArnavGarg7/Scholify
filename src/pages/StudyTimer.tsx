import { motion } from 'framer-motion';
import { useCoursesStore } from '../stores/coursesStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useState, useEffect, useRef, useCallback } from 'react';

const PRESETS = [
  { label: '25 min', minutes: 25 },
  { label: '45 min', minutes: 45 },
  { label: '60 min', minutes: 60 },
];

export default function StudyTimer() {
  const courses = useCoursesStore((s) => s.courses);
  const logStudyTime = useSettingsStore((s) => s.logStudyTime);
  const studyLogs = useSettingsStore((s) => s.studyLogs);

  const [selectedCourse, setSelectedCourse] = useState(courses[0]?.id || '');
  const [duration, setDuration] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isFocus, setIsFocus] = useState(false);
  const interval = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback(() => {
    setTimeLeft(duration * 60);
    setIsRunning(true);
  }, [duration]);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      interval.current = setInterval(() => {
        setTimeLeft((t) => t - 1);
      }, 1000);
    } else if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      if (selectedCourse) {
        logStudyTime(selectedCourse, duration);
      }
      // Notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Scholify: Study session complete!', {
          body: `You studied for ${duration} minutes. Great job!`,
        });
      }
    }
    return () => { if (interval.current) clearInterval(interval.current); };
  }, [isRunning, timeLeft, duration, selectedCourse, logStudyTime]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  // Weekly study hours (last 7 days)
  const today = new Date();
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
  const weekData = weekDays.map((day) => {
    const total = studyLogs
      .filter((l) => l.date === day)
      .reduce((s, l) => s + l.minutes, 0);
    return { day: new Date(day).toLocaleDateString('en-US', { weekday: 'short' }), minutes: total };
  });
  const maxMin = Math.max(...weekData.map((d) => d.minutes), 60);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className={`pt-4 pb-4 space-y-4 ${isFocus ? 'fixed inset-0 z-[200] bg-rf-base flex flex-col items-center justify-center p-8' : ''}`}
    >
      {isFocus && (
        <button onClick={() => setIsFocus(false)} className="absolute top-6 right-6 text-gray-500 hover:text-white">
          <span className="material-symbols-outlined">close</span>
        </button>
      )}

      {!isFocus && <h1 className="text-2xl font-headline font-extrabold text-white tracking-tight">Study Timer</h1>}

      {/* Course Selector */}
      {!isFocus && (
        <div className="rf-card p-4">
          <label className="text-xs font-medium text-gray-400 mb-2 block">Select Course</label>
          <select
            value={selectedCourse}
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="w-full h-10 px-3 text-sm text-white rounded-xl"
          >
            {courses.map((c) => <option key={c.id} value={c.id} className="bg-rf-card">{c.name}</option>)}
            {courses.length === 0 && <option value="" className="bg-rf-card">No courses</option>}
          </select>
        </div>
      )}

      {/* Timer Display */}
      <div className={`${isFocus ? '' : 'rf-card p-6'} text-center`}>
        <div className="relative w-48 h-48 mx-auto mb-4">
          <svg className="w-full h-full transform -rotate-90">
            <circle cx="96" cy="96" r="88" fill="transparent" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
            <circle
              cx="96" cy="96" r="88" fill="transparent" stroke={isRunning ? '#00D4FF' : 'rgba(0,212,255,0.3)'}
              strokeWidth="6" strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 88}
              strokeDashoffset={2 * Math.PI * 88 * (1 - timeLeft / (duration * 60))}
              style={{ transition: 'stroke-dashoffset 1s linear' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-5xl font-headline font-black text-white rf-number">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </span>
            <span className="text-[10px] text-gray-500 uppercase tracking-wider mt-1">
              {isRunning ? 'Focus Mode' : 'Ready'}
            </span>
          </div>
        </div>

        {/* Presets */}
        {!isRunning && (
          <div className="flex justify-center gap-2 mb-4">
            {PRESETS.map((p) => (
              <button
                key={p.minutes}
                onClick={() => { setDuration(p.minutes); setTimeLeft(p.minutes * 60); }}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                  duration === p.minutes
                    ? 'bg-rf-cyan/15 text-rf-cyan border-rf-cyan/40'
                    : 'bg-rf-surface text-gray-500 border-rf-cyan-dim'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}

        {/* Controls */}
        <div className="flex justify-center gap-3">
          {!isRunning ? (
            <button onClick={startTimer} className="rf-btn-primary px-8 py-3 rounded-full text-sm flex items-center gap-2">
              <span className="material-symbols-outlined">play_arrow</span> Start
            </button>
          ) : (
            <>
              <button onClick={() => setIsRunning(false)} className="bg-rf-surface text-gray-400 border border-rf-cyan-dim px-6 py-3 rounded-full text-sm font-bold flex items-center gap-2">
                <span className="material-symbols-outlined">pause</span> Pause
              </button>
              <button onClick={() => { setIsRunning(false); setTimeLeft(duration * 60); }} className="bg-rf-red/10 text-rf-red border border-rf-red/30 px-6 py-3 rounded-full text-sm font-bold flex items-center gap-2">
                <span className="material-symbols-outlined">stop</span> Reset
              </button>
            </>
          )}
        </div>

        {!isRunning && !isFocus && (
          <button onClick={() => { setIsFocus(true); startTimer(); }} className="mt-3 text-xs text-rf-cyan font-medium flex items-center gap-1 mx-auto">
            <span className="material-symbols-outlined text-sm">fullscreen</span> Focus Mode
          </button>
        )}
      </div>

      {/* Weekly Chart */}
      {!isFocus && (
        <div className="rf-card p-4">
          <h3 className="text-sm font-headline font-bold text-white mb-3">Weekly Study Hours</h3>
          <div className="flex items-end gap-2 h-28">
            {weekData.map((d, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full rounded-t-md relative overflow-hidden" style={{ height: `${Math.max(4, (d.minutes / maxMin) * 100)}%` }}>
                  <div className="absolute inset-0 bg-rf-cyan/30 rounded-t-md" />
                </div>
                <span className="text-[9px] text-gray-500">{d.day}</span>
                <span className="text-[8px] text-rf-cyan rf-number">{d.minutes}m</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
