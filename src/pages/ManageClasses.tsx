import { useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCoursesStore, Course } from '../stores/coursesStore';
import AddCourseModal from '../components/ui/AddCourseModal';

export default function ManageClasses() {
  const navigate = useNavigate();
  const courses = useCoursesStore((s) => s.courses);
  const deleteCourse = useCoursesStore((s) => s.deleteCourse);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);

  const handleDelete = (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete ${name}?\n\nThis will remove the course and it cannot be undone. You may also need to manually clear its attendance/grades data if you want to reuse the store.`)) {
      deleteCourse(id);
    }
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
          courses.map((course) => (
            <div key={course.id} className="rf-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all hover:border-rf-cyan/30">
              <div>
                <h3 className="text-base font-bold text-white">{course.name}</h3>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] bg-rf-surface px-2 py-0.5 rounded text-gray-300 font-mono">{course.code}</span>
                  <span className="text-[10px] text-gray-500">• {course.scheduleDays.join(', ')}</span>
                  <span className="text-[10px] text-gray-500">• {course.time}</span>
                  <span className="text-[10px] text-gray-500 flex items-center gap-0.5"><span className="material-symbols-outlined text-[12px]">location_on</span>{course.room}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 self-end sm:self-auto">
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
          ))
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
