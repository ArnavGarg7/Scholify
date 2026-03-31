import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CourseNote {
  id: string;
  courseId: string;
  content: string;
  updatedAt: string;
}

interface NotesState {
  notes: CourseNote[];
  getNoteByCourse: (courseId: string) => CourseNote | undefined;
  upsertNote: (courseId: string, content: string) => void;
  deleteNote: (courseId: string) => void;
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set, get) => ({
      notes: [],
      getNoteByCourse: (courseId) =>
        get().notes.find((n) => n.courseId === courseId),
      upsertNote: (courseId, content) =>
        set((state) => {
          const existing = state.notes.find((n) => n.courseId === courseId);
          if (existing) {
            return {
              notes: state.notes.map((n) =>
                n.courseId === courseId
                  ? { ...n, content, updatedAt: new Date().toISOString() }
                  : n
              ),
            };
          }
          return {
            notes: [
              ...state.notes,
              {
                id: crypto.randomUUID(),
                courseId,
                content,
                updatedAt: new Date().toISOString(),
              },
            ],
          };
        }),
      deleteNote: (courseId) =>
        set((state) => ({
          notes: state.notes.filter((n) => n.courseId !== courseId),
        })),
    }),
    { name: 'scholify-notes' }
  )
);
