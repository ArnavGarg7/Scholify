import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface GradeComponent {
  id: string;
  courseId: string;
  name: string;
  category: string; // 'IA', 'Mid Semester', 'End Semester'
  weightage: number; // percentage of total (e.g., 15 for Quiz = 15% of IA's 50% = 7.5% total)
  maxMarks: number;
  obtainedMarks: number | null; // null = pending
}

interface GradesState {
  components: GradeComponent[];
  addComponent: (component: Omit<GradeComponent, 'id'>) => void;
  updateComponent: (id: string, updates: Partial<GradeComponent>) => void;
  deleteComponent: (id: string) => void;
  getComponentsByCourse: (courseId: string) => GradeComponent[];
  initDefaultComponents: (courseId: string) => void;
}

export const useGradesStore = create<GradesState>()(
  persist(
    (set, get) => ({
      components: [],
      addComponent: (component) =>
        set((state) => ({
          components: [
            ...state.components,
            { ...component, id: crypto.randomUUID() },
          ],
        })),
      updateComponent: (id, updates) =>
        set((state) => ({
          components: state.components.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })),
      deleteComponent: (id) =>
        set((state) => ({
          components: state.components.filter((c) => c.id !== id),
        })),
      getComponentsByCourse: (courseId) =>
        get().components.filter((c) => c.courseId === courseId),
      initDefaultComponents: (courseId) => {
        const existing = get().components.filter((c) => c.courseId === courseId);
        if (existing.length > 0) return;

        const defaults: Omit<GradeComponent, 'id'>[] = [
          { courseId, name: 'Quiz 1', category: 'Internal Assessment', weightage: 7.5, maxMarks: 100, obtainedMarks: null },
          { courseId, name: 'Quiz 2', category: 'Internal Assessment', weightage: 7.5, maxMarks: 100, obtainedMarks: null },
          { courseId, name: 'Class Test 1', category: 'Internal Assessment', weightage: 7.5, maxMarks: 100, obtainedMarks: null },
          { courseId, name: 'Class Test 2', category: 'Internal Assessment', weightage: 7.5, maxMarks: 100, obtainedMarks: null },
          { courseId, name: 'Assignment 1', category: 'Internal Assessment', weightage: 10, maxMarks: 100, obtainedMarks: null },
          { courseId, name: 'Assignment 2', category: 'Internal Assessment', weightage: 10, maxMarks: 100, obtainedMarks: null },
          { courseId, name: 'Mid Semester', category: 'Mid Semester', weightage: 20, maxMarks: 100, obtainedMarks: null },
          { courseId, name: 'End Semester', category: 'End Semester', weightage: 30, maxMarks: 100, obtainedMarks: null },
        ];

        set((state) => ({
          components: [
            ...state.components,
            ...defaults.map((d) => ({ ...d, id: crypto.randomUUID() })),
          ],
        }));
      },
    }),
    { name: 'scholify-grades' }
  )
);
