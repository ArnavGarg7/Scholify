import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Holiday {
  id: string;
  date: string; // YYYY-MM-DD
  name: string;
  isOfficial: boolean; // true = govt holiday, false = custom
  enabled: boolean; // user can toggle off holidays their college doesn't observe
}

// Standard Indian Government Holidays 2026
const INDIAN_GOVT_HOLIDAYS_2026: Omit<Holiday, 'id'>[] = [
  { date: '2026-01-26', name: 'Republic Day', isOfficial: true, enabled: true },
  { date: '2026-03-10', name: 'Holi', isOfficial: true, enabled: true },
  { date: '2026-03-30', name: 'Id-ul-Fitr (Eid)', isOfficial: true, enabled: true },
  { date: '2026-04-02', name: 'Ram Navami', isOfficial: true, enabled: true },
  { date: '2026-04-03', name: 'Good Friday', isOfficial: true, enabled: true },
  { date: '2026-04-14', name: 'Dr. Ambedkar Jayanti', isOfficial: true, enabled: true },
  { date: '2026-05-01', name: 'May Day', isOfficial: true, enabled: true },
  { date: '2026-05-12', name: 'Buddha Purnima', isOfficial: true, enabled: true },
  { date: '2026-06-06', name: 'Id-ul-Zuha (Bakrid)', isOfficial: true, enabled: true },
  { date: '2026-07-06', name: 'Muharram', isOfficial: true, enabled: true },
  { date: '2026-08-15', name: 'Independence Day', isOfficial: true, enabled: true },
  { date: '2026-08-21', name: 'Janmashtami', isOfficial: true, enabled: true },
  { date: '2026-09-05', name: 'Milad-un-Nabi', isOfficial: true, enabled: true },
  { date: '2026-10-02', name: 'Gandhi Jayanti', isOfficial: true, enabled: true },
  { date: '2026-10-20', name: 'Dussehra', isOfficial: true, enabled: true },
  { date: '2026-11-08', name: 'Diwali', isOfficial: true, enabled: true },
  { date: '2026-11-10', name: 'Bhai Dooj / Govardhan Puja', isOfficial: true, enabled: true },
  { date: '2026-11-27', name: 'Guru Nanak Jayanti', isOfficial: true, enabled: true },
  { date: '2026-12-25', name: 'Christmas', isOfficial: true, enabled: true },
];

interface HolidayState {
  holidays: Holiday[];
  initialized: boolean;
  addHoliday: (holiday: Omit<Holiday, 'id'>) => void;
  removeHoliday: (id: string) => void;
  toggleHoliday: (id: string) => void;
  isHoliday: (date: string) => Holiday | undefined;
  getHolidaysInRange: (start: string, end: string) => Holiday[];
  initializeDefaults: () => void;
}

export const useHolidayStore = create<HolidayState>()(
  persist(
    (set, get) => ({
      holidays: [],
      initialized: false,
      addHoliday: (holiday) =>
        set((state) => ({
          holidays: [...state.holidays, { ...holiday, id: crypto.randomUUID() }],
        })),
      removeHoliday: (id) =>
        set((state) => ({
          holidays: state.holidays.filter((h) => h.id !== id),
        })),
      toggleHoliday: (id) =>
        set((state) => ({
          holidays: state.holidays.map((h) =>
            h.id === id ? { ...h, enabled: !h.enabled } : h
          ),
        })),
      isHoliday: (date) =>
        get().holidays.find((h) => h.date === date && h.enabled),
      getHolidaysInRange: (start, end) =>
        get().holidays.filter(
          (h) => h.enabled && h.date >= start && h.date <= end
        ),
      initializeDefaults: () => {
        if (get().initialized) return;
        set({
          holidays: INDIAN_GOVT_HOLIDAYS_2026.map((h) => ({
            ...h,
            id: crypto.randomUUID(),
          })),
          initialized: true,
        });
      },
    }),
    { name: 'scholify-holidays' }
  )
);
