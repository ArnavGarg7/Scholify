import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCoursesStore } from '../stores/coursesStore';
import { useGradesStore, GradeComponent } from '../stores/gradesStore';
import { useGradeCalc, calculateWhatIf, calculateTargets } from '../hooks/useGradeCalc';
import { getGradeColor } from '../utils/gradeUtils';
import { useSettingsStore } from '../stores/settingsStore';
import { useState, useMemo } from 'react';

export default function GradeDetail() {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const course = useCoursesStore((s) => s.courses.find((c) => c.id === courseId));
  const updateComponent = useGradesStore((s) => s.updateComponent);
  const deleteComponent = useGradesStore((s) => s.deleteComponent);
  const addComponent = useGradesStore((s) => s.addComponent);
  const initDefaults = useGradesStore((s) => s.initDefaultComponents);
  const scheme = useSettingsStore((s) => s.gradingScheme);
  const calc = useGradeCalc(courseId || '');
  const [whatIfOverrides, setWhatIfOverrides] = useState<Map<string, number>>(new Map());
  const [editingComponent, setEditingComponent] = useState<GradeComponent | 'new' | null>(null);
  // Inline mark editing: tracks which entered component is being re-edited
  const [inlineEditId, setInlineEditId] = useState<string | null>(null);
  const [inlineEditValue, setInlineEditValue] = useState<string>('');

  if (!course) {
    return (
      <div className="pt-6 text-center">
        <p className="text-gray-400">Course not found</p>
        <button onClick={() => navigate('/grades')} className="text-rf-cyan text-sm mt-2">Go back</button>
      </div>
    );
  }

  if (calc.components.length === 0) {
    initDefaults(course.id);
  }

  const whatIfResult = useMemo(
    () => calculateWhatIf(calc.components, whatIfOverrides, scheme),
    [calc.components, whatIfOverrides, scheme]
  );

  const targets = useMemo(
    () => calculateTargets(calc.components, scheme),
    [calc.components, scheme]
  );

  const pending = calc.components.filter((c) => c.obtainedMarks === null);
  const entered = calc.components.filter((c) => c.obtainedMarks !== null);
  const color = getGradeColor(calc.currentGrade);

  const handleMarksUpdate = (compId: string, marks: number) => {
    updateComponent(compId, { obtainedMarks: marks });
  };

  const handleWhatIfChange = (compId: string, value: number) => {
    setWhatIfOverrides((prev) => {
      const next = new Map(prev);
      next.set(compId, value);
      return next;
    });
  };

  return (
    <div
      className="pt-4 pb-4 space-y-4 animate-fade-in"
    >
      {/* Back + Header */}
      <div className="flex items-center gap-2">
        <button onClick={() => navigate('/grades')} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-rf-surface transition-colors">
          <span className="material-symbols-outlined text-gray-400">arrow_back</span>
        </button>
      </div>

      <section>
        <h1 className="text-2xl font-extrabold text-white tracking-tight">{course.name}</h1>
        <p className="text-xs text-gray-500 mt-1">{course.code} • UPES Examination Scheme</p>
      </section>

      {/* Current Grade Card */}
      <div className="rf-card p-5 flex items-center justify-between">
        <div>
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Current Grade</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-4xl font-headline font-extrabold rf-number" style={{ color }}>
              {calc.currentGrade}
            </span>
            <span className="text-lg text-gray-400 rf-number">{calc.currentPoints.toFixed(1)} pts</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Weighted score: <span className="rf-number text-white">{calc.totalWeightedScore.toFixed(1)}%</span>
            {calc.pendingWeight > 0 && (
              <span className="text-gray-600"> • {calc.pendingWeight}% pending</span>
            )}
          </p>
        </div>
        <div className="w-16 h-16 rounded-full border-4 flex items-center justify-center" style={{ borderColor: `${color}40` }}>
          <span className="text-xl font-headline font-black rf-number" style={{ color }}>
            {calc.totalWeightedScore.toFixed(0)}
          </span>
        </div>
      </div>

      {/* Component Breakdown */}
      <div className="rf-card p-4">
        <div className="flex items-center justify-between mb-3 border-b border-rf-cyan-dim/20 pb-2">
          <h3 className="text-sm font-headline font-bold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-rf-cyan text-lg">analytics</span>
            Component Breakdown
          </h3>
        </div>
        
        <div className="space-y-3">
          {calc.components.map((comp) => (
            <div key={comp.id} className="flex flex-col py-2 border-b border-rf-cyan-dim/10 last:border-0 relative group">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium text-white shadow-sm">{comp.name}</p>
                    <button 
                      onClick={() => setEditingComponent(comp)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-rf-cyan hover:text-white"
                    >
                      <span className="material-symbols-outlined text-[14px]">edit</span>
                    </button>
                    <button 
                      onClick={() => {
                        if (confirm(`Delete ${comp.name}?`)) deleteComponent(comp.id);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-rf-red hover:text-white"
                    >
                      <span className="material-symbols-outlined text-[14px]">delete</span>
                    </button>
                  </div>
                  <p className="text-[10px] text-gray-500 mt-0.5">{comp.category} • {comp.weightage}% weight</p>
                </div>
                
                <div className="flex items-center gap-2">
                  {comp.obtainedMarks !== null && inlineEditId !== comp.id ? (
                    // Tappable chip — click to edit the entered mark
                    <button
                      onClick={() => { setInlineEditId(comp.id); setInlineEditValue(String(comp.obtainedMarks)); }}
                      title="Tap to update mark"
                      className="flex items-center gap-1.5 group/chip px-2 py-1 rounded-lg hover:bg-rf-surface transition-colors border border-transparent hover:border-rf-cyan-dim/30"
                    >
                      <span className="text-lg font-bold text-white rf-number leading-none">
                        {comp.obtainedMarks}
                        <span className="text-[10px] text-gray-500 font-normal">/{comp.maxMarks}</span>
                      </span>
                      <span className="material-symbols-outlined text-[13px] text-gray-600 group-hover/chip:text-rf-cyan transition-colors">edit</span>
                    </button>
                  ) : inlineEditId === comp.id ? (
                    // Inline edit mode
                    <div className="flex items-center gap-1">
                      <input
                        autoFocus
                        type="number"
                        min={0}
                        max={comp.maxMarks}
                        value={inlineEditValue}
                        onChange={(e) => setInlineEditValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const val = parseFloat(inlineEditValue);
                            if (!isNaN(val)) handleMarksUpdate(comp.id, Math.min(val, comp.maxMarks));
                            setInlineEditId(null);
                          }
                          if (e.key === 'Escape') setInlineEditId(null);
                        }}
                        onBlur={() => {
                          const val = parseFloat(inlineEditValue);
                          if (!isNaN(val)) handleMarksUpdate(comp.id, Math.min(val, comp.maxMarks));
                          setInlineEditId(null);
                        }}
                        className="w-16 h-8 px-2 text-xs text-center text-white rounded-lg rf-number bg-rf-surface border border-rf-cyan focus:outline-none transition-colors"
                      />
                      <span className="text-[10px] text-gray-500">/{comp.maxMarks}</span>
                    </div>
                  ) : (
                    // No marks entered yet
                    <input
                      type="number"
                      min={0}
                      max={comp.maxMarks}
                      placeholder="—"
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        if (!isNaN(val)) handleMarksUpdate(comp.id, val);
                      }}
                      className="w-16 h-8 px-2 text-xs text-center text-white rounded-lg rf-number bg-rf-surface border border-rf-cyan-dim focus:border-rf-cyan outline-none transition-colors"
                    />
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* What-If Simulator */}
      {pending.length > 0 && (
        <div className="rf-card p-4">
          <h3 className="text-sm font-headline font-bold text-white mb-1 flex items-center gap-2">
            <span className="material-symbols-outlined text-rf-amber text-lg">tune</span>
            What-If Simulator
          </h3>
          <p className="text-[10px] text-gray-500 mb-4">Drag sliders to simulate different scores</p>

          {/* Projected result */}
          <div className="bg-rf-surface rounded-xl p-3 mb-4 flex items-center justify-between">
            <span className="text-xs text-gray-400">Projected Grade:</span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-headline font-bold rf-number" style={{ color: getGradeColor(whatIfResult.grade) }}>
                {whatIfResult.grade}
              </span>
              <span className="text-xs text-gray-500 rf-number">{whatIfResult.percentage.toFixed(1)}%</span>
            </div>
          </div>

          <div className="space-y-3">
            {pending.map((comp) => {
              const value = whatIfOverrides.get(comp.id) ?? Math.round(comp.maxMarks * 0.7);
              return (
                <div key={comp.id}>
                  <div className="flex justify-between text-[10px] mb-1">
                    <span className="text-gray-400">{comp.name}</span>
                    <span className="text-white font-bold rf-number">{value}/{comp.maxMarks}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={comp.maxMarks}
                    value={value}
                    onChange={(e) => handleWhatIfChange(comp.id, parseInt(e.target.value))}
                    className="w-full h-1.5 bg-rf-surface rounded-full appearance-none cursor-pointer accent-rf-cyan"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Grade Targets */}
      {pending.length > 0 && (
        <div className="rf-card p-4">
          <h3 className="text-sm font-headline font-bold text-white mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined text-rf-green text-lg">flag</span>
            Grade Targets
          </h3>
          <p className="text-[10px] text-gray-500 mb-3">Minimum marks needed in pending components to achieve each grade</p>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-gray-500 border-b border-rf-cyan-dim/20">
                  <th className="text-left py-2 font-medium">Grade</th>
                  {pending.map((comp) => (
                    <th key={comp.id} className="text-center py-2 font-medium whitespace-nowrap px-1">
                      {comp.name.length > 8 ? comp.name.substring(0, 8) + '..' : comp.name}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {scheme.grades
                  .filter((g) => g.points > 0)
                  .map((grade) => {
                    const gradeTargets = targets.get(grade.grade);
                    return (
                      <tr key={grade.grade} className="border-b border-rf-cyan-dim/10">
                        <td className="py-2 font-bold rf-number" style={{ color: getGradeColor(grade.grade) }}>
                          {grade.grade}
                        </td>
                        {pending.map((comp) => {
                          const needed = gradeTargets?.get(comp.id) ?? 0;
                          const impossible = needed > comp.maxMarks;
                          return (
                            <td
                              key={comp.id}
                              className={`text-center py-2 rf-number ${impossible ? 'text-gray-600 line-through' : 'text-white'}`}
                            >
                              {impossible ? '—' : needed}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* Component Editor Modal */}
      {editingComponent && (
        <GradeComponentEditor 
          courseId={course.id}
          initialData={editingComponent === 'new' ? null : editingComponent}
          onClose={() => setEditingComponent(null)}
          onSave={(data) => {
            if (editingComponent === 'new') {
              addComponent(data);
            } else {
              updateComponent(editingComponent.id, data);
            }
            setEditingComponent(null);
          }}
        />
      )}

      {/* FAB */}
      <button onClick={() => setEditingComponent('new')} className="rf-fab">
        <span className="material-symbols-outlined text-2xl">add</span>
      </button>

    </div>
  );
}

function GradeComponentEditor({ 
  courseId,
  initialData, 
  onClose, 
  onSave 
}: { 
  courseId: string;
  initialData: GradeComponent | null; 
  onClose: () => void; 
  onSave: (data: Omit<GradeComponent, 'id'>) => void; 
}) {
  const [name, setName] = useState(initialData?.name || '');
  const [maxMarks, setMaxMarks] = useState(initialData?.maxMarks || 100);
  const [weightage, setWeightage] = useState(initialData?.weightage || 10);
  const [obtainedMarks, setObtainedMarks] = useState<string>(
    initialData?.obtainedMarks !== null && initialData?.obtainedMarks !== undefined
      ? String(initialData.obtainedMarks)
      : ''
  );

  const totalWeightStr = 
    useGradesStore.getState().components
      .filter(c => c.courseId === courseId && c.id !== initialData?.id)
      .reduce((sum, c) => sum + c.weightage, 0) + weightage;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 sm:p-0">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="bg-rf-base rf-card w-full sm:w-[400px] p-6 relative z-10 animate-slide-up sm:animate-fade-in border border-rf-cyan-dim/40 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6 border-b border-rf-cyan-dim/20 pb-4">
          <h2 className="text-xl font-headline font-extrabold text-white">
            {initialData ? 'Edit Component' : 'New Component'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors bg-rf-surface p-1.5 rounded-full">
            <span className="material-symbols-outlined text-sm">close</span>
          </button>
        </div>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider ml-1">Component Name</label>
            <input 
              value={name} onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Lab File" autoFocus
              className="w-full bg-rf-surface border border-rf-cyan-dim rounded-xl px-4 py-3 text-sm text-white focus:border-rf-cyan outline-none transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider ml-1">Max Marks</label>
              <input 
                type="number" value={maxMarks} onChange={(e) => setMaxMarks(Number(e.target.value))}
                className="w-full bg-rf-surface border border-rf-cyan-dim rounded-xl px-4 py-3 text-sm text-white focus:border-rf-cyan outline-none transition-colors rf-number"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider ml-1 flex justify-between">
                Weightage %
                <span className={totalWeightStr > 100 ? 'text-rf-red' : 'text-gray-500'}>
                  {totalWeightStr}/100%
                </span>
              </label>
              <input 
                type="number" value={weightage} onChange={(e) => setWeightage(Number(e.target.value))}
                className="w-full bg-rf-surface border border-rf-cyan-dim rounded-xl px-4 py-3 text-sm text-white focus:border-rf-cyan outline-none transition-colors rf-number"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-gray-400 font-bold uppercase tracking-wider ml-1">
              Obtained Marks <span className="text-gray-600 normal-case font-normal">(leave blank if not yet received)</span>
            </label>
            <input
              type="number"
              min={0}
              max={maxMarks}
              value={obtainedMarks}
              onChange={(e) => setObtainedMarks(e.target.value)}
              placeholder="e.g. 78"
              className="w-full bg-rf-surface border border-rf-cyan-dim rounded-xl px-4 py-3 text-sm text-white focus:border-rf-cyan outline-none transition-colors rf-number"
            />
          </div>

          <button
            onClick={() => {
              const parsed = parseFloat(obtainedMarks);
              onSave({
                courseId,
                name: name || 'Untitled',
                category: 'Custom Assessment',
                maxMarks,
                weightage,
                obtainedMarks: obtainedMarks.trim() !== '' && !isNaN(parsed) ? Math.min(parsed, maxMarks) : null,
              });
            }}
            disabled={!name.trim()}
            className="w-full rf-btn-primary py-3 rounded-xl mt-4 font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save Component
          </button>
        </div>
      </div>
    </div>
  );
}
