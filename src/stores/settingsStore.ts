import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { GradingScheme, UPES_GRADING_SCHEME } from '../constants/gradingSchemes';

export interface Exam {
  id: string;
  name: string;
  courseId: string;
  date: string; // ISO date
  pinned: boolean;
}

export interface SemesterRecord {
  id: string;
  name: string; // 'Semester 1'
  gpa: number;
  credits: number;
}

interface SettingsState {
  // Profile
  studentName: string;
  university: string;
  onboardingCompleted: boolean;

  // Grading
  gradingScheme: GradingScheme;

  // Notifications
  notificationsEnabled: boolean;
  quietHoursStart: string; // '22:00'
  quietHoursEnd: string; // '07:00'

  // Exams
  exams: Exam[];

  // CGPA
  semesterHistory: SemesterRecord[];

  // Study Timer
  studyLogs: { courseId: string; date: string; minutes: number }[];

  // Actions
  setProfile: (name: string, university: string) => void;
  completeOnboarding: () => void;
  setGradingScheme: (scheme: GradingScheme) => void;
  setNotifications: (enabled: boolean) => void;
  setQuietHours: (start: string, end: string) => void;

  // Exam actions
  addExam: (exam: Omit<Exam, 'id'>) => void;
  deleteExam: (id: string) => void;
  togglePinExam: (id: string) => void;

  // CGPA actions
  addSemester: (semester: Omit<SemesterRecord, 'id'>) => void;
  updateSemester: (id: string, updates: Partial<SemesterRecord>) => void;
  deleteSemester: (id: string) => void;

  // Study actions
  logStudyTime: (courseId: string, minutes: number) => void;

  // Data management
  exportData: () => string;
  importData: (json: string) => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      studentName: '',
      university: 'UPES',
      onboardingCompleted: false,
      gradingScheme: UPES_GRADING_SCHEME,
      notificationsEnabled: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
      exams: [],
      semesterHistory: [],
      studyLogs: [],

      setProfile: (name, university) => set({ studentName: name, university }),
      completeOnboarding: () => set({ onboardingCompleted: true }),
      setGradingScheme: (scheme) => set({ gradingScheme: scheme }),
      setNotifications: (enabled) => set({ notificationsEnabled: enabled }),
      setQuietHours: (start, end) =>
        set({ quietHoursStart: start, quietHoursEnd: end }),

      addExam: (exam) =>
        set((state) => ({
          exams: [...state.exams, { ...exam, id: crypto.randomUUID() }],
        })),
      deleteExam: (id) =>
        set((state) => ({
          exams: state.exams.filter((e) => e.id !== id),
        })),
      togglePinExam: (id) =>
        set((state) => ({
          exams: state.exams.map((e) =>
            e.id === id ? { ...e, pinned: !e.pinned } : e
          ),
        })),

      addSemester: (semester) =>
        set((state) => ({
          semesterHistory: [
            ...state.semesterHistory,
            { ...semester, id: crypto.randomUUID() },
          ],
        })),
      updateSemester: (id, updates) =>
        set((state) => ({
          semesterHistory: state.semesterHistory.map((s) =>
            s.id === id ? { ...s, ...updates } : s
          ),
        })),
      deleteSemester: (id) =>
        set((state) => ({
          semesterHistory: state.semesterHistory.filter((s) => s.id !== id),
        })),

      logStudyTime: (courseId, minutes) =>
        set((state) => ({
          studyLogs: [
            ...state.studyLogs,
            { courseId, date: new Date().toISOString().split('T')[0], minutes },
          ],
        })),

      exportData: () => {
        const allData: Record<string, unknown> = {};
        const keys = [
          'scholify-courses',
          'scholify-attendance',
          'scholify-grades',
          'scholify-assignments',
          'scholify-settings',
        ];
        keys.forEach((key) => {
          const data = localStorage.getItem(key);
          if (data) allData[key] = JSON.parse(data);
        });
        return JSON.stringify(allData, null, 2);
      },

      importData: (json) => {
        try {
          const data = JSON.parse(json);
          Object.entries(data).forEach(([key, value]) => {
            localStorage.setItem(key, JSON.stringify(value));
          });
          window.location.reload();
        } catch (e) {
          console.error('Import failed:', e);
        }
      },
    }),
    { name: 'scholify-settings' }
  )
);
