import { motion } from 'framer-motion';
import { useSettingsStore, SemesterRecord } from '../stores/settingsStore';
import { useCoursesStore } from '../stores/coursesStore';
import { useGradesStore } from '../stores/gradesStore';
import { calculateCGPA } from '../utils/gradeUtils';
import { useState } from 'react';

export default function CgpaPlanner() {
  const { semesterHistory, addSemester, deleteSemester } = useSettingsStore();
  const courses = useCoursesStore((s) => s.courses);
  const [targetCgpa, setTargetCgpa] = useState(8.0);
  const [newName, setNewName] = useState('');
  const [newGpa, setNewGpa] = useState('');
  const [newCredits, setNewCredits] = useState('');

  // What-if simulator
  const [whatIfCourse, setWhatIfCourse] = useState(courses[0]?.id || '');
  const [whatIfGrade, setWhatIfGrade] = useState('');

  const cgpa = calculateCGPA(semesterHistory);
  const totalCredits = semesterHistory.reduce((s, sem) => s + sem.credits, 0);

  const nextCredits = 20;
  const neededGpa = totalCredits > 0
    ? ((targetCgpa * (totalCredits + nextCredits) - cgpa * totalCredits) / nextCredits)
    : targetCgpa;

  // GPA trend data for chart
  const chartData = semesterHistory.map((sem, idx) => {
    const cumGpa = calculateCGPA(semesterHistory.slice(0, idx + 1));
    return { name: sem.name, gpa: sem.gpa, cgpa: cumGpa };
  });
  const maxGpa = Math.max(10, ...chartData.map((d) => d.gpa));

  // What-if calculation
  const whatIfResult = whatIfGrade && whatIfCourse ? (() => {
    const gradeVal = parseFloat(whatIfGrade);
    const course = courses.find((c) => c.id === whatIfCourse);
    if (!course || isNaN(gradeVal)) return null;
    const newTotalCredits = totalCredits + course.creditHours;
    const newCgpa = (cgpa * totalCredits + gradeVal * course.creditHours) / newTotalCredits;
    return { newCgpa, change: newCgpa - cgpa, courseName: course.name };
  })() : null;

  const handleAdd = () => {
    if (!newName.trim() || !newGpa || !newCredits) return;
    addSemester({ name: newName.trim(), gpa: parseFloat(newGpa), credits: parseInt(newCredits) });
    setNewName(''); setNewGpa(''); setNewCredits('');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }} className="pt-4 pb-4 space-y-4"
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
            type="number" step="0.1" min={0} max={10} value={targetCgpa}
            onChange={(e) => setTargetCgpa(parseFloat(e.target.value) || 0)}
            className="w-20 text-2xl font-headline font-bold text-rf-amber rf-number text-center bg-transparent border-b border-rf-amber/30 focus:border-rf-amber"
          />
        </div>
      </div>

      {/* GPA Trend Chart */}
      {chartData.length > 1 && (
        <div className="rf-card p-4">
          <h3 className="text-sm font-headline font-bold text-white mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-rf-cyan text-lg">trending_up</span>
            GPA Trend
          </h3>
          <div className="relative h-32">
            <svg className="w-full h-full" viewBox={`0 0 ${chartData.length * 80} 120`} preserveAspectRatio="none">
              {/* CGPA line */}
              <polyline
                fill="none" stroke="#00D4FF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                points={chartData.map((d, i) => `${i * 80 + 40},${120 - (d.cgpa / maxGpa) * 110}`).join(' ')}
              />
              {/* Semester GPA bars */}
              {chartData.map((d, i) => (
                <g key={i}>
                  <rect
                    x={i * 80 + 25} y={120 - (d.gpa / maxGpa) * 110}
                    width="30" height={(d.gpa / maxGpa) * 110}
                    fill="rgba(0,212,255,0.15)" rx="4"
                  />
                  <circle cx={i * 80 + 40} cy={120 - (d.cgpa / maxGpa) * 110} r="4" fill="#00D4FF" />
                  <text x={i * 80 + 40} y={115} textAnchor="middle" fill="#666" fontSize="8" fontFamily="monospace">
                    {d.name.slice(0, 6)}
                  </text>
                </g>
              ))}
            </svg>
          </div>
          <div className="flex items-center gap-4 mt-2">
            <div className="flex items-center gap-1"><div className="w-3 h-1.5 bg-rf-cyan/20 rounded" /><span className="text-[9px] text-gray-500">Semester GPA</span></div>
            <div className="flex items-center gap-1"><div className="w-3 h-0.5 bg-rf-cyan rounded" /><span className="text-[9px] text-gray-500">Cumulative CGPA</span></div>
          </div>
        </div>
      )}

      {/* What-If Simulator */}
      {courses.length > 0 && (
        <div className="rf-card p-4">
          <h3 className="text-sm font-headline font-bold text-white mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-rf-amber text-lg">science</span>
            What-If Simulator
          </h3>
          <p className="text-xs text-gray-500 mb-3">See how a grade in a course affects your CGPA</p>
          <div className="grid grid-cols-2 gap-2 mb-3">
            <select value={whatIfCourse} onChange={(e) => setWhatIfCourse(e.target.value)} className="h-10 px-3 text-sm text-white rounded-xl">
              {courses.map((c) => <option key={c.id} value={c.id} className="bg-rf-card">{c.name}</option>)}
            </select>
            <input type="number" step="0.1" min={0} max={10} placeholder="Grade (0-10)"
              value={whatIfGrade} onChange={(e) => setWhatIfGrade(e.target.value)}
              className="h-10 px-3 text-sm text-white rounded-xl rf-number"
            />
          </div>
          {whatIfResult && (
            <div className="bg-rf-surface rounded-xl p-4 text-center animate-fade-in">
              <p className="text-[10px] text-gray-500 mb-1">If you score {whatIfGrade} in {whatIfResult.courseName}:</p>
              <span className={`text-3xl font-headline font-black rf-number ${
                whatIfResult.change >= 0 ? 'text-rf-green' : 'text-rf-red'
              }`}>
                {whatIfResult.newCgpa.toFixed(2)}
              </span>
              <p className={`text-xs font-bold mt-1 ${whatIfResult.change >= 0 ? 'text-rf-green' : 'text-rf-red'}`}>
                {whatIfResult.change >= 0 ? '▲' : '▼'} {Math.abs(whatIfResult.change).toFixed(3)}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Projection */}
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
            <input type="text" placeholder="Sem Name" value={newName} onChange={(e) => setNewName(e.target.value)} className="h-10 px-3 text-xs text-white rounded-lg" />
            <input type="number" step="0.1" placeholder="GPA" value={newGpa} onChange={(e) => setNewGpa(e.target.value)} className="h-10 px-3 text-xs text-white rounded-lg rf-number" />
            <input type="number" placeholder="Credits" value={newCredits} onChange={(e) => setNewCredits(e.target.value)} className="h-10 px-3 text-xs text-white rounded-lg rf-number" />
          </div>
          <button onClick={handleAdd} className="w-full rf-btn-primary h-10 rounded-lg text-xs flex items-center justify-center gap-1">
            <span className="material-symbols-outlined text-sm">add</span> Add Semester
          </button>
        </div>
      </div>
    </motion.div>
  );
}
