import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface TimeSlot {
  time: string; // '09:00 AM'
  room: string;
  day: string;  // 'Mon'
}

export interface Course {
  id: string;
  name: string;
  code: string;
  scheduleDays: string[]; // ['Mon', 'Wed', 'Fri']
  time: string; // Primary time '09:00 AM' (first slot)
  room: string; // Primary room
  timeSlots: TimeSlot[]; // Multiple time slots for the same course
  semesterStartDate: string; // ISO date
  totalClassesHeld: number;
  totalAttended: number;
  attendanceThreshold: number; // default 75
  creditHours: number;
  color: string; // HSL color for visual coding
}

// Auto-generate distinct colors
const COURSE_COLORS = [
  'hsl(190, 100%, 50%)',  // Cyan
  'hsl(280, 80%, 65%)',   // Purple
  'hsl(340, 85%, 60%)',   // Pink
  'hsl(45, 100%, 55%)',   // Gold
  'hsl(150, 80%, 50%)',   // Emerald
  'hsl(210, 90%, 60%)',   // Blue
  'hsl(15, 90%, 60%)',    // Orange
  'hsl(100, 70%, 50%)',   // Lime
  'hsl(320, 75%, 55%)',   // Magenta
  'hsl(170, 85%, 45%)',   // Teal
];

interface CoursesState {
  courses: Course[];
  addCourse: (course: Omit<Course, 'id' | 'color' | 'timeSlots'> & { timeSlots?: TimeSlot[] }) => void;
  updateCourse: (id: string, updates: Partial<Course>) => void;
  deleteCourse: (id: string) => void;
  getCourse: (id: string) => Course | undefined;
}

export const useCoursesStore = create<CoursesState>()(
  persist(
    (set, get) => ({
      courses: [],
      addCourse: (course) =>
        set((state) => {
          const colorIndex = state.courses.length % COURSE_COLORS.length;
          const timeSlots = course.timeSlots || [
            { time: course.time, room: course.room, day: course.scheduleDays[0] || 'Mon' },
          ];
          return {
            courses: [
              ...state.courses,
              {
                ...course,
                id: crypto.randomUUID(),
                color: COURSE_COLORS[colorIndex],
                timeSlots,
              },
            ],
          };
        }),
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
