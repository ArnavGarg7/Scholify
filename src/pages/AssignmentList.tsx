import { useAssignmentsStore, Priority } from '../stores/assignmentsStore';
import { useCoursesStore } from '../stores/coursesStore';
import { daysUntil } from '../utils/dateUtils';
import { getDaysColor } from '../constants/theme';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import AddAssignmentModal from '../components/ui/AddAssignmentModal';

export default function AssignmentList() {
  const allAssignments = useAssignmentsStore((s) => s.assignments);
  const toggleComplete = useAssignmentsStore((s) => s.toggleComplete);
  const [showAdd, setShowAdd] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);

  const activeAssignments = useMemo(() =>
    allAssignments.filter((a) => !a.completed).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
    [allAssignments]
  );
  const completedAssignments = useMemo(() =>
    allAssignments.filter((a) => a.completed),
    [allAssignments]
  );

  const overdue = activeAssignments.filter((a) => daysUntil(a.dueDate) < 0);
  const upcoming = activeAssignments.filter((a) => daysUntil(a.dueDate) >= 0);

  const borderColor = (priority: Priority) => {
    switch (priority) {
      case 'high': return 'border-l-rf-red';
      case 'medium': return 'border-l-rf-amber';
      case 'low': return 'border-l-rf-green';
    }
  };

  const priorityBadge = (priority: Priority) => {
    const config = {
      high: { label: 'HIGH PRIORITY', cls: 'bg-rf-red/15 text-rf-red border-rf-red/30' },
      medium: { label: 'MEDIUM', cls: 'bg-rf-amber/15 text-rf-amber border-rf-amber/30' },
      low: { label: 'LOW', cls: 'bg-rf-green/15 text-rf-green border-rf-green/30' },
    }[priority];
    return (
      <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${config.cls}`}>
        {config.label}
      </span>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }} className="pt-4 pb-4 animate-fade-in"
    >
      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="rf-card p-3 text-center">
          <span className="text-2xl font-headline font-black text-rf-cyan rf-number">{allAssignments.length}</span>
          <p className="text-[9px] text-gray-500 mt-0.5">Total</p>
        </div>
        <div className="rf-card p-3 text-center">
          <span className="text-2xl font-headline font-black text-rf-green rf-number">{completedAssignments.length}</span>
          <p className="text-[9px] text-gray-500 mt-0.5">Completed</p>
        </div>
        <div className="rf-card p-3 text-center">
          <span className="text-2xl font-headline font-black text-rf-red rf-number">{overdue.length}</span>
          <p className="text-[9px] text-gray-500 mt-0.5">Overdue</p>
        </div>
      </div>

      {/* Completion Bar */}
      {allAssignments.length > 0 && (
        <div className="rf-card p-3 mb-6">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] text-gray-500">Completion Rate</span>
            <span className="text-xs font-bold text-rf-cyan rf-number">
              {Math.round((completedAssignments.length / allAssignments.length) * 100)}%
            </span>
          </div>
          <div className="w-full h-2 bg-rf-surface rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-rf-cyan to-rf-green rounded-full transition-all duration-500"
              style={{ width: `${(completedAssignments.length / allAssignments.length) * 100}%` }} />
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex items-end justify-between mb-6">
        <div>
          <h1 className="text-2xl font-headline font-extrabold text-white tracking-tight">
            Assignment Feed
          </h1>
          <p className="text-gray-500 font-medium text-sm mt-0.5">
            {activeAssignments.length > 0
              ? `You have ${activeAssignments.length} pending tasks`
              : 'All caught up!'}
          </p>
        </div>
        <button
          onClick={() => setShowCompleted(!showCompleted)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-rf-surface rounded-full text-gray-400 font-semibold text-xs border border-rf-cyan-dim"
        >
          <span className="material-symbols-outlined text-[14px]">filter_list</span>
          {showCompleted ? 'Active' : `Pending (${activeAssignments.length})`}
        </button>
      </div>

      {/* Assignment Cards */}
      <div className="space-y-3">
        {/* Overdue Section */}
        {overdue.length > 0 && !showCompleted && (
          <>
            <div className="flex items-center gap-2 mb-1">
              <span className="material-symbols-outlined text-rf-red text-sm">schedule</span>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rf-red">Overdue</span>
            </div>
            {overdue.map((a) => (
              <AssignmentCard
                key={a.id}
                assignment={a}
                borderColor={borderColor(a.priority)}
                priorityBadge={priorityBadge(a.priority)}
                onToggle={() => toggleComplete(a.id)}
                isOverdue
              />
            ))}
            <div className="border-t border-rf-cyan-dim/10 my-2" />
          </>
        )}

        {/* Active/Completed */}
        {(showCompleted ? completedAssignments : upcoming).length === 0 ? (
          <div className="rf-card p-8 text-center">
            <span className="material-symbols-outlined text-gray-600 text-4xl mb-3 block">
              {showCompleted ? 'inventory_2' : 'assignment'}
            </span>
            <p className="text-sm text-gray-400 mb-4">
              {showCompleted ? 'No completed assignments' : 'No pending assignments'}
            </p>
            {!showCompleted && (
              <button
                onClick={() => setShowAdd(true)}
                className="rf-btn-primary px-6 py-2.5 text-sm rounded-full"
              >
                Add Assignment
              </button>
            )}
          </div>
        ) : (
          (showCompleted ? completedAssignments : upcoming).map((a) => (
            <AssignmentCard
              key={a.id}
              assignment={a}
              borderColor={borderColor(a.priority)}
              priorityBadge={priorityBadge(a.priority)}
              onToggle={() => toggleComplete(a.id)}
              isOverdue={false}
            />
          ))
        )}
      </div>

      {/* FAB */}
      <button onClick={() => setShowAdd(true)} className="rf-fab">
        <span className="material-symbols-outlined text-2xl">add</span>
      </button>

      {showAdd && <AddAssignmentModal onClose={() => setShowAdd(false)} />}
    </motion.div>
  );
}

function AssignmentCard({
  assignment,
  borderColor,
  priorityBadge,
  onToggle,
  isOverdue,
}: {
  assignment: ReturnType<typeof useAssignmentsStore.getState>['assignments'][0];
  borderColor: string;
  priorityBadge: React.ReactNode;
  onToggle: () => void;
  isOverdue: boolean;
}) {
  const days = daysUntil(assignment.dueDate);
  const daysText = isOverdue
    ? `${Math.abs(days)} days overdue`
    : days === 0
    ? 'Due today'
    : days === 1
    ? '1 day left'
    : `${days} days left`;
  const daysColor = getDaysColor(days);
  const dueStr = new Date(assignment.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });

  return (
    <div className={`rf-card p-4 flex flex-col gap-3 border-l-4 ${borderColor} ${assignment.completed ? 'opacity-50' : ''}`}>
      <div className="flex justify-between items-start">
        <div className="space-y-0.5 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[9px] font-bold tracking-widest uppercase text-gray-500">
              {assignment.courseName}
            </span>
            {priorityBadge}
          </div>
          <h3 className={`text-base font-bold text-white ${assignment.completed ? 'line-through' : ''}`}>
            {assignment.title}
          </h3>
        </div>
        <div
          className="px-2.5 py-0.5 rounded-full text-[10px] font-bold whitespace-nowrap"
          style={{ backgroundColor: `${daysColor}15`, color: daysColor }}
        >
          {daysText}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-gray-500 text-xs font-medium">
          <span className="material-symbols-outlined text-[14px]">calendar_today</span>
          Due {dueStr}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-all ${
            assignment.completed
              ? 'bg-rf-green/15 text-rf-green'
              : 'bg-rf-surface text-gray-400 hover:text-rf-green hover:bg-rf-green/10 border border-rf-cyan-dim'
          }`}
        >
          {assignment.completed ? '✓ Done' : 'Mark Done'}
        </button>
      </div>
    </div>
  );
}
