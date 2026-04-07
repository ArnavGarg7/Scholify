export interface GradeEntry {
  grade: string;
  description: string;
  points: number;
  minPercentage: number;
}

export interface ExamComponent {
  name: string;
  weightage: number; // percentage of total
  subComponents?: { name: string; weightage: number }[];
}

export interface GradingScheme {
  name: string;
  scale: number;
  grades: GradeEntry[];
  components: ExamComponent[];
}

export const UPES_GRADING_SCHEME: GradingScheme = {
  name: 'UPES 10-pt scale',
  scale: 10,
  grades: [
    { grade: 'O',  description: 'Outstanding',    points: 10.0, minPercentage: 85 },
    { grade: 'A+', description: 'Excellent',       points: 9.0,  minPercentage: 75 },
    { grade: 'A',  description: 'Very Good',       points: 8.0,  minPercentage: 65 },
    { grade: 'B+', description: 'Good',            points: 7.0,  minPercentage: 55 },
    { grade: 'B',  description: 'Above Average',   points: 6.0,  minPercentage: 45 },
    { grade: 'C+', description: 'Average',         points: 5.0,  minPercentage: 40 },
    { grade: 'C',  description: 'Pass',            points: 4.0,  minPercentage: 35 },
    { grade: 'F',  description: 'Fail',            points: 0,    minPercentage: 0 },
    { grade: 'Ab', description: 'Absent/Fail',     points: 0,    minPercentage: 0 },
  ],
  components: [
    {
      name: 'Internal Assessment',
      weightage: 50,
      subComponents: [
        { name: 'Quiz 1', weightage: 15 },
        { name: 'Quiz 2', weightage: 15 },
        { name: 'Class Test 1', weightage: 15 },
        { name: 'Class Test 2', weightage: 15 },
        { name: 'Assignment 1', weightage: 20 },
        { name: 'Assignment 2', weightage: 20 },
      ],
    },
    { name: 'Mid Semester', weightage: 20 },
    { name: 'End Semester', weightage: 30 },
  ],
};

export const DEFAULT_SCHEMES: GradingScheme[] = [UPES_GRADING_SCHEME];

export function getGradeForPercentage(percentage: number, scheme: GradingScheme): GradeEntry {
  for (const grade of scheme.grades) {
    if (percentage >= grade.minPercentage) {
      return grade;
    }
  }
  return scheme.grades[scheme.grades.length - 1];
}
