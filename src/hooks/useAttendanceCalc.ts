import { useMemo } from 'react';
import { useCoursesStore, Course } from '../stores/coursesStore';
import { useAttendanceStore } from '../stores/attendanceStore';

export interface AttendanceCalc {
  attended: number;
  absent: number;
  total: number;
  percentage: number;
  status: 'safe' | 'warning' | 'danger';
  safeSkips: number;
  classesNeeded: number; // classes to attend to reach threshold
  maxPotential: number; // max % if all remaining attended
  remaining: number;
}

export function useAttendanceCalc(courseId: string): AttendanceCalc | null {
  const course = useCoursesStore((s) => s.courses.find((c) => c.id === courseId));
  const allRecords = useAttendanceStore((s) => s.records);
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

  // Estimate remaining classes (simplified: assume ~14 more weeks)
  const remaining = Math.max(0, 14 * course.scheduleDays.length - records.length);

  // Safe skips: how many more classes can skip while staying >= threshold
  const future = remaining;
  const safeSkips = Math.max(
    0,
    Math.floor(attended + future - threshold * (total + future))
  );

  // Classes needed to reach threshold if currently below
  let classesNeeded = 0;
  if (percentage < course.attendanceThreshold) {
    // Need x more presents: (attended + x) / (total + x) >= threshold
    classesNeeded = Math.ceil((threshold * total - attended) / (1 - threshold));
  }

  const maxPotential = total + remaining === 0 ? 100 : Math.round(((attended + remaining) / (total + remaining)) * 100);

  const status: 'safe' | 'warning' | 'danger' =
    percentage >= 80 ? 'safe' : percentage >= 75 ? 'warning' : 'danger';

  return {
    attended,
    absent,
    total,
    percentage,
    status,
    safeSkips,
    classesNeeded,
    maxPotential,
    remaining,
  };
}

export function useAllAttendanceCalc(): Map<string, AttendanceCalc> {
  const courses = useCoursesStore((s) => s.courses);
  const records = useAttendanceStore((s) => s.records);
  
  return useMemo(() => {
    const result = new Map<string, AttendanceCalc>();
    for (const course of courses) {
      const courseRecords = records.filter((r) => r.courseId === course.id);
      const attended = course.totalAttended + courseRecords.filter((r) => r.status === 'present' || r.status === 'late').length;
      const absent = (course.totalClassesHeld - course.totalAttended) + courseRecords.filter((r) => r.status === 'absent').length;
      const total = attended + absent;
      const percentage = total === 0 ? 100 : Math.round((attended / total) * 100);
      const threshold = course.attendanceThreshold / 100;
      const remaining = Math.max(0, 14 * course.scheduleDays.length - courseRecords.length);
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
  }, [courses, records]);
}
