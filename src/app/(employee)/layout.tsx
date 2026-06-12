"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav, HIDE_ON } from "@/components/layout/BottomNav";
import { Spinner } from "@/components/ui/Spinner";
import { navForRole, roleLabel, bottomNavForRole } from "@/lib/nav";

export default function EmployeeLayout({ children }: { children: React.ReactNode }) {
  const { employee, isLoading, logout } = useAuth();
  const pathname = usePathname();
  const mainRef = useRef<HTMLElement>(null);

  // Remonter en haut à chaque changement de page (navigation agréable).
  useEffect(() => {
    mainRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  if (isLoading) return <Spinner fullScreen />;

  // Un gérant/patron/dev qui visite une page du groupe employé garde son menu.
  const navItems = navForRole(employee?.role);
  const showNav = !HIDE_ON.includes(pathname);

  return (
    <div className="flex min-h-screen">
      <Sidebar
        items={navItems}
        userName={employee?.first_name || ""}
        role={roleLabel(employee?.role)}
        onLogout={logout}
      />
      <main
        ref={mainRef}
        className={`flex-1 scroll-smooth overflow-y-auto p-6 lg:p-8 ${showNav ? "pb-24 lg:pb-8" : ""}`}
      >
        <div key={pathname} className="animate-fade-in-up">{children}</div>
      </main>
      <BottomNav items={bottomNavForRole(employee?.role)} />
    </div>
  );
}
