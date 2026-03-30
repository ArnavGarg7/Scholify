export function calculateHealthScore(
  attendancePercentage: number,
  gradePoints: number,
  pendingAssignments: number
): number {
  const attendanceScore = attendancePercentage >= 80 ? 100 : attendancePercentage >= 75 ? 50 : 0;
  const gradeScore = gradePoints * 10;
  const assignmentScore = Math.max(0, 100 - pendingAssignments * 20);

  return Math.round(attendanceScore * 0.4 + gradeScore * 0.4 + assignmentScore * 0.2);
}

export function getStrokeDashoffset(percentage: number, circumference: number = 176): number {
  return circumference - (percentage / 100) * circumference;
}
