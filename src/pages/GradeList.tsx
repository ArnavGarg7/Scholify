import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useCoursesStore } from '../stores/coursesStore';
import { useGradesStore } from '../stores/gradesStore';
import { useGradeCalc } from '../hooks/useGradeCalc';
import { getGradeColor } from '../utils/gradeUtils';

function CourseGradeCard({ courseId }: { courseId: string }) {
  const navigate = useNavigate();
  const course = useCoursesStore((s) => s.courses.find((c) => c.id === courseId));
  const initDefaults = useGradesStore((s) => s.initDefaultComponents);
  const calc = useGradeCalc(courseId);

  if (!course) return null;

  // Ensure defaults are initialized
  if (calc.components.length === 0) {
    initDefaults(courseId);
  }

  const color = getGradeColor(calc.currentGrade);
  const entered = calc.components.filter((c) => c.obtainedMarks !== null).length;
  const total = calc.components.length;

  return (
    <button
      onClick={() => navigate(`/grades/${courseId}`)}
      className="w-full rf-card p-4 flex flex-col gap-3 group hover:translate-y-[-1px] transition-all text-left active:scale-[0.98]"
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-base font-bold text-white">{course.name}</h3>
          <p className="text-[10px] text-gray-500 font-medium">{course.code} • {entered}/{total} components graded</p>
        </div>
        <div className="text-right">
          <span className="text-3xl font-extrabold font-headline rf-number" style={{ color }}>
            {calc.currentGrade}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-rf-cyan-dim/20">
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">
            Grade Points: <span className="text-white font-bold rf-number">{calc.currentPoints.toFixed(1)}</span>
          </span>
          <span className="text-xs text-gray-500">
            Score: <span className="text-white font-bold rf-number">{calc.totalWeightedScore.toFixed(1)}%</span>
          </span>
        </div>
        <span className="material-symbols-outlined text-gray-600 group-hover:text-rf-cyan transition-colors text-lg">
          chevron_right
        </span>
      </div>
    </button>
  );
}

export default function GradeList() {
  const courses = useCoursesStore((s) => s.courses);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="pt-4 pb-4"
    >
      <h1 className="text-2xl font-headline font-extrabold text-white tracking-tight mb-6">
        Grades
      </h1>

      <div className="space-y-3">
        {courses.length === 0 ? (
          <div className="rf-card p-8 text-center">
            <span className="material-symbols-outlined text-gray-600 text-4xl mb-3 block">grade</span>
            <p className="text-sm text-gray-400">Add courses to start tracking grades</p>
          </div>
        ) : (
          courses.map((c) => <CourseGradeCard key={c.id} courseId={c.id} />)
        )}
      </div>
    </motion.div>
  );
}
