import { useMemo } from 'react';
import { useCoursesStore, Course } from '../stores/coursesStore';
import { useAttendanceStore } from '../stores/attendanceStore';
import { useSettingsStore } from '../stores/settingsStore';
import { useHolidayStore } from '../stores/holidayStore';

export interface AttendanceCalc {
  attended: number;
  absent: number;
  total: number;
  percentage: number;
  status: 'safe' | 'warning' | 'danger';
  safeSkips: number;
  classesNeeded: number;
  maxPotential: number;
  remaining: number;
}

function countScheduledClasses(
  scheduleDays: string[],
  startDate: string,
  endDate: string,
  holidays: { date: string; enabled: boolean }[]
): number {
  if (!startDate || !endDate) return 0;
  const start = new Date(startDate);
  const end = new Date(endDate);
  const holidayDates = new Set(holidays.filter(h => h.enabled).map(h => h.date));
  let count = 0;
  const current = new Date(start);

  while (current <= end) {
    const dayStr = current.toLocaleDateString('en-US', { weekday: 'short' });
    const dateStr = current.toISOString().split('T')[0];
    if (scheduleDays.includes(dayStr) && !holidayDates.has(dateStr)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  return count;
}

export function useAttendanceCalc(courseId: string): AttendanceCalc | null {
  const course = useCoursesStore((s) => s.courses.find((c) => c.id === courseId));
  const allRecords = useAttendanceStore((s) => s.records);
  const semStart = useSettingsStore((s) => s.semesterStartDate);
  const semEnd = useSettingsStore((s) => s.semesterEndDate);
  const holidays = useHolidayStore((s) => s.holidays);
  const records = useMemo(() =>
    allRecords.filter((r) => r.courseId === courseId),
    [allRecords, courseId]
  );

  if (!course) return null;

  const attended = course.totalAttended + records.filter((r) => r.status === 'present' || r.status === 'late').length;
  const absent = (course.totalClassesHeld - course.totalAttended) + records.filter((r) => r.status === 'absent').length;
  const total = attended + absent;
  const percentage = total === 0 ? 100 : Math.round((attended / total) * 100);
  const threshold = course.attendanceThreshold / 100;

  // Smart remaining calculation using semester dates and holidays
  let remaining: number;
  if (semStart && semEnd) {
    const today = new Date().toISOString().split('T')[0];
    const futureStart = today > semStart ? today : semStart;
    const totalScheduled = countScheduledClasses(course.scheduleDays, semStart, semEnd, holidays);
    const futureScheduled = countScheduledClasses(course.scheduleDays, futureStart, semEnd, holidays);
    remaining = Math.max(0, futureScheduled - records.filter(r => r.date >= futureStart).length);
  } else {
    remaining = Math.max(0, 14 * course.scheduleDays.length - records.length);
  }

  const future = remaining;
  const safeSkips = Math.max(0, Math.floor(attended + future - threshold * (total + future)));

  let classesNeeded = 0;
  if (percentage < course.attendanceThreshold) {
    classesNeeded = Math.ceil((threshold * total - attended) / (1 - threshold));
  }

  const maxPotential = total + remaining === 0 ? 100 : Math.round(((attended + remaining) / (total + remaining)) * 100);

  const status: 'safe' | 'warning' | 'danger' =
    percentage >= 80 ? 'safe' : percentage >= 75 ? 'warning' : 'danger';

  return {
    attended, absent, total, percentage, status, safeSkips, classesNeeded, maxPotential, remaining,
  };
}

export function useAllAttendanceCalc(): Map<string, AttendanceCalc> {
  const courses = useCoursesStore((s) => s.courses);
  const records = useAttendanceStore((s) => s.records);
  const semStart = useSettingsStore((s) => s.semesterStartDate);
  const semEnd = useSettingsStore((s) => s.semesterEndDate);
  const holidays = useHolidayStore((s) => s.holidays);

  return useMemo(() => {
    const result = new Map<string, AttendanceCalc>();
    for (const course of courses) {
      const courseRecords = records.filter((r) => r.courseId === course.id);
      const attended = course.totalAttended + courseRecords.filter((r) => r.status === 'present' || r.status === 'late').length;
      const absent = (course.totalClassesHeld - course.totalAttended) + courseRecords.filter((r) => r.status === 'absent').length;
      const total = attended + absent;
      const percentage = total === 0 ? 100 : Math.round((attended / total) * 100);
      const threshold = course.attendanceThreshold / 100;

      let remaining: number;
      if (semStart && semEnd) {
        const today = new Date().toISOString().split('T')[0];
        const futureStart = today > semStart ? today : semStart;
        const futureScheduled = countScheduledClasses(course.scheduleDays, futureStart, semEnd, holidays);
        remaining = Math.max(0, futureScheduled - courseRecords.filter(r => r.date >= futureStart).length);
      } else {
        remaining = Math.max(0, 14 * course.scheduleDays.length - courseRecords.length);
      }

      const future = remaining;
      const safeSkips = Math.max(0, Math.floor(attended + future - threshold * (total + future)));
      let classesNeeded = 0;
      if (percentage < course.attendanceThreshold) {
        classesNeeded = Math.ceil((threshold * total - attended) / (1 - threshold));
      }
      const maxPotential = total + remaining === 0 ? 100 : Math.round(((attended + remaining) / (total + remaining)) * 100);
      const status: 'safe' | 'warning' | 'danger' =
        percentage >= 80 ? 'safe' : percentage >= 75 ? 'warning' : 'danger';

      result.set(course.id, {
        attended, absent, total, percentage, status, safeSkips, classesNeeded, maxPotential, remaining,
      });
    }
    return result;
  }, [courses, records, semStart, semEnd, holidays]);
}
