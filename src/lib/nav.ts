// Définitions de navigation partagées entre les layouts employé et gérant.
// Permet aux gérants/patrons/devs de garder leur menu complet même sur les
// pages du groupe (employee), comme la prise de quiz.

export interface NavItem {
  label: string;
  href: string;
  icon: string;
  divider?: boolean;
  patronOnly?: boolean; // visible seulement pour patron / développeur
}

export const employeeNav: NavItem[] = [
  { label: "Accueil", href: "/dashboard", icon: "Home" },
  { label: "Ma fiche", href: "/profile", icon: "User" },
  { label: "Ma note", href: "/score", icon: "Star" },
  { label: "Formation", href: "/training", icon: "GraduationCap" },
  { label: "À revoir", href: "/revoir", icon: "RotateCcw" },
  { label: "Fiches mémo", href: "/fiches", icon: "Layers" },
  { label: "Aide-mémoire", href: "/aide-memoire", icon: "Search" },
  { label: "En cas de…", href: "/procedures", icon: "Shield" },
  { label: "Signaler", href: "/signaler", icon: "AlertTriangle" },
  { label: "Conversations", href: "/conversations", icon: "MessageCircle" },
  { label: "Q&A", href: "/qa", icon: "HelpCircle" },
  { label: "Historique", href: "/historique", icon: "Clock" },
  { label: "Progression", href: "/progression", icon: "TrendingUp" },
  { label: "Guide", href: "/guide", icon: "BookOpen" },
  { label: "Aide", href: "/aide", icon: "LifeBuoy" },
];

export const managerBaseNav: NavItem[] = [
  // Section Gestion
  { label: "Accueil", href: "/admin/accueil", icon: "Home" },
  { label: "Tableau de bord", href: "/admin", icon: "LayoutDashboard" },
  { label: "Approbations", href: "/admin/approbations", icon: "UserCheck", patronOnly: true },
  { label: "Employés", href: "/admin/employees", icon: "Users" },
  { label: "Notes globales", href: "/admin/scores", icon: "BarChart" },
  { label: "Difficultés quiz", href: "/admin/training/quizzes", icon: "AlertTriangle" },
  { label: "Suivi formation", href: "/admin/training", icon: "GraduationCap" },
  { label: "Rapport conversations", href: "/admin/conversations", icon: "MessageCircle" },
  { label: "Banque de questions", href: "/admin/conversations/questions", icon: "List" },
  { label: "Annonces", href: "/admin/announcements", icon: "Megaphone" },
  { label: "Alertes & Évolution", href: "/admin/alerts", icon: "Bell" },
  { label: "Paramètres", href: "/admin/settings", icon: "Settings", patronOnly: true },
  { label: "Logs de connexion", href: "/admin/login-logs", icon: "Shield" },
  { label: "Guide", href: "/admin/guide", icon: "BookOpen", divider: true },
  // Section personnelle
  { label: "Ma fiche", href: "/admin/my-profile", icon: "User", divider: true },
  { label: "Ma note", href: "/admin/my-score", icon: "Star" },
  { label: "Formation", href: "/admin/my-training", icon: "PlayCircle" },
  { label: "À revoir", href: "/revoir", icon: "RotateCcw" },
  { label: "Fiches mémo", href: "/fiches", icon: "Layers" },
  { label: "Aide-mémoire", href: "/aide-memoire", icon: "Search" },
  { label: "En cas de…", href: "/procedures", icon: "Shield" },
  { label: "Conversations IA", href: "/admin/my-conversations", icon: "Phone" },
  { label: "Q&A", href: "/admin/my-qa", icon: "HelpCircle" },
  { label: "Mon historique", href: "/admin/my-historique", icon: "Clock" },
];

export const patronNav: NavItem[] = [
  { label: "Zone Patron", href: "/admin/patron", icon: "Crown", divider: true },
];

// Retourne le menu approprié selon le rôle.
export function navForRole(role: string | undefined | null): NavItem[] {
  const isStaff = role === "manager" || role === "patron" || role === "developpeur";
  if (!isStaff) return employeeNav;
  const isPatron = role === "patron" || role === "developpeur";
  if (isPatron) return [...managerBaseNav, ...patronNav];
  // Gérant : on retire les items réservés au patron/dev (ex : Paramètres)
  return managerBaseNav.filter((item) => !item.patronOnly);
}

// Barre d'onglets du bas (mobile) : 4 destinations clés + un bouton « Menu »
// ajouté par le composant. Une seule tape pour se déplacer.
export const employeeBottomNav: NavItem[] = [
  { label: "Accueil", href: "/dashboard", icon: "Home" },
  { label: "Formation", href: "/training", icon: "GraduationCap" },
  { label: "Parler", href: "/conversations", icon: "MessageCircle" },
  { label: "Progrès", href: "/progression", icon: "TrendingUp" },
];

export const managerBottomNav: NavItem[] = [
  { label: "Accueil", href: "/admin/accueil", icon: "Home" },
  { label: "Tableau", href: "/admin", icon: "LayoutDashboard" },
  { label: "Employés", href: "/admin/employees", icon: "Users" },
  { label: "Notes", href: "/admin/scores", icon: "BarChart" },
];

export function bottomNavForRole(role: string | undefined | null): NavItem[] {
  const isStaff = role === "manager" || role === "patron" || role === "developpeur";
  return isStaff ? managerBottomNav : employeeBottomNav;
}

export function roleLabel(role: string | undefined | null): string | undefined {
  if (role === "developpeur") return "developpeur";
  if (role === "patron") return "patron";
  if (role === "manager") return "manager";
  if (role === "caisse") return "caisse";
  if (role === "piste") return "piste";
  return undefined;
}
