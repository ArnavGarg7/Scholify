import { motion } from 'framer-motion';
import { useSettingsStore, SemesterRecord } from '../stores/settingsStore';
import { calculateCGPA } from '../utils/gradeUtils';
import { useState } from 'react';

export default function CgpaPlanner() {
  const { semesterHistory, addSemester, updateSemester, deleteSemester } = useSettingsStore();
  const [targetCgpa, setTargetCgpa] = useState(8.0);
  const [newName, setNewName] = useState('');
  const [newGpa, setNewGpa] = useState('');
  const [newCredits, setNewCredits] = useState('');

  const cgpa = calculateCGPA(semesterHistory);
  const totalCredits = semesterHistory.reduce((s, sem) => s + sem.credits, 0);

  // Calculate needed GPA for next semester to hit target
  const nextCredits = 20; // assume 20 credits
  const neededGpa = totalCredits > 0
    ? ((targetCgpa * (totalCredits + nextCredits) - cgpa * totalCredits) / nextCredits)
    : targetCgpa;

  const handleAdd = () => {
    if (!newName.trim() || !newGpa || !newCredits) return;
    addSemester({ name: newName.trim(), gpa: parseFloat(newGpa), credits: parseInt(newCredits) });
    setNewName('');
    setNewGpa('');
    setNewCredits('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      className="pt-4 pb-4 space-y-4"
    >
      <h1 className="text-2xl font-headline font-extrabold text-white tracking-tight">CGPA Planner</h1>

      {/* Current CGPA */}
      <div className="rf-card p-5 flex items-center justify-between">
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Current CGPA</p>
          <span className="text-4xl font-headline font-extrabold text-rf-cyan rf-number">
            {cgpa > 0 ? cgpa.toFixed(2) : '—'}
          </span>
          <p className="text-xs text-gray-500 mt-1">{totalCredits} total credits</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Target</p>
          <input
            type="number"
            step="0.1"
            min={0}
            max={10}
            value={targetCgpa}
            onChange={(e) => setTargetCgpa(parseFloat(e.target.value) || 0)}
            className="w-20 text-2xl font-headline font-bold text-rf-amber rf-number text-center bg-transparent border-b border-rf-amber/30 focus:border-rf-amber"
          />
        </div>
      </div>

      {/* Simulation */}
      {semesterHistory.length > 0 && (
        <div className="rf-card p-4">
          <h3 className="text-sm font-headline font-bold text-white mb-2 flex items-center gap-2">
            <span className="material-symbols-outlined text-rf-amber text-lg">calculate</span>
            Next Semester Projection
          </h3>
          <p className="text-xs text-gray-500 mb-3">
            To achieve <span className="text-rf-amber font-bold rf-number">{targetCgpa.toFixed(1)}</span> CGPA:
          </p>
          <div className="bg-rf-surface rounded-xl p-4 text-center">
            <p className="text-[10px] text-gray-500 mb-1">You need a minimum GPA of</p>
            <span className={`text-3xl font-headline font-black rf-number ${neededGpa > 10 ? 'text-rf-red' : neededGpa > 8 ? 'text-rf-amber' : 'text-rf-green'}`}>
              {neededGpa > 10 ? 'N/A' : neededGpa.toFixed(2)}
            </span>
            <p className="text-[10px] text-gray-600 mt-1">in next semester (~{nextCredits} credits)</p>
          </div>
        </div>
      )}

      {/* Semester History */}
      <div className="rf-card p-4">
        <h3 className="text-sm font-headline font-bold text-white mb-3">Semester History</h3>
        <div className="space-y-2">
          {semesterHistory.map((sem) => (
            <div key={sem.id} className="flex items-center justify-between py-2 border-b border-rf-cyan-dim/10 last:border-0">
              <div>
                <p className="text-xs font-medium text-white">{sem.name}</p>
                <p className="text-[9px] text-gray-600">{sem.credits} credits</p>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-lg font-headline font-bold text-rf-cyan rf-number">{sem.gpa.toFixed(2)}</span>
                <button onClick={() => deleteSemester(sem.id)} className="text-gray-600 hover:text-rf-red transition-colors">
                  <span className="material-symbols-outlined text-sm">delete</span>
                </button>
              </div>
            </div>
          ))}
          {semesterHistory.length === 0 && (
            <p className="text-xs text-gray-500 text-center py-4">No semesters added yet</p>
          )}
        </div>

        {/* Add Semester */}
        <div className="mt-4 pt-3 border-t border-rf-cyan-dim/20">
          <div className="grid grid-cols-3 gap-2 mb-2">
            <input
              type="text"
              placeholder="Sem Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="h-10 px-3 text-xs text-white rounded-lg"
            />
            <input
              type="number"
              step="0.1"
              placeholder="GPA"
              value={newGpa}
              onChange={(e) => setNewGpa(e.target.value)}
              className="h-10 px-3 text-xs text-white rounded-lg rf-number"
            />
            <input
              type="number"
              placeholder="Credits"
              value={newCredits}
              onChange={(e) => setNewCredits(e.target.value)}
              className="h-10 px-3 text-xs text-white rounded-lg rf-number"
            />
          </div>
          <button onClick={handleAdd} className="w-full rf-btn-primary h-10 rounded-lg text-xs flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-sm">add</span> Add Semester
          </button>
        </div>
      </div>
    </motion.div>
  );
}
