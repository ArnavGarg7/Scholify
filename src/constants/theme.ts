// Retro-Futuristic Theme Constants

export const RF_COLORS = {
  base: '#0A0A1A',
  surface: '#0F0F2E',
  card: '#151530',
  cyan: '#00D4FF',
  green: '#00FF88',
  amber: '#FFB800',
  red: '#FF3B5C',
  primary: '#005BC0',
  primaryContainer: '#1a73e8',
  border: 'rgba(0, 212, 255, 0.2)',
  glow: 'rgba(0, 212, 255, 0.3)',
  textPrimary: '#E0E0F0',
  textSecondary: 'rgba(193, 198, 214, 0.7)',
  textMuted: 'rgba(193, 198, 214, 0.5)',
} as const;

export function getStatusColor(percentage: number): string {
  if (percentage >= 80) return RF_COLORS.green;
  if (percentage >= 75) return RF_COLORS.amber;
  return RF_COLORS.red;
}

export function getStatusLabel(percentage: number): 'safe' | 'warning' | 'danger' {
  if (percentage >= 80) return 'safe';
  if (percentage >= 75) return 'warning';
  return 'danger';
}

export function getHealthColor(score: number): string {
  if (score >= 75) return RF_COLORS.green;
  if (score >= 50) return RF_COLORS.amber;
  return RF_COLORS.red;
}

export function getDaysColor(daysLeft: number): string {
  if (daysLeft > 5) return RF_COLORS.green;
  if (daysLeft >= 2) return RF_COLORS.amber;
  return RF_COLORS.red;
}
