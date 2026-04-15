"use client";
import { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
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
  const router = useRouter();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  function handleNav(href: string) {
    router.push(href);
    setOpen(false);
  }

  const sidebarContent = (
    <>
      <div className="border-b border-gray-200 p-6">
        <h2 className="text-lg font-bold text-orange-600">Amigo Karting</h2>
        <p className="mt-1 text-sm text-gray-500">
          {userName} {role === "patron" && "· Patron"}{role === "manager" && "· Gérant"}{role === "developpeur" && "· Dev"}
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
            <button
              onClick={() => handleNav(item.href)}
              className={clsx(
                "flex w-full items-center rounded-lg px-3 py-2.5 text-left text-sm font-medium",
                pathname === item.href
                  ? "bg-orange-50 text-orange-700"
                  : "text-gray-600 active:bg-gray-50"
              )}
            >
              {item.label}
            </button>
          </div>
        ))}
      </nav>

      <div className="border-t border-gray-200 p-4">
        <button
          onClick={onLogout}
          className="w-full rounded-lg px-3 py-2 text-sm text-gray-500 active:bg-gray-100"
        >
          Déconnexion
        </button>
      </div>
    </>
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-md lg:hidden"
        aria-label="Ouvrir le menu"
      >
        <svg className="h-5 w-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white shadow-xl transition-transform duration-300 lg:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          onClick={() => setOpen(false)}
          className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 active:bg-gray-100"
          aria-label="Fermer le menu"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        {sidebarContent}
      </aside>

      <aside className="hidden w-64 flex-col border-r border-gray-200 bg-white lg:flex">
        {sidebarContent}
      </aside>
    </>
  );
}