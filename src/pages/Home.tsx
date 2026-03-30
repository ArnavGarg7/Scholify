import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSettingsStore } from '../stores/settingsStore';
import { useCoursesStore } from '../stores/coursesStore';
import { useAssignmentsStore } from '../stores/assignmentsStore';
import { useAllAttendanceCalc } from '../hooks/useAttendanceCalc';
import { getGreeting, formatDate, daysUntil, isTodayScheduled } from '../utils/dateUtils';
import { calculateHealthScore } from '../utils/attendanceUtils';
import { getHealthColor } from '../constants/theme';
import AddCourseModal from '../components/ui/AddCourseModal';

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function Home() {
  const navigate = useNavigate();
  const studentName = useSettingsStore((s) => s.studentName);
  const exams = useSettingsStore((s) => s.exams);
  const courses = useCoursesStore((s) => s.courses);
  const allAssignments = useAssignmentsStore((s) => s.assignments);
  const activeAssignments = useMemo(() => 
    allAssignments.filter((a) => !a.completed).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
    [allAssignments]
  );
  const attendanceCalcs = useAllAttendanceCalc();
  const [showAddCourse, setShowAddCourse] = useState(false);

  const firstName = studentName.split(' ')[0] || 'Student';
  const today = new Date();
  const currentDayStr = today.toLocaleDateString('en-US', { weekday: 'short' });
  const initialDay = WEEKDAYS.includes(currentDayStr) ? currentDayStr : 'Mon';
  
  const [selectedDay, setSelectedDay] = useState(initialDay);
  
  const selectedDayClasses = courses.filter((c) => c.scheduleDays.includes(selectedDay));
  const todayClasses = courses.filter((c) => isTodayScheduled(c.scheduleDays));
  const pinnedExam = exams.find((e) => e.pinned) || exams[0];
  const pinnedDays = pinnedExam ? daysUntil(pinnedExam.date) : null;

  // Calculate average GPA (placeholder logic)
  const semesterHistory = useSettingsStore((s) => s.semesterHistory);
  const avgGpa = semesterHistory.length > 0
    ? (semesterHistory.reduce((s, sem) => s + sem.gpa, 0) / semesterHistory.length).toFixed(2)
    : '—';

  return (
    <div
      className="pt-4 pb-4 space-y-6 animate-fade-in"
    >
      {/* Hero Greeting */}
      <section>
        <p className="text-sm font-label font-medium text-gray-500 mb-1">
          {formatDate(today)}
        </p>
        <h1 className="text-2xl font-headline font-extrabold tracking-tight text-white">
          {getGreeting()}, {firstName}
        </h1>
        <div className="mt-3 flex gap-2 flex-wrap">
          <div className="bg-primary-container/80 px-3 py-1.5 rounded-full flex items-center gap-2">
            <span className="material-symbols-outlined text-white text-[16px]">school</span>
            <span className="text-white text-xs font-semibold rf-number">
              {todayClasses.length} classes today
            </span>
          </div>
          <div className="bg-rf-surface px-3 py-1.5 rounded-full flex items-center gap-2 border border-rf-cyan-dim">
            <span className="material-symbols-outlined text-rf-cyan text-[16px]">task_alt</span>
            <span className="text-rf-cyan text-xs font-semibold rf-number">
              {activeAssignments.length} assignments due
            </span>
          </div>
        </div>
      </section>

      {/* Pinned Exam + GPA Grid */}
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
          <span className="text-3xl font-headline font-black text-rf-cyan rf-number">
            {avgGpa}
          </span>
          {semesterHistory.length > 1 && (
            <span className="text-[9px] text-rf-green font-bold bg-rf-green/10 px-2 py-0.5 rounded mt-1.5">
              +{(semesterHistory[semesterHistory.length - 1].gpa - semesterHistory[semesterHistory.length - 2].gpa).toFixed(1)}
            </span>
          )}
        </div>
      </section>

      {/* Course Health Rings */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-headline font-bold text-white">Course Health</h3>
          <button
            onClick={() => navigate('/attendance')}
            className="text-rf-cyan text-xs font-bold flex items-center gap-0.5"
          >
            View All
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-3 -mx-4 px-4">
          {courses.length === 0 ? (
            <button
              onClick={() => setShowAddCourse(true)}
              className="flex-shrink-0 w-32 rf-card p-4 text-center flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-rf-cyan/40 transition-colors min-h-[130px]"
            >
              <span className="material-symbols-outlined text-rf-cyan text-2xl">add_circle</span>
              <p className="text-xs text-gray-400">Add Course</p>
            </button>
          ) : (
            courses.map((course) => {
              const calc = attendanceCalcs.get(course.id);
              const healthScore = calc
                ? calculateHealthScore(calc.percentage, 0, 0)
                : 0;
              const color = getHealthColor(healthScore);

              return (
                <button
                  key={course.id}
                  onClick={() => navigate(`/attendance/${course.id}`)}
                  className="flex-shrink-0 w-32 rf-card p-3 text-center group transition-transform active:scale-95"
                >
                  <div className="relative w-14 h-14 mx-auto mb-2">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle
                        cx="28" cy="28" r="24" fill="transparent"
                        stroke="rgba(255,255,255,0.06)" strokeWidth="5"
                      />
                      <circle
                        cx="28" cy="28" r="24" fill="transparent"
                        stroke={color} strokeWidth="5"
                        strokeDasharray="150.8"
                        strokeDashoffset={150.8 - (healthScore / 100) * 150.8}
                        strokeLinecap="round"
                        className="ring-animated"
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

      {/* Weekly Timetable */}
      <section className="pb-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-base font-headline font-bold text-white">This Week's Timetable</h3>
        </div>
        
        {/* Day Picker */}
        <div className="flex justify-between gap-2 mb-4 bg-rf-surface p-1.5 rounded-full border border-rf-cyan-dim/20">
          {WEEKDAYS.map(day => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
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
              <span className="material-symbols-outlined text-gray-600 text-3xl mb-2">
                event_busy
              </span>
              <p className="text-sm text-gray-500">No classes scheduled for {selectedDay}</p>
            </div>
          ) : (
            selectedDayClasses.map((course, idx) => (
              <button
                key={course.id}
                onClick={() => navigate(`/attendance/${course.id}`)}
                className={`w-full rf-card p-3.5 flex items-center gap-3 group hover:translate-y-[-1px] transition-all ${
                  idx === 0 && selectedDay === currentDayStr ? 'border-l-4 border-l-rf-cyan' : ''
                }`}
              >
                <div className="flex flex-col items-center justify-center min-w-[52px] border-r border-rf-cyan-dim/30 pr-3">
                  <span className={`text-xs font-bold rf-number ${idx === 0 && selectedDay === currentDayStr ? 'text-rf-cyan' : 'text-gray-300'}`}>
                    {course.time.split(' ')[0]}
                  </span>
                  <span className="text-[9px] text-gray-500">{course.time.split(' ')[1]}</span>
                </div>
                <div className="flex-grow text-left">
                  <h4 className="font-bold text-sm text-white">{course.name}</h4>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="material-symbols-outlined text-[12px] text-gray-500">location_on</span>
                    <span className="text-[10px] text-gray-400">{course.room}</span>
                  </div>
                </div>
                {(idx === 0 && selectedDay === currentDayStr) && (
                  <span className="text-[9px] px-2 py-0.5 rounded-full bg-rf-cyan/10 text-rf-cyan font-bold">
                    Next
                  </span>
                )}
              </button>
            ))
          )}
        </div>
      </section>

      {/* FAB */}
      <button
        onClick={() => setShowAddCourse(true)}
        className="rf-fab"
      >
        <span className="material-symbols-outlined text-2xl">add</span>
      </button>

      {/* Add Course Modal */}
      {showAddCourse && <AddCourseModal onClose={() => setShowAddCourse(false)} />}
    </div>
  );
}
