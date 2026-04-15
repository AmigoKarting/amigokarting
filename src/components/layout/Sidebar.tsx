"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";

interface NavItem {
  label: string;
  href: string;
  icon: string;
  divider?: boolean;
}

interface SidebarProps {
  items: NavItem[];
  userName: string;
  role?: string;
  onLogout: () => void;
}

export function Sidebar({ items, userName, role, onLogout }: SidebarProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Fermer le menu quand on change de page
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Fermer avec Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const sidebarContent = (
    <>
      <div className="border-b border-gray-200 p-6">
        <h2 className="text-lg font-bold text-orange-600">Amigo Karting</h2>
        <p className="mt-1 text-sm text-gray-500">
          {userName} {role === "patron" && "· Patron"}{role === "developpeur" && "· Dev"}{role === "manager" && "· Gérant"}
        </p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {items.map((item) => (
          <div key={item.href}>
            {item.divider && (
              <div className="mb-2 mt-4 border-t border-gray-200 pt-3">
                <p className="px-3 text-xs font-medium uppercase text-gray-400">
                  {item.divider === true ? "" : item.divider}
                </p>
              </div>
            )}
            <Link
              href={item.href}
              className={clsx(
                "flex items-center rounded-lg px-3 py-2.5 text-sm font-medium",
                pathname === item.href
                  ? "bg-orange-50 text-orange-700"
                  : "text-gray-600 active:bg-gray-50 active:text-gray-900"
              )}
            >
              {item.label}
            </Link>
          </div>
        ))}
      </nav>

      <div className="border-t border-gray-200 p-4">
        <button
          onClick={onLogout}
          className="w-full rounded-lg px-3 py-2 text-sm text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
        >
          Déconnexion
        </button>
      </div>
    </>
  );

  return (
    <>
      {/* Bouton hamburger — mobile seulement */}
      <button
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-md lg:hidden"
        aria-label="Ouvrir le menu"
      >
        <svg className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      {/* Overlay sombre — mobile */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar mobile (tiroir) */}
      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white shadow-xl transition-transform duration-300 lg:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Bouton fermer */}
        <button
          onClick={() => setOpen(false)}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          aria-label="Fermer le menu"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {sidebarContent}
      </aside>

      {/* Sidebar desktop (fixe) */}
      <aside className="hidden w-64 flex-col border-r border-gray-200 bg-white lg:flex">
        {sidebarContent}
      </aside>
    </>
  );
}
