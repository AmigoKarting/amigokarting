// Rôles et helpers partagés.
// Rôles « apprenants » : employés réguliers suivis en formation (pas du staff).
export const TRAINEE_ROLES = ["employee", "caisse", "piste"] as const;

// Rôles comptés dans les stats/notes d'équipe et le classement (apprenants + gérant).
// Exclut patron et développeur.
export const TEAM_ROLES = ["employee", "caisse", "piste", "manager"] as const;

// Formation ciblée : à quelle catégorie de formation un rôle est rattaché.
// null = voit toutes les catégories (employé générique, gérant, etc.).
export function roleCategory(role?: string | null): string | null {
  if (role === "caisse") return "Caisse - Amigo Karting";
  if (role === "piste") return "Piste";
  return null;
}

// Libellé français du rôle (pour l'affichage).
export function roleLabelFr(role?: string | null): string {
  switch (role) {
    case "patron": return "Patron";
    case "developpeur": return "Dev";
    case "manager": return "Gérant";
    case "caisse": return "Caisse";
    case "piste": return "Piste";
    default: return "Employé";
  }
}

// Classe Tailwind pour la pastille de rôle (couleur douce et distincte).
export function roleBadgeClass(role?: string | null): string {
  switch (role) {
    case "patron": return "bg-amber-50 text-amber-600";
    case "developpeur": return "bg-cyan-50 text-cyan-600";
    case "caisse": return "bg-blue-50 text-blue-600";
    case "piste": return "bg-green-50 text-green-600";
    default: return "bg-gray-100 text-gray-600"; // gérant / employé
  }
}
