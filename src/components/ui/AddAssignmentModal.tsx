import { useState } from 'react';
import { useAssignmentsStore, Priority } from '../../stores/assignmentsStore';
import { useCoursesStore } from '../../stores/coursesStore';

interface Props {
  onClose: () => void;
}

export default function AddAssignmentModal({ onClose }: Props) {
  const addAssignment = useAssignmentsStore((s) => s.addAssignment);
  const courses = useCoursesStore((s) => s.courses);
  const [title, setTitle] = useState('');
  const [courseId, setCourseId] = useState(courses[0]?.id || '');
  const [dueDate, setDueDate] = useState('');
  const [priority, setPriority] = useState<Priority>('medium');
  const [notes, setNotes] = useState('');

  const selectedCourse = courses.find((c) => c.id === courseId);

  const handleSubmit = () => {
    if (!title.trim() || !dueDate) return;
    addAssignment({
      courseId,
      courseName: selectedCourse?.name || 'General',
      title: title.trim(),
      dueDate,
      priority,
      notes: notes.trim(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md mx-4 bg-rf-card border border-rf-cyan-dim rounded-t-2xl md:rounded-2xl p-6 max-h-[85vh] overflow-y-auto animate-fade-in">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-headline font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-rf-cyan">assignment_add</span>
            Add Assignment
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-gray-400 mb-1 block">Title *</label>
            <input
              type="text"
              placeholder="e.g. OS Lab Report"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full h-12 px-4 text-sm text-white rounded-xl"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-400 mb-1 block">Course</label>
            <div className="relative">
              <select
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                className="w-full h-12 px-4 text-sm text-white rounded-xl pr-10"
              >
                {courses.map((c) => (
                  <option key={c.id} value={c.id} className="bg-rf-card text-white">
                    {c.name}
                  </option>
                ))}
                {courses.length === 0 && (
                  <option value="" className="bg-rf-card text-white">No courses — add one first</option>
                )}
              </select>
              <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 text-lg">
                expand_more
              </span>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-400 mb-1 block">Due Date *</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full h-12 px-4 text-sm text-white rounded-xl"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-400 mb-2 block">Priority</label>
            <div className="flex gap-2">
              {(['high', 'medium', 'low'] as Priority[]).map((p) => {
                const config = {
                  high: { label: 'High', color: 'rf-red' },
                  medium: { label: 'Medium', color: 'rf-amber' },
                  low: { label: 'Low', color: 'rf-green' },
                }[p];
                return (
                  <button
                    key={p}
                    onClick={() => setPriority(p)}
                    className={`flex-1 py-2 rounded-full text-xs font-bold transition-all border ${
                      priority === p
                        ? `bg-${config.color}/15 text-${config.color} border-${config.color}/40`
                        : 'bg-rf-surface text-gray-500 border-rf-cyan-dim hover:border-rf-cyan/30'
                    }`}
                    style={
                      priority === p
                        ? {
                            backgroundColor:
                              p === 'high'
                                ? 'rgba(255,59,92,0.15)'
                                : p === 'medium'
                                ? 'rgba(255,184,0,0.15)'
                                : 'rgba(0,255,136,0.15)',
                            color: p === 'high' ? '#FF3B5C' : p === 'medium' ? '#FFB800' : '#00FF88',
                            borderColor:
                              p === 'high'
                                ? 'rgba(255,59,92,0.4)'
                                : p === 'medium'
                                ? 'rgba(255,184,0,0.4)'
                                : 'rgba(0,255,136,0.4)',
                          }
                        : {}
                    }
                  >
                    {config.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-gray-400 mb-1 block">Notes</label>
            <textarea
              placeholder="Additional details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 text-sm text-white rounded-xl resize-none"
            />
          </div>

          <button
            onClick={handleSubmit}
            disabled={!title.trim() || !dueDate}
            className="w-full rf-btn-primary h-12 rounded-xl flex items-center justify-center gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            Add Assignment
          </button>
        </div>
      </div>
    </div>
  );
}
