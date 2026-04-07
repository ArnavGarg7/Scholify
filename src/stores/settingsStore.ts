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

  // Semester Dates
  semesterStartDate: string; // ISO date
  semesterEndDate: string;   // ISO date

  // Grading
  gradingScheme: GradingScheme;

  // Theme
  themeMode: 'dark' | 'light';

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

  // Study Streak
  studyStreak: number;
  lastStudyDate: string; // ISO date

  // Actions
  setProfile: (name: string, university: string) => void;
  completeOnboarding: () => void;
  setSemesterDates: (start: string, end: string) => void;
  setGradingScheme: (scheme: GradingScheme) => void;
  setThemeMode: (mode: 'dark' | 'light') => void;
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
      semesterStartDate: '',
      semesterEndDate: '',
      gradingScheme: UPES_GRADING_SCHEME,
      themeMode: 'dark' as const,
      notificationsEnabled: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '07:00',
      exams: [],
      semesterHistory: [],
      studyLogs: [],
      studyStreak: 0,
      lastStudyDate: '',

      setProfile: (name, university) => set({ studentName: name, university }),
      completeOnboarding: () => set({ onboardingCompleted: true }),
      setSemesterDates: (start, end) =>
        set({ semesterStartDate: start, semesterEndDate: end }),
      setGradingScheme: (scheme) => set({ gradingScheme: scheme }),
      setThemeMode: (mode) => set({ themeMode: mode }),
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

      logStudyTime: (courseId, minutes) => {
        const today = new Date().toISOString().split('T')[0];
        const { lastStudyDate, studyStreak } = get();

        // Calculate streak
        let newStreak = studyStreak;
        if (lastStudyDate !== today) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          const yesterdayStr = yesterday.toISOString().split('T')[0];

          if (lastStudyDate === yesterdayStr) {
            newStreak = studyStreak + 1;
          } else if (lastStudyDate !== today) {
            newStreak = 1;
          }
        }

        set((state) => ({
          studyLogs: [
            ...state.studyLogs,
            { courseId, date: today, minutes },
          ],
          studyStreak: newStreak,
          lastStudyDate: today,
        }));
      },

      exportData: () => {
        const allData: Record<string, unknown> = {};
        const keys = [
          'scholify-courses',
          'scholify-attendance',
          'scholify-grades',
          'scholify-assignments',
          'scholify-settings',
          'scholify-holidays',
          'scholify-notes',
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
    {
      name: 'scholify-settings',
      version: 1,
      migrate: (persisted: any, fromVersion: number) => {
        if (fromVersion < 1) {
          // Fix incorrect UPES grading thresholds stored in old saved data
          persisted.gradingScheme = UPES_GRADING_SCHEME;
        }
        return persisted;
      },
    }
  )
);
