"use client";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/layout/Sidebar";
import { Spinner } from "@/components/ui/Spinner";
import { navForRole, roleLabel } from "@/lib/nav";

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  const { employee, isLoading, logout } = useAuth();

  if (isLoading) return <Spinner fullScreen />;

  const navItems = navForRole(employee?.role);

  return (
    <div className="flex min-h-screen">
      <Sidebar
        items={navItems}
        userName={employee?.first_name || ""}
        role={roleLabel(employee?.role)}
        onLogout={logout}
      />
      <main className="flex-1 overflow-y-auto p-6 pt-16 lg:p-8 lg:pt-8">{children}</main>
    </div>
  );
}
