import { useMemo } from 'react';
import { useGradesStore, GradeComponent } from '../stores/gradesStore';
import { GradingScheme, UPES_GRADING_SCHEME, getGradeForPercentage } from '../constants/gradingSchemes';

export interface GradeCalc {
  totalWeightedScore: number;
  pendingWeight: number;
  currentGrade: string;
  currentPoints: number;
  components: GradeComponent[];
}

export function useGradeCalc(courseId: string, scheme: GradingScheme = UPES_GRADING_SCHEME): GradeCalc {
  const allComponents = useGradesStore((s) => s.components);
  const components = useMemo(() => 
    allComponents.filter((c) => c.courseId === courseId),
    [allComponents, courseId]
  );

  let totalWeightedScore = 0;
  let pendingWeight = 0;

  for (const comp of components) {
    if (comp.obtainedMarks !== null) {
      const score = (comp.obtainedMarks / comp.maxMarks) * comp.weightage;
      totalWeightedScore += score;
    } else {
      pendingWeight += comp.weightage;
    }
  }

  // Current percentage (only based on entered components)
  const enteredWeight = 100 - pendingWeight;
  const currentPercentage = enteredWeight > 0 ? (totalWeightedScore / enteredWeight) * 100 : 0;
  const grade = getGradeForPercentage(currentPercentage, scheme);

  return {
    totalWeightedScore,
    pendingWeight,
    currentGrade: grade.grade,
    currentPoints: grade.points,
    components,
  };
}

export function calculateWhatIf(
  components: GradeComponent[],
  overrides: Map<string, number>, // componentId -> hypothetical marks
  scheme: GradingScheme = UPES_GRADING_SCHEME
): { percentage: number; grade: string; points: number } {
  let total = 0;

  for (const comp of components) {
    const marks = overrides.has(comp.id) ? overrides.get(comp.id)! : comp.obtainedMarks;
    if (marks !== null && marks !== undefined) {
      total += (marks / comp.maxMarks) * comp.weightage;
    }
  }

  const grade = getGradeForPercentage(total, scheme);
  return { percentage: total, grade: grade.grade, points: grade.points };
}

export function calculateTargets(
  components: GradeComponent[],
  scheme: GradingScheme = UPES_GRADING_SCHEME
): Map<string, Map<string, number>> {
  // For each grade band, calculate the minimum marks needed in each pending component,
  // assuming the student achieves the SAME PERCENTAGE in every pending component.
  const pending = components.filter((c) => c.obtainedMarks === null);
  const entered = components.filter((c) => c.obtainedMarks !== null);

  // Total weighted score already locked in from entered components
  let enteredTotal = 0;
  for (const comp of entered) {
    enteredTotal += (comp.obtainedMarks! / comp.maxMarks) * comp.weightage;
  }

  // Sum of weightage points still available from pending components
  const pendingTotalWeight = pending.reduce((sum, c) => sum + c.weightage, 0);

  const targets = new Map<string, Map<string, number>>();

  for (const grade of scheme.grades) {
    if (grade.points === 0) continue;

    // How many more weighted points are needed from pending components?
    const needed = grade.minPercentage - enteredTotal;
    // What fraction of each component's max marks must be achieved?
    // (same ratio applied to all pending components)
    const ratio = pendingTotalWeight > 0 ? needed / pendingTotalWeight : 0;

    const componentTargets = new Map<string, number>();
    for (const comp of pending) {
      const minMarks = ratio * comp.maxMarks;
      // Clamp between 0 and maxMarks; ceil so it's a whole number
      componentTargets.set(comp.id, Math.ceil(Math.max(0, Math.min(comp.maxMarks, minMarks))));
    }

    targets.set(grade.grade, componentTargets);
  }

  return targets;
}
