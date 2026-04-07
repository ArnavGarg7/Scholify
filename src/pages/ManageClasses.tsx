import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCoursesStore, Course } from '../stores/coursesStore';
import { useToastStore } from '../stores/toastStore';
import AddCourseModal from '../components/ui/AddCourseModal';

export default function ManageClasses() {
  const navigate = useNavigate();
  const courses = useCoursesStore((s) => s.courses);
  const deleteCourse = useCoursesStore((s) => s.deleteCourse);
  const updateCourse = useCoursesStore((s) => s.updateCourse);
  const addToast = useToastStore((s) => s.addToast);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  // Track which courses have the "Attendance So Far" panel expanded
  const [expandedPrior, setExpandedPrior] = useState<Set<string>>(new Set());
  // Local draft state for prior attendance inputs, keyed by course id
  const [priorDraft, setPriorDraft] = useState<Record<string, { held: number; attended: number }>>({});

  const handleDelete = (id: string, name: string) => {
    if (confirmDeleteId === id) {
      deleteCourse(id);
      addToast(`Deleted ${name}`, 'info');
      setConfirmDeleteId(null);
    } else {
      setConfirmDeleteId(id);
      addToast('Tap delete again to confirm', 'warning', 3000);
      setTimeout(() => setConfirmDeleteId(null), 3000);
    }
  };

  const togglePrior = (courseId: string, course: Course) => {
    setExpandedPrior((prev) => {
      const next = new Set(prev);
      if (next.has(courseId)) {
        next.delete(courseId);
      } else {
        next.add(courseId);
        // Seed draft from current store values if not already set
        if (!priorDraft[courseId]) {
          setPriorDraft((d) => ({
            ...d,
            [courseId]: { held: course.totalClassesHeld || 0, attended: course.totalAttended || 0 },
          }));
        }
      }
      return next;
    });
  };

  const getPriorDraft = (courseId: string, course: Course) =>
    priorDraft[courseId] ?? { held: course.totalClassesHeld || 0, attended: course.totalAttended || 0 };

  const savePrior = (courseId: string, held: number, attended: number) => {
    const safeAttended = Math.min(attended, held);
    updateCourse(courseId, { totalClassesHeld: held, totalAttended: safeAttended });
    addToast('Prior attendance updated ✓', 'success', 2500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="pt-4 pb-4 space-y-4"
    >
      <div className="flex items-center gap-2 mb-2">
        <button onClick={() => navigate('/settings')} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-rf-surface transition-colors">
          <span className="material-symbols-outlined text-gray-400">arrow_back</span>
        </button>
        <h1 className="text-2xl font-headline font-extrabold text-white tracking-tight">Manage Classes</h1>
      </div>

      <div className="space-y-3">
        {courses.length === 0 ? (
          <div className="rf-card p-8 text-center border border-dashed border-rf-cyan-dim/30">
            <span className="material-symbols-outlined text-gray-600 text-4xl mb-3 block">school</span>
            <p className="text-sm text-gray-400">No courses added yet.</p>
          </div>
        ) : (
          courses.map((course) => {
            const draft = getPriorDraft(course.id, course);
            const priorPct = draft.held > 0 ? Math.round((draft.attended / draft.held) * 100) : 100;
            const isPriorExpanded = expandedPrior.has(course.id);

            return (
              <div key={course.id} className="rf-card flex flex-col transition-all hover:border-rf-cyan/30">
                {/* Top Row — course info + action buttons */}
                <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-white">{course.name}</h3>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className="text-[10px] bg-rf-surface px-2 py-0.5 rounded text-gray-300 font-mono">{course.code}</span>
                      {course.timeSlots && course.timeSlots.length > 0 ? (
                        <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar whitespace-nowrap">
                          {course.timeSlots.map((slot, i) => (
                            <span key={i} className="text-[9px] text-rf-cyan bg-rf-cyan/10 px-1.5 py-0.5 rounded font-bold border border-rf-cyan/20">
                              {slot.day} {slot.time} <span className="text-gray-400 font-normal ml-0.5">({slot.room || 'TBA'})</span>
                            </span>
                          ))}
                        </div>
                      ) : (
                        <>
                          <span className="text-[10px] text-gray-500">• {course.scheduleDays.join(', ')}</span>
                          <span className="text-[10px] text-gray-500">• {course.time}</span>
                          <span className="text-[10px] text-gray-500 flex items-center gap-0.5"><span className="material-symbols-outlined text-[12px]">location_on</span>{course.room}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      onClick={() => togglePrior(course.id, course)}
                      title="Set prior attendance for mid-semester"
                      className={`px-3 py-1.5 rounded-lg text-sm font-bold flex items-center gap-1 border transition-colors ${
                        isPriorExpanded
                          ? 'bg-rf-amber/10 text-rf-amber border-rf-amber/30'
                          : 'bg-rf-surface text-rf-amber hover:bg-rf-amber/10 border-rf-cyan-dim/20'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">history_edu</span>
                      Prior
                    </button>
                    <button
                      onClick={() => setEditingCourse(course)}
                      className="px-4 py-1.5 rounded-lg bg-rf-surface text-rf-cyan hover:bg-rf-cyan/10 transition-colors text-sm font-bold flex items-center gap-1 border border-rf-cyan-dim/20"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit</span>
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(course.id, course.name)}
                      className="px-4 py-1.5 rounded-lg bg-rf-surface text-rf-red hover:bg-rf-red/10 transition-colors text-sm font-bold flex items-center gap-1 border border-rf-red/20"
                    >
                      <span className="material-symbols-outlined text-[16px]">delete</span>
                      Delete
                    </button>
                  </div>
                </div>

                {/* Expandable: Attendance So Far */}
                {isPriorExpanded && (
                  <div className="border-t border-rf-cyan-dim/15 px-4 pb-4 pt-3 animate-fade-in">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="material-symbols-outlined text-rf-amber text-base">history_edu</span>
                      <p className="text-xs font-bold text-rf-amber">Attendance So Far (Before Today)</p>
                    </div>
                    <p className="text-[10px] text-gray-500 mb-3 leading-relaxed">
                      Enter the total classes held and how many you attended <span className="text-white font-semibold">before</span> you started using Scholify. This seeds your real attendance baseline.
                    </p>

                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="text-[10px] text-gray-500 block mb-1">Total Classes Held</label>
                        <input
                          type="number"
                          min={0}
                          value={draft.held}
                          onChange={(e) => {
                            const held = Math.max(0, parseInt(e.target.value) || 0);
                            setPriorDraft((d) => ({
                              ...d,
                              [course.id]: { ...getPriorDraft(course.id, course), held },
                            }));
                          }}
                          className="w-full h-10 px-3 text-sm text-white rounded-xl rf-number bg-rf-surface border border-rf-cyan-dim/20 focus:border-rf-amber/50 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-gray-500 block mb-1">You Attended</label>
                        <input
                          type="number"
                          min={0}
                          max={draft.held}
                          value={draft.attended}
                          onChange={(e) => {
                            const attended = Math.max(0, parseInt(e.target.value) || 0);
                            setPriorDraft((d) => ({
                              ...d,
                              [course.id]: { ...getPriorDraft(course.id, course), attended },
                            }));
                          }}
                          className="w-full h-10 px-3 text-sm text-white rounded-xl rf-number bg-rf-surface border border-rf-cyan-dim/20 focus:border-rf-amber/50 focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Live preview */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[10px] text-gray-500">Prior attendance rate</span>
                      <span className={`text-sm font-extrabold rf-number ${priorPct >= 75 ? 'text-rf-green' : 'text-rf-red'}`}>
                        {priorPct}%
                      </span>
                    </div>

                    <button
                      onClick={() => savePrior(course.id, draft.held, draft.attended)}
                      className="w-full py-2 rounded-xl text-xs font-bold bg-rf-amber/10 text-rf-amber border border-rf-amber/30 hover:bg-rf-amber/20 transition-colors active:scale-95"
                    >
                      Save Prior Attendance
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {editingCourse && (
        <AddCourseModal
          initialCourse={editingCourse}
          onClose={() => setEditingCourse(null)}
        />
      )}
    </motion.div>
  );
}
