import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../stores/settingsStore';
import { useCoursesStore } from '../stores/coursesStore';
import { useAssignmentsStore } from '../stores/assignmentsStore';
import { useAttendanceStore } from '../stores/attendanceStore';
import { useHolidayStore } from '../stores/holidayStore';
import { useToastStore } from '../stores/toastStore';
import { useAllAttendanceCalc } from '../hooks/useAttendanceCalc';
import { getGreeting, formatDate, daysUntil, isTodayScheduled, getToday } from '../utils/dateUtils';
import { calculateHealthScore } from '../utils/attendanceUtils';
import { getHealthColor } from '../constants/theme';
import AddCourseModal from '../components/ui/AddCourseModal';
import { motion } from 'framer-motion';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Home() {
  const navigate = useNavigate();
  const studentName = useSettingsStore((s) => s.studentName);
  const exams = useSettingsStore((s) => s.exams);
  const studyStreak = useSettingsStore((s) => s.studyStreak);
  const courses = useCoursesStore((s) => s.courses);
  const allAssignments = useAssignmentsStore((s) => s.assignments);
  const markAttendance = useAttendanceStore((s) => s.markAttendance);
  const getRecord = useAttendanceStore((s) => s.getRecord);
  const isHoliday = useHolidayStore((s) => s.isHoliday);
  const addToast = useToastStore((s) => s.addToast);
  const activeAssignments = useMemo(() =>
    allAssignments.filter((a) => !a.completed).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
    [allAssignments]
  );
  const attendanceCalcs = useAllAttendanceCalc();
  const [showAddCourse, setShowAddCourse] = useState(false);

  const firstName = studentName.split(' ')[0] || 'Student';
  const today = new Date();
  const todayStr = getToday();
  const currentDayStr = today.toLocaleDateString('en-US', { weekday: 'short' });
  const initialDay = WEEKDAYS.includes(currentDayStr) ? currentDayStr : 'Mon';
  const [selectedDay, setSelectedDay] = useState(initialDay);

  const selectedDayClasses = useMemo(() => {
    return courses.filter((c) => c.scheduleDays.includes(selectedDay)).map((c) => {
      // Find the time slot specific to the selected day
      const daySlot = c.timeSlots?.find((s) => s.day === selectedDay);
      return {
        ...c,
        displayTime: daySlot?.time || c.time || '',
        displayRoom: daySlot?.room || c.room || '',
      };
    });
  }, [courses, selectedDay]);
  const todayClasses = courses.filter((c) => isTodayScheduled(c.scheduleDays));
  const pinnedExam = exams.find((e) => e.pinned) || exams[0];
  const pinnedDays = pinnedExam ? daysUntil(pinnedExam.date) : null;
  const todayHoliday = isHoliday(todayStr);

  // Weekly attendance summary
  const weekAttendance = useMemo(() => {
    let total = 0, attended = 0;
    attendanceCalcs.forEach((calc) => {
      total += calc.total;
      attended += calc.attended;
    });
    const pct = total > 0 ? Math.round((attended / total) * 100) : 0;
    return { total, attended, pct };
  }, [attendanceCalcs]);

  // GPA
  const semesterHistory = useSettingsStore((s) => s.semesterHistory);
  const avgGpa = semesterHistory.length > 0
    ? (semesterHistory.reduce((s, sem) => s + sem.gpa, 0) / semesterHistory.length).toFixed(2)
    : '—';

  // Quick mark attendance
  const handleQuickMark = (courseId: string, status: 'present' | 'absent') => {
    markAttendance(courseId, todayStr, status);
    addToast(status === 'present' ? '✓ Marked as attended' : '✗ Marked as missed', status === 'present' ? 'success' : 'warning');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="pt-4 pb-4 space-y-6"
    >
      {/* Hero Greeting */}
      <section>
        <p className="text-sm font-label font-medium text-gray-500 mb-1">{formatDate(today)}</p>
        <h1 className="text-2xl font-headline font-extrabold tracking-tight text-white">
          {getGreeting()}, {firstName}
        </h1>

        {/* Holiday Banner */}
        {todayHoliday && (
          <div className="mt-3 bg-rf-amber/10 border border-rf-amber/30 rounded-xl px-4 py-2.5 flex items-center gap-2">
            <span className="material-symbols-outlined text-rf-amber filled">celebration</span>
            <span className="text-sm text-rf-amber font-semibold">🎉 Today is {todayHoliday.name}!</span>
          </div>
        )}

        <div className="mt-3 flex gap-2 flex-wrap">
          <div className="bg-primary-container/80 px-3 py-1.5 rounded-full flex items-center gap-2">
            <span className="material-symbols-outlined text-white text-[16px]">school</span>
            <span className="text-white text-xs font-semibold rf-number">{todayClasses.length} classes today</span>
          </div>
          <div className="bg-rf-surface px-3 py-1.5 rounded-full flex items-center gap-2 border border-rf-cyan-dim">
            <span className="material-symbols-outlined text-rf-cyan text-[16px]">task_alt</span>
            <span className="text-rf-cyan text-xs font-semibold rf-number">{activeAssignments.length} due</span>
          </div>
          {studyStreak > 0 && (
            <div className="bg-rf-amber/10 px-3 py-1.5 rounded-full flex items-center gap-1 border border-rf-amber/30">
              <span className="text-sm">🔥</span>
              <span className="text-rf-amber text-xs font-bold rf-number">{studyStreak}-day streak</span>
            </div>
          )}
        </div>
      </section>

      {/* Exam + GPA + Attendance Grid */}
      <section className="grid grid-cols-3 gap-3">
        {/* Exam Countdown */}
        <div className="col-span-2 relative overflow-hidden rounded-xl bg-gradient-to-br from-primary to-primary-container p-5 text-white flex flex-col justify-between min-h-[140px]">
          <div className="relative z-10">
            <span className="text-[9px] font-bold uppercase tracking-[0.2em] opacity-80">
              {pinnedExam ? 'Next Milestone' : 'No Exams'}
            </span>
            <h2 className="text-base font-headline font-bold mt-0.5 leading-tight">
              {pinnedExam?.name || 'Add an exam'}
            </h2>
          </div>
          <div className="relative z-10 flex items-baseline gap-1.5">
            <span className="text-4xl font-headline font-black tracking-tighter rf-number">
              {pinnedDays !== null ? (pinnedDays >= 0 ? pinnedDays : 0) : '—'}
            </span>
            <span className="text-sm font-headline font-medium opacity-80">
              {pinnedDays !== null ? 'days to go' : ''}
            </span>
          </div>
          <div className="absolute -right-8 -bottom-8 w-36 h-36 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute right-8 top-0 w-20 h-20 bg-white/5 rounded-full blur-xl" />
        </div>

        {/* GPA Card */}
        <div className="rf-card p-4 flex flex-col justify-center items-center text-center">
          <span className="text-gray-500 text-[10px] font-medium mb-1">GPA</span>
          <span className="text-3xl font-headline font-black text-rf-cyan rf-number">{avgGpa}</span>
          {semesterHistory.length > 1 && (
            <span className="text-[9px] text-rf-green font-bold bg-rf-green/10 px-2 py-0.5 rounded mt-1.5">
              +{(semesterHistory[semesterHistory.length - 1].gpa - semesterHistory[semesterHistory.length - 2].gpa).toFixed(1)}
            </span>
          )}
        </div>
      </section>

      {/* Weekly Attendance Summary */}
      <section className="rf-card p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-headline font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-rf-cyan text-lg">monitoring</span>
            Attendance Overview
          </h3>
          <button onClick={() => navigate('/attendance')} className="text-rf-cyan text-xs font-bold flex items-center gap-0.5">
            Details <span className="material-symbols-outlined text-sm">chevron_right</span>
          </button>
        </div>
        <div className="flex items-center gap-4">
          <div className="relative w-16 h-16 flex-shrink-0">
            <svg className="w-full h-full transform -rotate-90">
              <circle cx="32" cy="32" r="28" fill="transparent" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
              <circle cx="32" cy="32" r="28" fill="transparent"
                stroke={weekAttendance.pct >= 75 ? '#00FF88' : weekAttendance.pct >= 50 ? '#FFB800' : '#FF3B5C'}
                strokeWidth="5" strokeLinecap="round"
                strokeDasharray={2 * Math.PI * 28}
                strokeDashoffset={2 * Math.PI * 28 * (1 - weekAttendance.pct / 100)}
                className="ring-animated"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center text-xs font-bold rf-number text-white">
              {weekAttendance.pct}%
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm text-white font-medium">
              {weekAttendance.attended}/{weekAttendance.total} classes attended
            </p>
            <p className="text-[10px] text-gray-500 mt-0.5">
              {weekAttendance.pct >= 75 ? '✅ On track' : weekAttendance.pct >= 50 ? '⚠️ Needs improvement' : '🚨 Critical — attend more classes'}
            </p>
          </div>
        </div>
      </section>

      {/* Course Health Rings */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-headline font-bold text-white">Course Health</h3>
          <button onClick={() => navigate('/attendance')} className="text-rf-cyan text-xs font-bold flex items-center gap-0.5">
            View All <span className="material-symbols-outlined text-sm">chevron_right</span>
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-3 -mx-4 px-4">
          {courses.length === 0 ? (
            <button onClick={() => setShowAddCourse(true)}
              className="flex-shrink-0 w-32 rf-card p-4 text-center flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-rf-cyan/40 transition-colors min-h-[130px]"
            >
              <span className="material-symbols-outlined text-rf-cyan text-2xl">add_circle</span>
              <p className="text-xs text-gray-400">Add Course</p>
            </button>
          ) : (
            courses.map((course) => {
              const calc = attendanceCalcs.get(course.id);
              const activeCourseAssignments = allAssignments.filter(a => a.courseId === course.id && !a.completed).length;
              const healthScore = calc ? calculateHealthScore(calc.percentage, -1, activeCourseAssignments) : 0;
              const color = course.color || getHealthColor(healthScore);

              return (
                <button key={course.id} onClick={() => navigate(`/attendance/${course.id}`)}
                  className="flex-shrink-0 w-32 rf-card p-3 text-center group transition-transform active:scale-95"
                >
                  <div className="relative w-14 h-14 mx-auto mb-2">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="28" cy="28" r="24" fill="transparent" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
                      <circle cx="28" cy="28" r="24" fill="transparent"
                        stroke={color} strokeWidth="5"
                        strokeDasharray="150.8"
                        strokeDashoffset={150.8 - (healthScore / 100) * 150.8}
                        strokeLinecap="round" className="ring-animated"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold rf-number" style={{ color }}>
                      {healthScore}%
                    </div>
                  </div>
                  <p className="text-xs font-bold text-white truncate">{course.code}</p>
                  <p className="text-[9px] text-gray-500 truncate">{course.name}</p>
                </button>
              );
            })
          )}
        </div>
      </section>

      {/* Weekly Timetable with Quick Attendance */}
      <section className="pb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-headline font-bold text-white">This Week's Timetable</h3>
          <button onClick={() => navigate('/calendar')} className="text-rf-cyan text-xs font-bold flex items-center gap-0.5">
            Calendar <span className="material-symbols-outlined text-sm">chevron_right</span>
          </button>
        </div>

        {/* Day Picker */}
        <div className="flex justify-between gap-2 mb-4 bg-rf-surface p-1.5 rounded-full border border-rf-cyan-dim/20">
          {WEEKDAYS.map(day => (
            <button key={day} onClick={() => setSelectedDay(day)}
              className={`flex-1 py-1.5 rounded-full text-[11px] font-bold transition-all ${
                selectedDay === day
                  ? 'bg-rf-cyan text-white shadow-[0_2px_8px_rgba(0,212,255,0.25)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              {day}
            </button>
          ))}
        </div>

        <div className="space-y-2.5">
          {selectedDayClasses.length === 0 ? (
            <div className="rf-card p-5 text-center border border-dashed border-rf-cyan-dim/30">
              <span className="material-symbols-outlined text-gray-600 text-3xl mb-2">event_busy</span>
              <p className="text-sm text-gray-500">No classes scheduled for {selectedDay}</p>
            </div>
          ) : (
            selectedDayClasses.map((course, idx) => {
              const todayRecord = selectedDay === currentDayStr ? getRecord(course.id, todayStr) : null;
              const isMarked = !!todayRecord;

              return (
                <div key={course.id}
                  className={`w-full rf-card p-3.5 flex items-center gap-3 transition-all ${
                    idx === 0 && selectedDay === currentDayStr ? 'border-l-4' : ''
                  } ${isMarked && todayRecord?.status === 'present' ? 'border-l-rf-green bg-rf-green/5' :
                    isMarked && todayRecord?.status === 'absent' ? 'border-l-rf-red bg-rf-red/5' :
                    idx === 0 && selectedDay === currentDayStr ? 'border-l-rf-cyan' : ''}`}
                  style={!isMarked && idx === 0 && selectedDay === currentDayStr ? {} : { borderLeftColor: isMarked ? undefined : course.color }}
                >
                  <div className="flex flex-col items-center justify-center min-w-[52px] border-r border-rf-cyan-dim/30 pr-3">
                    {course.displayTime ? (
                      <>
                        <span className={`text-xs font-bold rf-number ${idx === 0 && selectedDay === currentDayStr ? 'text-rf-cyan' : 'text-gray-300'}`}>
                          {course.displayTime.split(' ')[0]}
                        </span>
                        <span className="text-[9px] text-gray-500">{course.displayTime.split(' ')[1]}</span>
                      </>
                    ) : (
                      <span className="material-symbols-outlined text-lg text-gray-500">schedule</span>
                    )}
                  </div>
                  <div className="flex-grow text-left min-w-0">
                    <h4 className="font-bold text-sm text-white truncate">{course.name}</h4>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="material-symbols-outlined text-[12px] text-gray-500">location_on</span>
                      <span className="text-[10px] text-gray-400">{course.displayRoom || 'TBA'}</span>
                    </div>
                  </div>

                  {/* Quick Attendance Buttons (only for today) */}
                  {selectedDay === currentDayStr && !todayHoliday && (
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {isMarked ? (
                        <span className={`text-[9px] px-2 py-0.5 rounded-full font-bold ${
                          todayRecord?.status === 'present' ? 'bg-rf-green/15 text-rf-green' : 'bg-rf-red/15 text-rf-red'
                        }`}>
                          {todayRecord?.status === 'present' ? '✓ Present' : '✗ Absent'}
                        </span>
                      ) : (
                        <>
                          <button onClick={() => handleQuickMark(course.id, 'present')}
                            className="w-7 h-7 rounded-lg bg-rf-green/10 text-rf-green flex items-center justify-center hover:bg-rf-green/20 transition-colors"
                            title="Mark Present"
                          >
                            <span className="material-symbols-outlined text-[16px]">check</span>
                          </button>
                          <button onClick={() => handleQuickMark(course.id, 'absent')}
                            className="w-7 h-7 rounded-lg bg-rf-red/10 text-rf-red flex items-center justify-center hover:bg-rf-red/20 transition-colors"
                            title="Mark Absent"
                          >
                            <span className="material-symbols-outlined text-[16px]">close</span>
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  {/* Holiday indicator */}
                  {selectedDay === currentDayStr && todayHoliday && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-rf-amber/10 text-rf-amber font-bold">Holiday</span>
                  )}

                  {/* "Next" badge */}
                  {idx === 0 && selectedDay === currentDayStr && !todayHoliday && !isMarked && (
                    <span className="text-[9px] px-2 py-0.5 rounded-full bg-rf-cyan/10 text-rf-cyan font-bold">Next</span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </section>

      {/* FAB */}
      <button onClick={() => setShowAddCourse(true)} className="rf-fab">
        <span className="material-symbols-outlined text-2xl">add</span>
      </button>

      {showAddCourse && <AddCourseModal onClose={() => setShowAddCourse(false)} />}
    </motion.div>
  );
}
