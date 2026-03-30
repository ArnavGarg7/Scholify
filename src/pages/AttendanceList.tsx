import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCoursesStore } from '../stores/coursesStore';
import { useAllAttendanceCalc } from '../hooks/useAttendanceCalc';
import { useState } from 'react';
import AddCourseModal from '../components/ui/AddCourseModal';

export default function AttendanceList() {
  const navigate = useNavigate();
  const courses = useCoursesStore((s) => s.courses);
  const attendanceCalcs = useAllAttendanceCalc();
  const [filterAtRisk, setFilterAtRisk] = useState(false);
  const [showAddCourse, setShowAddCourse] = useState(false);

  // Calculate overall average
  const calcs = Array.from(attendanceCalcs.values());
  const avgAttendance = calcs.length > 0
    ? Math.round(calcs.reduce((s, c) => s + c.percentage, 0) / calcs.length)
    : 0;

  const displayCourses = filterAtRisk
    ? courses.filter((c) => {
        const calc = attendanceCalcs.get(c.id);
        return calc && calc.percentage < 80;
      })
    : courses;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="pt-4 pb-4"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-headline font-extrabold tracking-tight text-white">
            Attendance
          </h1>
          <button
            onClick={() => setFilterAtRisk(!filterAtRisk)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
              filterAtRisk
                ? 'bg-rf-red/15 text-rf-red border border-rf-red/30'
                : 'bg-rf-surface text-gray-400 border border-rf-cyan-dim'
            }`}
          >
            <span className="material-symbols-outlined text-sm">filter_list</span>
            At-risk only
          </button>
        </div>

        {/* Overall Stats */}
        {courses.length > 0 && (
          <div className="bg-gradient-to-br from-primary to-primary-container p-5 rounded-xl text-white flex justify-between items-center relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-white/80 text-xs font-medium">Average Attendance</p>
              <p className="text-4xl font-extrabold font-headline rf-number">{avgAttendance}%</p>
            </div>
            <div className="h-14 w-14 rounded-full border-[3px] border-white/20 flex items-center justify-center relative z-10">
              <span className="material-symbols-outlined text-2xl">verified_user</span>
            </div>
            <div className="absolute right-[-20px] top-[-20px] w-36 h-36 bg-white/10 rounded-full blur-3xl" />
          </div>
        )}
      </div>

      {/* Course Cards */}
      <div className="space-y-3">
        {displayCourses.length === 0 && courses.length === 0 ? (
          <div className="rf-card p-8 text-center">
            <span className="material-symbols-outlined text-gray-600 text-4xl mb-3 block">school</span>
            <p className="text-sm text-gray-400 mb-4">No courses added yet</p>
            <button
              onClick={() => setShowAddCourse(true)}
              className="rf-btn-primary px-6 py-2.5 text-sm rounded-full"
            >
              Add Your First Course
            </button>
          </div>
        ) : (
          displayCourses.map((course) => {
            const calc = attendanceCalcs.get(course.id);
            if (!calc) return null;

            const statusConfig = {
              safe: { label: 'Safe', badgeClass: 'status-badge-safe' },
              warning: { label: 'Warning', badgeClass: 'status-badge-warning' },
              danger: { label: 'Critical', badgeClass: 'status-badge-danger' },
            }[calc.status];

            const percentColor = {
              safe: 'text-rf-green',
              warning: 'text-rf-amber',
              danger: 'text-rf-red',
            }[calc.status];

            return (
              <button
                key={course.id}
                onClick={() => navigate(`/attendance/${course.id}`)}
                className="w-full rf-card p-4 flex flex-col gap-3 group hover:translate-y-[-1px] transition-all text-left active:scale-[0.98]"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-base font-bold text-white">{course.name}</h3>
                    <p className="text-[10px] text-gray-500 font-medium">
                      {course.code} • {course.scheduleDays.join(', ')}
                    </p>
                  </div>
                  <div className={`${statusConfig.badgeClass} px-2.5 py-0.5 rounded-full text-[9px] font-extrabold tracking-wider flex items-center gap-1 uppercase`}>
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {statusConfig.label}
                  </div>
                </div>

                <div className="flex items-end justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-gray-500">Classes</span>
                    <span className="text-xl font-extrabold font-headline text-white rf-number">
                      {calc.attended}
                      <span className="text-gray-500 font-medium text-base">/{calc.total}</span>
                    </span>
                  </div>
                  <span className={`text-3xl font-extrabold font-headline ${percentColor} rf-number`}>
                    {calc.percentage}%
                  </span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-rf-cyan-dim/20">
                  <span className="text-[10px] font-medium text-gray-500 flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">event_note</span>
                    {calc.status === 'danger'
                      ? `Attend next ${calc.classesNeeded} classes`
                      : `${calc.safeSkips} can skip`}
                  </span>
                  <span className="material-symbols-outlined text-gray-600 group-hover:text-rf-cyan transition-colors text-lg">
                    chevron_right
                  </span>
                </div>
              </button>
            );
          })
        )}
      </div>

      {/* FAB */}
      <button
        onClick={() => setShowAddCourse(true)}
        className="rf-fab"
      >
        <span className="material-symbols-outlined text-xl">add_circle</span>
      </button>

      {showAddCourse && <AddCourseModal onClose={() => setShowAddCourse(false)} />}
    </motion.div>
  );
}
