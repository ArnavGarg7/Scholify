import { useState } from 'react';
import { useCoursesStore, Course } from '../../stores/coursesStore';

interface AddCourseModalProps {
  onClose: () => void;
  initialCourse?: Course;
}

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function AddCourseModal({ onClose, initialCourse }: AddCourseModalProps) {
  const addCourse = useCoursesStore((s) => s.addCourse);
  const updateCourse = useCoursesStore((s) => s.updateCourse);
  
  const [name, setName] = useState(initialCourse?.name || '');
  const [code, setCode] = useState(initialCourse?.code || '');
  const [selectedDays, setSelectedDays] = useState<string[]>(initialCourse?.scheduleDays || []);
  const [time, setTime] = useState(initialCourse?.time || '09:00 AM');
  const [room, setRoom] = useState(initialCourse?.room || '');
  const [totalHeld, setTotalHeld] = useState(initialCourse?.totalClassesHeld || 0);
  const [totalAttended, setTotalAttended] = useState(initialCourse?.totalAttended || 0);
  const [credits, setCredits] = useState(initialCourse?.creditHours || 3);

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSubmit = () => {
    if (!name.trim() || selectedDays.length === 0) return;
    
    const courseData = {
      name: name.trim(),
      code: code.trim() || name.substring(0, 6).toUpperCase(),
      scheduleDays: selectedDays,
      time,
      room: room.trim(),
      totalClassesHeld: totalHeld,
      totalAttended: totalAttended,
      creditHours: credits,
    };

    if (initialCourse) {
      updateCourse(initialCourse.id, courseData);
    } else {
      addCourse({
        ...courseData,
        attendanceThreshold: 75,
        semesterStartDate: new Date().toISOString(),
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md mx-4 bg-rf-card border border-rf-cyan-dim rounded-t-2xl md:rounded-2xl p-6 max-h-[85vh] overflow-y-auto animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-headline font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-rf-cyan">school</span>
            {initialCourse ? 'Edit Course' : 'Add Course'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300">
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>

        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="text-xs font-medium text-gray-400 mb-1 block">Course Name *</label>
            <input
              type="text"
              placeholder="e.g. Data Structures"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full h-12 px-4 text-sm text-white rounded-xl"
            />
          </div>

          {/* Code */}
          <div>
            <label className="text-xs font-medium text-gray-400 mb-1 block">Course Code</label>
            <input
              type="text"
              placeholder="e.g. CS201"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-12 px-4 text-sm text-white rounded-xl"
            />
          </div>

          {/* Schedule Days */}
          <div>
            <label className="text-xs font-medium text-gray-400 mb-2 block">Schedule Days</label>
            <div className="flex gap-2 flex-wrap">
              {DAYS.map((day) => (
                <button
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                    selectedDays.includes(day)
                      ? 'bg-rf-cyan/20 text-rf-cyan border border-rf-cyan/40'
                      : 'bg-rf-surface text-gray-500 border border-rf-cyan-dim hover:border-rf-cyan/30'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </div>

          {/* Time & Room */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-gray-400 mb-1 block">Time</label>
              <input
                type="text"
                placeholder="09:00 AM"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full h-12 px-4 text-sm text-white rounded-xl"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-gray-400 mb-1 block">Room</label>
              <input
                type="text"
                placeholder="LT-04"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="w-full h-12 px-4 text-sm text-white rounded-xl"
              />
            </div>
          </div>

          {/* Credits */}
          <div>
            <label className="text-xs font-medium text-gray-400 mb-1 block">Credit Hours</label>
            <input
              type="number"
              min={1}
              max={6}
              value={credits}
              onChange={(e) => setCredits(parseInt(e.target.value) || 3)}
              className="w-full h-12 px-4 text-sm text-white rounded-xl"
            />
          </div>

          {/* Mid-semester init */}
          <div className="bg-rf-surface/50 p-4 rounded-xl border border-rf-cyan-dim/30">
            <p className="text-[10px] font-bold uppercase tracking-wider text-rf-amber mb-3">
              Mid-Semester Init (Optional)
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] text-gray-500 mb-1 block">Classes Held So Far</label>
                <input
                  type="number"
                  min={0}
                  value={totalHeld}
                  onChange={(e) => setTotalHeld(parseInt(e.target.value) || 0)}
                  className="w-full h-10 px-4 text-sm text-white rounded-xl rf-number"
                />
              </div>
              <div>
                <label className="text-[10px] text-gray-500 mb-1 block">Attended So Far</label>
                <input
                  type="number"
                  min={0}
                  max={totalHeld}
                  value={totalAttended}
                  onChange={(e) => setTotalAttended(parseInt(e.target.value) || 0)}
                  className="w-full h-10 px-4 text-sm text-white rounded-xl rf-number"
                />
              </div>
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || selectedDays.length === 0}
            className="w-full rf-btn-primary h-12 rounded-xl flex items-center justify-center gap-2 text-sm disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-lg">{initialCourse ? 'save' : 'add'}</span>
            {initialCourse ? 'Save Changes' : 'Add Course'}
          </button>
        </div>
      </div>
    </div>
  );
}
