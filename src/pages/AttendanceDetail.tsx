import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCoursesStore } from '../stores/coursesStore';
import { useAttendanceStore } from '../stores/attendanceStore';
import { useAttendanceCalc } from '../hooks/useAttendanceCalc';
import { useNotesStore } from '../stores/notesStore';
import { useHolidayStore } from '../stores/holidayStore';
import { getToday } from '../utils/dateUtils';
import { useState, useMemo } from 'react';

export default function AttendanceDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const course = useCoursesStore((s) => s.courses.find((c) => c.id === courseId));
  const markAttendance = useAttendanceStore((s) => s.markAttendance);
  const deleteRecord = useAttendanceStore((s) => s.deleteRecord);
  const getRecord = useAttendanceStore((s) => s.getRecord);
  const allRecords = useAttendanceStore((s) => s.records);
  const records = useMemo(() => 
    allRecords.filter((r) => r.courseId === courseId),
    [allRecords, courseId]
  );
  const calc = useAttendanceCalc(courseId || '');
  const courseNote = useNotesStore((s) => s.getNoteByCourse(courseId || ''));
  const upsertNote = useNotesStore((s) => s.upsertNote);
  const isHoliday = useHolidayStore((s) => s.isHoliday);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showNotes, setShowNotes] = useState(false);
  const [noteText, setNoteText] = useState(courseNote?.content || '');

  if (!course || !calc) {
    return (
      <div className="pt-6 text-center">
        <p className="text-gray-400">Course not found</p>
        <button onClick={() => navigate('/attendance')} className="text-rf-cyan text-sm mt-2">
          Go back
        </button>
      </div>
    );
  }

  const statusLabel = { safe: 'Safe Standing', warning: 'Warning', danger: 'Critical' }[calc.status];
  const statusColor = { safe: 'text-rf-green', warning: 'text-rf-amber', danger: 'text-rf-red' }[calc.status];

  // Calendar generation
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startPad = (firstDay.getDay() + 6) % 7; // Mon-based
  const totalDays = lastDay.getDate();

  const calendarDays = useMemo(() => {
    const days: { day: number; status: string | null; isToday: boolean; dateStr: string | null }[] = [];
    // Padding days from previous month
    const prevLastDay = new Date(year, month, 0).getDate();
    for (let i = startPad - 1; i >= 0; i--) {
      days.push({ day: prevLastDay - i, status: null, isToday: false, dateStr: null });
    }
    // Current month days
    const todayStr = getToday();
    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const record = records.find((r) => r.date === dateStr);
      const isToday = dateStr === todayStr;
      days.push({
        day: d,
        status: record?.status || null,
        isToday,
        dateStr,
      });
    }
    return days;
  }, [year, month, records, startPad, totalDays]);

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const handleMarkToday = (status: 'present' | 'absent') => {
    markAttendance(course.id, getToday(), status);
  };

  // Only show Mark Today panel if today is an actual class day for this course
  const todayDayAbbr = new Date().toLocaleDateString('en-US', { weekday: 'short' }); // e.g. "Tue"
  const isTodayAClassDay = course.scheduleDays.includes(todayDayAbbr);

  const prevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));

  return (
    <div
      className="pt-4 pb-4 space-y-4 animate-fade-in"
    >
      {/* Back Button + Header */}
      <div className="flex items-center gap-2 mb-1">
        <button onClick={() => navigate('/attendance')} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-rf-surface transition-colors">
          <span className="material-symbols-outlined text-gray-400">arrow_back</span>
        </button>
      </div>

      <section>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">{course.name}</h1>
        <div className="flex items-center gap-2 text-gray-500 font-medium text-xs mt-1">
          <span className="material-symbols-outlined text-xs">calendar_today</span>
          <span>{course.scheduleDays.join(' • ')} • {course.time}</span>
        </div>
      </section>

      {/* Bento Stats Grid */}
      <div className="grid grid-cols-3 gap-3">
        {/* Main Stat */}
        <div className="col-span-2 bg-gradient-to-br from-primary to-primary-container rounded-xl p-5 text-white relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent" />
          <div className="space-y-0.5 relative z-10">
            <p className="text-xs font-label opacity-80 font-medium">Current Attendance</p>
            <h2 className="text-5xl font-headline font-extrabold tracking-tighter rf-number">{calc.percentage}%</h2>
            <p className="text-xs font-medium opacity-90">{calc.attended} / {calc.total} classes attended</p>
          </div>
          <div className="relative z-10 mt-3">
            <div className={`inline-block bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest`}>
              {statusLabel}
            </div>
          </div>
        </div>

        {/* Prediction Panel */}
        <div className="rf-card p-4 flex flex-col justify-between">
          <h3 className="font-headline font-bold text-gray-400 text-[10px] uppercase tracking-wider mb-2">Runway</h3>
          <div className="space-y-3">
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500">Remaining</span>
              <span className="font-headline font-extrabold text-base text-white rf-number">{calc.remaining}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] text-gray-500">Safe Skips</span>
              <span className="font-headline font-extrabold text-base text-rf-cyan rf-number">{calc.safeSkips}</span>
            </div>
          </div>
          <div className="mt-2 pt-2 border-t border-rf-cyan-dim/20">
            <p className="text-[9px] text-gray-500">Max potential</p>
            <p className="text-xs font-medium text-white">
              <span className="text-rf-cyan font-bold rf-number">{calc.maxPotential}%</span>
            </p>
          </div>
        </div>
      </div>

      {/* Calendar */}
      <div className="rf-card p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-headline font-bold text-base text-white">{monthName}</h3>
          <div className="flex gap-1">
            <button onClick={prevMonth} className="p-1 hover:bg-rf-surface rounded transition-colors">
              <span className="material-symbols-outlined text-gray-400">chevron_left</span>
            </button>
            <button onClick={nextMonth} className="p-1 hover:bg-rf-surface rounded transition-colors">
              <span className="material-symbols-outlined text-gray-400">chevron_right</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-y-2 text-center">
          {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
            <div key={d} className="text-[9px] font-bold text-gray-600 uppercase">{d}</div>
          ))}
          {calendarDays.map((d, i) => {
            let bgClass = '';
            let textClass = 'text-gray-600';
            if (d.status === 'present') {
              bgClass = 'bg-rf-green/15';
              textClass = 'text-rf-green font-bold';
            } else if (d.status === 'absent') {
              bgClass = 'bg-rf-red/15';
              textClass = 'text-rf-red font-bold';
            } else if (d.status === 'late') {
              bgClass = 'bg-rf-amber/15';
              textClass = 'text-rf-amber font-bold';
            } else if (d.status === null && i < startPad) {
              textClass = 'text-gray-700/30';
            }
            if (d.isToday) {
              bgClass = 'bg-rf-cyan text-white shadow-lg shadow-rf-cyan/20';
              textClass = 'text-white font-bold';
            }

            const isClickable = d.dateStr !== null;

            return (
              <button 
                key={i} 
                disabled={!isClickable}
                onClick={() => isClickable && setSelectedDate(d.dateStr!)}
                className={`h-8 flex items-center justify-center text-[11px] rounded-full w-8 mx-auto transition-transform ${isClickable ? 'hover:scale-110 active:scale-95 cursor-pointer' : 'cursor-default'} ${bgClass} ${textClass}`}
              >
                {d.day}
              </button>
            );
          })}
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-3 pt-3 border-t border-rf-cyan-dim/10">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rf-green" />
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Present</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rf-red" />
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Absent</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rf-amber" />
            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-wider">Late</span>
          </div>
        </div>
      </div>

      {/* Mark Attendance */}
      {isTodayAClassDay ? (
        <div className="rf-card p-5">
          <h3 className="font-headline font-bold text-white mb-1">Mark Today's Class</h3>
          <p className="text-[10px] text-gray-500 mb-4">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} • {course.room}
          </p>
          <div className="grid grid-cols-1 gap-2.5">
            <button
              onClick={() => handleMarkToday('present')}
              className="group flex items-center justify-between bg-rf-surface hover:bg-rf-green/5 p-3.5 rounded-xl transition-all active:scale-95 border border-rf-cyan-dim/20 hover:border-rf-green/30"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-rf-green/10 flex items-center justify-center text-rf-green group-hover:bg-rf-green group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-lg">check_circle</span>
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm text-white">Present</p>
                  <p className="text-[9px] text-gray-500">Arrived on time</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-gray-600 group-hover:text-rf-green">chevron_right</span>
            </button>

            <button
              onClick={() => handleMarkToday('absent')}
              className="group flex items-center justify-between bg-rf-surface hover:bg-rf-red/5 p-3.5 rounded-xl transition-all active:scale-95 border border-rf-cyan-dim/20 hover:border-rf-red/30"
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-rf-red/10 flex items-center justify-center text-rf-red group-hover:bg-rf-red group-hover:text-white transition-colors">
                  <span className="material-symbols-outlined text-lg">cancel</span>
                </div>
                <div className="text-left">
                  <p className="font-bold text-sm text-white">Absent</p>
                  <p className="text-[9px] text-gray-500">Missed the lecture</p>
                </div>
              </div>
              <span className="material-symbols-outlined text-gray-600 group-hover:text-rf-red">chevron_right</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="rf-card p-4 flex items-center gap-3 border border-dashed border-rf-cyan-dim/20">
          <span className="material-symbols-outlined text-gray-600 text-xl">event_busy</span>
          <div>
            <p className="text-sm font-bold text-gray-400">No class today</p>
            <p className="text-[10px] text-gray-600">
              Next class: {course.scheduleDays.join(' • ')} — tap a calendar date above to update past records.
            </p>
          </div>
        </div>
      )}

      {calc.status === 'danger' && (
        <div className="bg-rf-red/5 rounded-xl p-4 border-l-4 border-rf-red">
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-rf-red mt-0.5">warning</span>
            <div>
              <p className="text-xs font-bold text-rf-red mb-1">Attendance Alert</p>
              <p className="text-xs leading-relaxed text-gray-400">
                Attend the next <span className="font-bold text-white">{calc.classesNeeded} classes</span> to reach <span className="font-bold text-white">{course.attendanceThreshold}%</span> attendance.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Retroactive Date Update Modal */}
      {selectedDate && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedDate(null)} />
          <div className="bg-rf-base rf-card w-full sm:w-[380px] p-5 relative z-10 animate-slide-up sm:animate-fade-in border border-rf-cyan-dim/40 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-headline font-bold text-white">Update Record</h2>
              <button onClick={() => setSelectedDate(null)} className="text-gray-500 hover:text-white transition-colors bg-rf-surface p-1.5 rounded-full">
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            </div>
            
            <p className="text-xs text-gray-400 mb-6 bg-rf-surface p-2.5 rounded-lg border border-rf-cyan-dim/10 flex items-center gap-2">
              <span className="material-symbols-outlined text-rf-cyan text-sm">event</span>
              Date: <span className="font-bold text-white tracking-wider">{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</span>
            </p>

            <div className="space-y-3">
              <button
                onClick={() => { markAttendance(course.id, selectedDate, 'present'); setSelectedDate(null); }}
                className="w-full flex items-center justify-between bg-rf-surface hover:bg-rf-green/10 p-4 rounded-xl transition-all border border-rf-cyan-dim/20 hover:border-rf-green/30 group"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-rf-green text-xl group-hover:scale-110 transition-transform">check_circle</span>
                  <span className="font-bold text-sm text-white">Mark as Present</span>
                </div>
              </button>

              <button
                onClick={() => { markAttendance(course.id, selectedDate, 'absent'); setSelectedDate(null); }}
                className="w-full flex items-center justify-between bg-rf-surface hover:bg-rf-red/10 p-4 rounded-xl transition-all border border-rf-cyan-dim/20 hover:border-rf-red/30 group"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-rf-red text-xl group-hover:scale-110 transition-transform">cancel</span>
                  <span className="font-bold text-sm text-white">Mark as Absent</span>
                </div>
              </button>
              
              <button
                onClick={() => { markAttendance(course.id, selectedDate, 'late'); setSelectedDate(null); }}
                className="w-full flex items-center justify-between bg-rf-surface hover:bg-rf-amber/10 p-4 rounded-xl transition-all border border-rf-cyan-dim/20 hover:border-rf-amber/30 group"
              >
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-rf-amber text-xl group-hover:scale-110 transition-transform">schedule</span>
                  <span className="font-bold text-sm text-white">Mark as Late</span>
                </div>
              </button>

              {getRecord(course.id, selectedDate) && (
                <button
                  onClick={() => { 
                    const rec = getRecord(course.id, selectedDate);
                    if (rec) deleteRecord(rec.id);
                    setSelectedDate(null);
                  }}
                  className="w-full flex items-center justify-between bg-rf-surface hover:bg-rf-surface mt-6 pt-4 border-t border-rf-cyan-dim/20 group"
                >
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-gray-500 group-hover:text-white transition-colors text-sm">delete</span>
                    <span className="font-bold text-xs text-gray-500 group-hover:text-white transition-colors">Clear Record</span>
                  </div>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Course Notes Section */}
      <section className="rf-card p-4 mt-4">
        <button onClick={() => setShowNotes(!showNotes)}
          className="w-full flex items-center justify-between text-left"
        >
          <h3 className="text-sm font-headline font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-rf-cyan text-lg">note</span>
            Course Notes
          </h3>
          <span className="material-symbols-outlined text-gray-500 text-sm">
            {showNotes ? 'expand_less' : 'expand_more'}
          </span>
        </button>
        {showNotes && (
          <div className="mt-3 space-y-2 animate-fade-in">
            <textarea
              value={noteText}
              onChange={(e) => setNoteText(e.target.value)}
              placeholder="Add quick notes for this course (syllabus links, professor info, etc.)..."
              className="w-full h-28 px-4 py-3 text-sm text-white rounded-xl resize-none"
            />
            <button
              onClick={() => { upsertNote(courseId!, noteText); }}
              className="rf-btn-primary px-4 py-1.5 rounded-full text-xs"
            >
              Save Notes
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
