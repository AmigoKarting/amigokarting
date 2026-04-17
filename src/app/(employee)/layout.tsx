"use client";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Spinner } from "@/components/ui/Spinner";

const employeeNav = [
  { label: "Accueil", href: "/dashboard", icon: "Home" },
  { label: "Ma fiche", href: "/profile", icon: "User" },
  { label: "Ma note", href: "/score", icon: "Star" },
  { label: "Formation", href: "/training", icon: "GraduationCap" },
  { label: "Conversations", href: "/conversations", icon: "MessageCircle" },
  { label: "Q&A", href: "/qa", icon: "HelpCircle" },
  { label: "Progression", href: "/progression", icon: "TrendingUp" },
  { label: "Guide", href: "/guide", icon: "BookOpen" },
  { label: "Aide", href: "/aide", icon: "LifeBuoy" },
];

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const { employee, isLoading, logout } = useAuth();

  if (isLoading) return <Spinner fullScreen />;

  return (
    <div className="flex min-h-screen">
      <Sidebar
        items={employeeNav}
        userName={employee?.first_name || ""}
        onLogout={logout}
      />
      <main className="flex-1 overflow-y-auto p-6 pt-16 lg:p-8 lg:pt-8">{children}</main>
    </div>
  );
}
