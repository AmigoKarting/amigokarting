"use client";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Spinner } from "@/components/ui/Spinner";

const baseNav = [
  // Section Gestion
  { label: "Tableau de bord", href: "/admin", icon: "LayoutDashboard" },
  { label: "Employés", href: "/admin/employees", icon: "Users" },
  { label: "Notes globales", href: "/admin/scores", icon: "BarChart" },
  { label: "Difficultés quiz", href: "/admin/training/quizzes", icon: "AlertTriangle" },
  { label: "Suivi formation", href: "/admin/training", icon: "GraduationCap" },
  { label: "Rapport conversations", href: "/admin/conversations", icon: "MessageCircle" },
  { label: "Banque de questions", href: "/admin/conversations/questions", icon: "List" },
  { label: "Annonces", href: "/admin/announcements", icon: "Megaphone" },
  { label: "Alertes & Évolution", href: "/admin/alerts", icon: "Bell" },
  { label: "Paramètres", href: "/admin/settings", icon: "Settings" },
  { label: "Guide", href: "/admin/guide", icon: "BookOpen", divider: true },
  // Section personnelle
  { label: "Ma fiche", href: "/admin/my-profile", icon: "User", divider: true },
  { label: "Ma note", href: "/admin/my-score", icon: "Star" },
  { label: "Formation", href: "/admin/my-training", icon: "PlayCircle" },
  { label: "Conversations IA", href: "/admin/my-conversations", icon: "Phone" },
  { label: "Q&A", href: "/admin/my-qa", icon: "HelpCircle" },
  { label: "Mon historique", href: "/admin/my-historique", icon: "Clock" },
];

const patronNav = [
  { label: "Zone Patron", href: "/admin/patron", icon: "Crown", divider: true },
];

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  const { employee, isLoading, logout } = useAuth();

  if (isLoading) return <Spinner fullScreen />;

  const isPatron = employee?.role === "patron" || employee?.role === "developpeur";
  const navItems = isPatron ? [...baseNav, ...patronNav] : baseNav;
  const roleLabel = employee?.role === "developpeur" ? "developpeur" : isPatron ? "patron" : "manager";

  return (
    <div className="flex min-h-screen">
      <Sidebar
        items={navItems}
        userName={employee?.first_name || ""}
        role={roleLabel}
        onLogout={logout}
      />
      <main className="flex-1 overflow-y-auto p-6 pt-16 lg:p-8 lg:pt-8">{children}</main>
    </div>
  );
}