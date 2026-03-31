import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useHolidayStore } from '../stores/holidayStore';
import { useCoursesStore } from '../stores/coursesStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useAssignmentsStore } from '../stores/assignmentsStore';
import { useAttendanceStore } from '../stores/attendanceStore';
import { useToastStore } from '../stores/toastStore';
import { daysUntil } from '../utils/dateUtils';

export default function AcademicCalendar() {
  const holidays = useHolidayStore((s) => s.holidays);
  const addHoliday = useHolidayStore((s) => s.addHoliday);
  const removeHoliday = useHolidayStore((s) => s.removeHoliday);
  const toggleHoliday = useHolidayStore((s) => s.toggleHoliday);
  const courses = useCoursesStore((s) => s.courses);
  const exams = useSettingsStore((s) => s.exams);
  const assignments = useAssignmentsStore((s) => s.assignments);
  const attendanceRecords = useAttendanceStore((s) => s.records);
  const addToast = useToastStore((s) => s.addToast);

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showAddHoliday, setShowAddHoliday] = useState(false);
  const [newHolidayName, setNewHolidayName] = useState('');
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = (firstDay.getDay() + 6) % 7;
  const totalDays = lastDay.getDate();
  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const todayStr = new Date().toISOString().split('T')[0];

  const calendarDays = useMemo(() => {
    const days: {
      day: number; dateStr: string | null; isToday: boolean; isPadding: boolean;
      holiday: any; hasClass: boolean; hasExam: boolean; hasAssignment: boolean;
      courseColors: string[]; attendanceStatus: string | null;
    }[] = [];

    // Padding
    const prevLastDay = new Date(year, month, 0).getDate();
    for (let i = startPad - 1; i >= 0; i--) {
      days.push({ day: prevLastDay - i, dateStr: null, isToday: false, isPadding: true, holiday: null, hasClass: false, hasExam: false, hasAssignment: false, courseColors: [], attendanceStatus: null });
    }

    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayOfWeek = new Date(year, month, d).toLocaleDateString('en-US', { weekday: 'short' });
      const holiday = holidays.find((h) => h.date === dateStr && h.enabled);
      const classesOnDay = courses.filter((c) => c.scheduleDays.includes(dayOfWeek));
      const examOnDay = exams.some((e) => e.date === dateStr);
      const assignmentOnDay = assignments.some((a) => a.dueDate === dateStr && !a.completed);
      const courseColors = classesOnDay.map((c) => c.color || 'hsl(190,100%,50%)');
      const attRecord = attendanceRecords.find((r) => r.date === dateStr);

      days.push({
        day: d, dateStr, isToday: dateStr === todayStr, isPadding: false,
        holiday, hasClass: classesOnDay.length > 0, hasExam: examOnDay,
        hasAssignment: assignmentOnDay, courseColors,
        attendanceStatus: attRecord?.status || null,
      });
    }
    return days;
  }, [year, month, holidays, courses, exams, assignments, attendanceRecords, todayStr, startPad, totalDays]);

  const handleAddHoliday = () => {
    if (!newHolidayName.trim() || !newHolidayDate) return;
    addHoliday({ date: newHolidayDate, name: newHolidayName.trim(), isOfficial: false, enabled: true });
    addToast(`Added holiday: ${newHolidayName}`, 'success');
    setNewHolidayName('');
    setNewHolidayDate('');
    setShowAddHoliday(false);
  };

  const monthHolidays = holidays.filter((h) => {
    const [hy, hm] = h.date.split('-').map(Number);
    return hy === year && hm === month + 1;
  });

  const selectedDateInfo = selectedDate ? {
    holiday: holidays.find((h) => h.date === selectedDate),
    classes: courses.filter((c) => {
      const dayOfWeek = new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'short' });
      return c.scheduleDays.includes(dayOfWeek);
    }),
    exams: exams.filter((e) => e.date === selectedDate),
    assignments: assignments.filter((a) => a.dueDate === selectedDate),
  } : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }} className="pt-4 pb-4 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-headline font-extrabold text-white tracking-tight">Academic Calendar</h1>
        <button onClick={() => setShowAddHoliday(!showAddHoliday)}
          className="rf-btn-primary px-4 py-2 text-xs rounded-full flex items-center gap-1"
        >
          <span className="material-symbols-outlined text-sm">add</span> Holiday
        </button>
      </div>

      {/* Add Holiday Form */}
      {showAddHoliday && (
        <div className="rf-card p-4 space-y-3 animate-fade-in">
          <input type="text" placeholder="Holiday name (e.g., College Foundation Day)" value={newHolidayName}
            onChange={(e) => setNewHolidayName(e.target.value)} className="w-full h-10 px-4 text-sm text-white rounded-xl" />
          <input type="date" value={newHolidayDate} onChange={(e) => setNewHolidayDate(e.target.value)}
            className="w-full h-10 px-4 text-sm text-white rounded-xl" />
          <button onClick={handleAddHoliday} className="w-full rf-btn-primary h-10 rounded-xl text-xs">Add Holiday</button>
        </div>
      )}

      {/* Calendar */}
      <div className="rf-card p-4">
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => setCurrentMonth(new Date(year, month - 1, 1))} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-rf-surface transition-colors">
            <span className="material-symbols-outlined text-gray-400">chevron_left</span>
          </button>
          <h3 className="text-sm font-headline font-bold text-white">{monthName}</h3>
          <button onClick={() => setCurrentMonth(new Date(year, month + 1, 1))} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-rf-surface transition-colors">
            <span className="material-symbols-outlined text-gray-400">chevron_right</span>
          </button>
        </div>

        {/* Day Headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
            <div key={d} className="text-center text-[9px] font-bold text-gray-600 uppercase">{d}</div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-1">
          {calendarDays.map((day, idx) => (
            <button key={idx}
              onClick={() => day.dateStr && setSelectedDate(day.dateStr === selectedDate ? null : day.dateStr)}
              disabled={day.isPadding}
              className={`relative aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-all ${
                day.isPadding ? 'text-gray-700 cursor-default' :
                day.isToday ? 'bg-rf-cyan/20 text-rf-cyan font-bold border border-rf-cyan/40' :
                day.holiday ? 'bg-rf-amber/10 text-rf-amber' :
                day.dateStr === selectedDate ? 'bg-rf-surface border border-rf-cyan/40 text-white' :
                'text-gray-400 hover:bg-rf-surface/50'
              }`}
            >
              <span className="text-[11px]">{day.day}</span>
              {/* Indicators */}
              {!day.isPadding && (
                <div className="flex gap-0.5 mt-0.5">
                  {day.courseColors.slice(0, 3).map((c, i) => (
                    <div key={i} className="w-1 h-1 rounded-full" style={{ backgroundColor: c }} />
                  ))}
                  {day.hasExam && <div className="w-1 h-1 rounded-full bg-rf-red" />}
                  {day.hasAssignment && <div className="w-1 h-1 rounded-full bg-rf-amber" />}
                </div>
              )}
              {day.holiday && <span className="absolute top-0 right-0.5 text-[7px]">🎉</span>}
            </button>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-rf-cyan-dim/20">
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rf-cyan" /><span className="text-[9px] text-gray-500">Class</span></div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rf-red" /><span className="text-[9px] text-gray-500">Exam</span></div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rf-amber" /><span className="text-[9px] text-gray-500">Assignment</span></div>
          <div className="flex items-center gap-1"><span className="text-[9px]">🎉</span><span className="text-[9px] text-gray-500">Holiday</span></div>
        </div>
      </div>

      {/* Selected Date Details */}
      {selectedDate && selectedDateInfo && (
        <div className="rf-card p-4 space-y-3 animate-fade-in">
          <h3 className="text-sm font-headline font-bold text-white">
            {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </h3>
          {selectedDateInfo.holiday && (
            <div className="bg-rf-amber/10 border border-rf-amber/20 rounded-lg px-3 py-2 text-sm text-rf-amber font-medium">
              🎉 {selectedDateInfo.holiday.name}
            </div>
          )}
          {selectedDateInfo.classes.map((c) => (
            <div key={c.id} className="flex items-center gap-2 text-xs text-gray-300">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: c.color }} />
              <span className="font-medium">{c.name}</span>
              <span className="text-gray-500">• {c.time} • {c.room}</span>
            </div>
          ))}
          {selectedDateInfo.exams.map((e) => (
            <div key={e.id} className="flex items-center gap-2 text-xs text-rf-red">
              <span className="material-symbols-outlined text-sm">quiz</span>
              <span className="font-medium">{e.name}</span>
            </div>
          ))}
          {selectedDateInfo.assignments.map((a) => (
            <div key={a.id} className="flex items-center gap-2 text-xs text-rf-amber">
              <span className="material-symbols-outlined text-sm">assignment</span>
              <span className="font-medium">{a.title}</span>
              <span className="text-gray-500">• {a.courseName}</span>
            </div>
          ))}
          {selectedDateInfo.classes.length === 0 && !selectedDateInfo.holiday &&
           selectedDateInfo.exams.length === 0 && selectedDateInfo.assignments.length === 0 && (
            <p className="text-xs text-gray-500">Nothing scheduled for this date.</p>
          )}
        </div>
      )}

      {/* Holiday List */}
      <div className="rf-card p-4">
        <h3 className="text-sm font-headline font-bold text-white mb-3 flex items-center gap-2">
          <span className="material-symbols-outlined text-rf-amber text-lg">event_busy</span>
          Holidays in {currentMonth.toLocaleDateString('en-US', { month: 'long' })}
          <span className="text-[10px] text-gray-500 font-normal ml-auto">{monthHolidays.length} holidays</span>
        </h3>
        <div className="space-y-2">
          {monthHolidays.length === 0 ? (
            <p className="text-xs text-gray-500 text-center py-3">No holidays this month</p>
          ) : (
            monthHolidays.map((h) => (
              <div key={h.id} className={`flex items-center justify-between py-2 border-b border-rf-cyan-dim/10 last:border-0 ${!h.enabled ? 'opacity-40' : ''}`}>
                <div>
                  <p className="text-xs font-medium text-white">{h.name}</p>
                  <p className="text-[9px] text-gray-500">
                    {new Date(h.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                    {h.isOfficial && <span className="ml-1 text-rf-amber">• Official</span>}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => toggleHoliday(h.id)}
                    className={`text-[10px] font-bold px-2 py-1 rounded-full transition-all ${
                      h.enabled ? 'bg-rf-green/15 text-rf-green' : 'bg-rf-surface text-gray-500 border border-rf-cyan-dim'
                    }`}
                  >
                    {h.enabled ? 'Active' : 'Disabled'}
                  </button>
                  {!h.isOfficial && (
                    <button onClick={() => { removeHoliday(h.id); addToast('Holiday removed', 'info'); }}
                      className="text-gray-600 hover:text-rf-red transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">delete</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </motion.div>
  );
}
