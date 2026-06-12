// Système de niveau UNIQUE, basé sur les points de jeu (training_stats).
// Utilisé par l'accueil ET la page Progression pour éviter deux niveaux
// contradictoires.
export const LEVEL_LABELS = [
  "Recrue", "Apprenti", "Régulier", "Pro", "Vétéran", "Expert", "Maître", "Légende",
];
export const LEVEL_COLORS = [
  "#9CA3AF", "#64748B", "#16A34A", "#2563EB", "#4F46E5", "#7C3AED", "#CA8A04", "#EA580C",
];
export const PTS_PER_LEVEL = 150;

export function levelFromPoints(p: number) {
  const points = Math.max(0, p || 0);
  const level = Math.floor(points / PTS_PER_LEVEL) + 1;
  const capped = Math.min(level - 1, LEVEL_LABELS.length - 1);
  return {
    level,
    label: LEVEL_LABELS[capped],
    color: LEVEL_COLORS[capped],
    pct: Math.round(((points % PTS_PER_LEVEL) / PTS_PER_LEVEL) * 100),
    toNext: PTS_PER_LEVEL - (points % PTS_PER_LEVEL),
  };
}
