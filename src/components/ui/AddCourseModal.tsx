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
  const [credits, setCredits] = useState(initialCourse?.creditHours || 3);
  const [totalHeld, setTotalHeld] = useState(initialCourse?.totalClassesHeld || 0);
  const [totalAttended, setTotalAttended] = useState(initialCourse?.totalAttended || 0);

  // Dynamic slot engine
  const [timeSlots, setTimeSlots] = useState<{day: string, time: string, room: string}[]>(
    initialCourse?.timeSlots && initialCourse.timeSlots.length > 0 
      ? initialCourse.timeSlots 
      : initialCourse?.scheduleDays && initialCourse.scheduleDays.length > 0
        ? initialCourse.scheduleDays.map(day => ({ day, time: initialCourse.time || '09:00 AM', room: initialCourse.room || '' }))
        : [{ day: 'Mon', time: '09:00 AM', room: '' }]
  );

  const addSlot = () => setTimeSlots([...timeSlots, { day: 'Mon', time: '', room: '' }]);
  const updateSlot = (index: number, field: 'day' | 'time' | 'room', value: string) => {
    const newSlots = [...timeSlots];
    newSlots[index] = { ...newSlots[index], [field]: value };
    setTimeSlots(newSlots);
  };
  const removeSlot = (index: number) => setTimeSlots(timeSlots.filter((_, i) => i !== index));

  const handleSubmit = () => {
    if (!name.trim() || timeSlots.length === 0) return;
    
    // Derive primitive scheduleDays from the timeSlots array for legacy fallback mapping
    const distinctDays = Array.from(new Set(timeSlots.map(s => s.day)));

    const courseData = {
      name: name.trim(),
      code: code.trim() || name.substring(0, 6).toUpperCase(),
      scheduleDays: distinctDays,
      time: timeSlots[0]?.time || '',
      room: timeSlots[0]?.room || '',
      totalClassesHeld: totalHeld,
      totalAttended: totalAttended,
      creditHours: credits,
      timeSlots: timeSlots.map(s => ({ ...s, room: s.room.trim() }))
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

          {/* Dynamic Slots */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
               <label className="text-xs font-bold text-white uppercase tracking-wider">Class Timings *</label>
               <button onClick={addSlot} className="text-[10px] bg-rf-cyan/20 text-rf-cyan px-2 py-1 rounded font-bold hover:bg-rf-cyan/30 transition-colors">+ Add Slot</button>
            </div>
            {timeSlots.map((slot, idx) => (
              <div key={idx} className="bg-rf-surface/50 border border-rf-cyan-dim/30 p-3 rounded-xl flex gap-2 items-center relative group">
                 <select 
                   value={slot.day} 
                   onChange={(e) => updateSlot(idx, 'day', e.target.value)}
                   className="h-10 px-2 bg-transparent border-b border-gray-700 text-sm font-bold text-white focus:border-rf-cyan outline-none"
                 >
                   {DAYS.map(d => <option key={d} value={d} className="bg-rf-surface">{d}</option>)}
                 </select>
                 <input 
                   type="text" 
                   value={slot.time} 
                   onChange={(e) => updateSlot(idx, 'time', e.target.value)}
                   placeholder="09:00 AM" 
                   className="h-10 flex-col flex-1 min-w-0 bg-transparent border-b border-gray-700 text-xs text-white focus:border-rf-cyan outline-none rf-number text-center"
                 />
                 <input 
                   type="text" 
                   value={slot.room} 
                   onChange={(e) => updateSlot(idx, 'room', e.target.value)}
                   placeholder="Room" 
                   className="h-10 flex-col flex-1 min-w-0 bg-transparent border-b border-gray-700 text-xs text-white focus:border-rf-cyan outline-none text-center"
                 />
                 {timeSlots.length > 1 && (
                   <button onClick={() => removeSlot(idx)} className="text-gray-500 hover:text-rf-red transition-colors ml-1 opacity-50 hover:opacity-100">
                     <span className="material-symbols-outlined text-[18px]">close</span>
                   </button>
                 )}
              </div>
            ))}
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
            disabled={!name.trim() || timeSlots.length === 0}
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
