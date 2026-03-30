import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type AttendanceStatus = 'present' | 'absent' | 'late';

export interface AttendanceRecord {
  id: string;
  courseId: string;
  date: string; // ISO date string (YYYY-MM-DD)
  status: AttendanceStatus;
}

interface AttendanceState {
  records: AttendanceRecord[];
  markAttendance: (courseId: string, date: string, status: AttendanceStatus) => void;
  getRecordsByCourse: (courseId: string) => AttendanceRecord[];
  getRecordsByDate: (date: string) => AttendanceRecord[];
  getRecord: (courseId: string, date: string) => AttendanceRecord | undefined;
  deleteRecord: (id: string) => void;
}

export const useAttendanceStore = create<AttendanceState>()(
  persist(
    (set, get) => ({
      records: [],
      markAttendance: (courseId, date, status) =>
        set((state) => {
          const existing = state.records.find(
            (r) => r.courseId === courseId && r.date === date
          );
          if (existing) {
            return {
              records: state.records.map((r) =>
                r.id === existing.id ? { ...r, status } : r
              ),
            };
          }
          return {
            records: [
              ...state.records,
              { id: crypto.randomUUID(), courseId, date, status },
            ],
          };
        }),
      getRecordsByCourse: (courseId) =>
        get().records.filter((r) => r.courseId === courseId),
      getRecordsByDate: (date) =>
        get().records.filter((r) => r.date === date),
      getRecord: (courseId, date) =>
        get().records.find((r) => r.courseId === courseId && r.date === date),
      deleteRecord: (id) =>
        set((state) => ({
          records: state.records.filter((r) => r.id !== id),
        })),
    }),
    { name: 'scholify-attendance' }
  )
);
