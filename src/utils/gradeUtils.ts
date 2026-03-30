import { GradingScheme, UPES_GRADING_SCHEME, GradeEntry } from '../constants/gradingSchemes';

export function getGradeFromPercentage(percentage: number, scheme: GradingScheme = UPES_GRADING_SCHEME): GradeEntry {
  for (const grade of scheme.grades) {
    if (percentage >= grade.minPercentage) {
      return grade;
    }
  }
  return scheme.grades[scheme.grades.length - 1];
}

export function calculateCGPA(semesters: { gpa: number; credits: number }[]): number {
  const totalPoints = semesters.reduce((sum, s) => sum + s.gpa * s.credits, 0);
  const totalCredits = semesters.reduce((sum, s) => sum + s.credits, 0);
  return totalCredits === 0 ? 0 : Math.round((totalPoints / totalCredits) * 100) / 100;
}

export function getGradeColor(grade: string): string {
  switch (grade) {
    case 'O': return '#00FF88';
    case 'A+': return '#00FF88';
    case 'A': return '#00D4FF';
    case 'B+': return '#00D4FF';
    case 'B': return '#FFB800';
    case 'C+': return '#FFB800';
    case 'C': return '#FF3B5C';
    case 'F': return '#FF3B5C';
    case 'Ab': return '#FF3B5C';
    default: return '#E0E0F0';
  }
}
