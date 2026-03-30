import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Priority = 'high' | 'medium' | 'low';

export interface Assignment {
  id: string;
  courseId: string;
  courseName: string;
  title: string;
  dueDate: string; // ISO date
  priority: Priority;
  notes: string;
  completed: boolean;
  completedAt: string | null;
}

interface AssignmentsState {
  assignments: Assignment[];
  addAssignment: (assignment: Omit<Assignment, 'id' | 'completed' | 'completedAt'>) => void;
  updateAssignment: (id: string, updates: Partial<Assignment>) => void;
  deleteAssignment: (id: string) => void;
  toggleComplete: (id: string) => void;
  getActiveAssignments: () => Assignment[];
  getCompletedAssignments: () => Assignment[];
  getAssignmentsByCourse: (courseId: string) => Assignment[];
}

export const useAssignmentsStore = create<AssignmentsState>()(
  persist(
    (set, get) => ({
      assignments: [],
      addAssignment: (assignment) =>
        set((state) => ({
          assignments: [
            ...state.assignments,
            {
              ...assignment,
              id: crypto.randomUUID(),
              completed: false,
              completedAt: null,
            },
          ],
        })),
      updateAssignment: (id, updates) =>
        set((state) => ({
          assignments: state.assignments.map((a) =>
            a.id === id ? { ...a, ...updates } : a
          ),
        })),
      deleteAssignment: (id) =>
        set((state) => ({
          assignments: state.assignments.filter((a) => a.id !== id),
        })),
      toggleComplete: (id) =>
        set((state) => ({
          assignments: state.assignments.map((a) =>
            a.id === id
              ? {
                  ...a,
                  completed: !a.completed,
                  completedAt: !a.completed ? new Date().toISOString() : null,
                }
              : a
          ),
        })),
      getActiveAssignments: () =>
        get()
          .assignments.filter((a) => !a.completed)
          .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
      getCompletedAssignments: () =>
        get().assignments.filter((a) => a.completed),
      getAssignmentsByCourse: (courseId) =>
        get().assignments.filter((a) => a.courseId === courseId),
    }),
    { name: 'scholify-assignments' }
  )
);
