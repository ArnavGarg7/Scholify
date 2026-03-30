import { motion } from 'framer-motion';
import { useSettingsStore } from '../stores/settingsStore';
import { useCoursesStore } from '../stores/coursesStore';
import { daysUntil } from '../utils/dateUtils';
import { getDaysColor } from '../constants/theme';
import { useState } from 'react';

export default function ExamCountdown() {
  const { exams, addExam, deleteExam, togglePinExam } = useSettingsStore();
  const courses = useCoursesStore((s) => s.courses);
  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState('');
  const [newCourseId, setNewCourseId] = useState(courses[0]?.id || '');
  const [newDate, setNewDate] = useState('');

  const sortedExams = [...exams]
    .map((e) => ({ ...e, daysLeft: daysUntil(e.date) }))
    .sort((a, b) => a.daysLeft - b.daysLeft);

  const handleAdd = () => {
    if (!newName.trim() || !newDate) return;
    addExam({ name: newName.trim(), courseId: newCourseId, date: newDate, pinned: false });
    setNewName('');
    setNewDate('');
    setShowAdd(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="pt-4 pb-4 space-y-4"
    >
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-headline font-extrabold text-white tracking-tight">Exam Countdown</h1>
        <button onClick={() => setShowAdd(!showAdd)} className="rf-btn-primary px-4 py-2 text-xs rounded-full flex items-center gap-1">
          <span className="material-symbols-outlined text-sm">add</span> Add Exam
        </button>
      </div>

      {/* Add Form */}
      {showAdd && (
        <div className="rf-card p-4 space-y-3 animate-fade-in">
          <input type="text" placeholder="Exam name" value={newName} onChange={(e) => setNewName(e.target.value)} className="w-full h-10 px-4 text-sm text-white rounded-xl" />
          <div className="grid grid-cols-2 gap-2">
            <select value={newCourseId} onChange={(e) => setNewCourseId(e.target.value)} className="h-10 px-3 text-sm text-white rounded-xl">
              {courses.map((c) => <option key={c.id} value={c.id} className="bg-rf-card">{c.name}</option>)}
            </select>
            <input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="h-10 px-3 text-sm text-white rounded-xl" />
          </div>
          <button onClick={handleAdd} className="w-full rf-btn-primary h-10 rounded-xl text-xs">Add Exam</button>
        </div>
      )}

      {/* Exam Cards */}
      <div className="space-y-3">
        {sortedExams.length === 0 ? (
          <div className="rf-card p-8 text-center">
            <span className="material-symbols-outlined text-gray-600 text-4xl mb-3 block">timer</span>
            <p className="text-sm text-gray-400">No exams tracked yet</p>
          </div>
        ) : (
          sortedExams.map((exam) => {
            const color = getDaysColor(exam.daysLeft);
            const dateStr = new Date(exam.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
            return (
              <div key={exam.id} className="rf-card p-4 flex items-center gap-4">
                <div className="flex flex-col items-center justify-center min-w-[60px]">
                  <span className="text-3xl font-headline font-black rf-number" style={{ color }}>
                    {exam.daysLeft >= 0 ? exam.daysLeft : 0}
                  </span>
                  <span className="text-[9px] text-gray-500 uppercase font-bold tracking-wider">
                    {exam.daysLeft === 1 ? 'day' : 'days'}
                  </span>
                </div>
                <div className="flex-1 border-l border-rf-cyan-dim/20 pl-4">
                  <h3 className="text-sm font-bold text-white">{exam.name}</h3>
                  <p className="text-[10px] text-gray-500 mt-0.5">{dateStr}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={() => togglePinExam(exam.id)} className={`p-1.5 rounded-lg transition-colors ${exam.pinned ? 'text-rf-amber bg-rf-amber/10' : 'text-gray-600 hover:text-rf-amber'}`}>
                    <span className="material-symbols-outlined text-lg">{exam.pinned ? 'push_pin' : 'push_pin'}</span>
                  </button>
                  <button onClick={() => deleteExam(exam.id)} className="p-1.5 rounded-lg text-gray-600 hover:text-rf-red transition-colors">
                    <span className="material-symbols-outlined text-lg">delete</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </motion.div>
  );
}
