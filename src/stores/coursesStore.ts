import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Course {
  id: string;
  name: string;
  code: string;
  scheduleDays: string[]; // ['Mon', 'Wed', 'Fri']
  time: string; // '09:00 AM'
  room: string;
  semesterStartDate: string; // ISO date
  totalClassesHeld: number;
  totalAttended: number;
  attendanceThreshold: number; // default 75
  creditHours: number;
}

interface CoursesState {
  courses: Course[];
  addCourse: (course: Omit<Course, 'id'>) => void;
  updateCourse: (id: string, updates: Partial<Course>) => void;
  deleteCourse: (id: string) => void;
  getCourse: (id: string) => Course | undefined;
}

export const useCoursesStore = create<CoursesState>()(
  persist(
    (set, get) => ({
      courses: [],
      addCourse: (course) =>
        set((state) => ({
          courses: [
            ...state.courses,
            { ...course, id: crypto.randomUUID() },
          ],
        })),
      updateCourse: (id, updates) =>
        set((state) => ({
          courses: state.courses.map((c) =>
            c.id === id ? { ...c, ...updates } : c
          ),
        })),
      deleteCourse: (id) =>
        set((state) => ({
          courses: state.courses.filter((c) => c.id !== id),
        })),
      getCourse: (id) => get().courses.find((c) => c.id === id),
    }),
    { name: 'scholify-courses' }
  )
);
