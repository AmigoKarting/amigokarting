"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
  Home, User, Star, GraduationCap, MessageCircle, HelpCircle, Clock,
  TrendingUp, BookOpen, LifeBuoy, LayoutDashboard, Users, BarChart3,
  AlertTriangle, Megaphone, Bell, Settings, Shield, List, PlayCircle,
  Phone, Crown, UserCheck, RotateCcw, Layers, Search, Menu, X, LogOut, type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  Home, User, Star, GraduationCap, MessageCircle, HelpCircle, Clock,
  TrendingUp, BookOpen, LifeBuoy, LayoutDashboard, Users, BarChart: BarChart3,
  AlertTriangle, Megaphone, Bell, Settings, Shield, List, PlayCircle,
  Phone, Crown, UserCheck, RotateCcw, Layers, Search,
};

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

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const roleSuffix =
    role === "patron" ? "Patron" : role === "manager" ? "Gérant" : role === "developpeur" ? "Dev"
      : role === "caisse" ? "Caisse" : role === "piste" ? "Piste" : "";

  const sidebarContent = (
    <>
      <div className="flex items-center gap-3 border-b border-gray-200 px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">
          A
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold tracking-tight text-gray-900">Amigo Karting</h2>
          <p className="truncate text-xs text-gray-500">
            {userName}{roleSuffix && ` · ${roleSuffix}`}
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {items.map((item) => {
          const Icon = ICONS[item.icon] || Home;
          const active = pathname === item.href;
          return (
            <div key={item.href}>
              {item.divider && <div className="my-3 border-t border-gray-100" />}
              <Link
                href={item.href}
                onClick={() => setOpen(false)}
                className={clsx(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition",
                  active
                    ? "bg-brand-50 font-medium text-brand-700"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                )}
              >
                <Icon className={clsx("h-[18px] w-[18px] shrink-0", active ? "text-brand-600" : "text-gray-400")} strokeWidth={2} />
                <span className="truncate">{item.label}</span>
              </Link>
            </div>
          );
        })}
      </nav>

      <div className="border-t border-gray-200 p-3">
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-500 transition hover:bg-gray-50 hover:text-gray-900"
        >
          <LogOut className="h-[18px] w-[18px] text-gray-400" strokeWidth={2} />
          Déconnexion
        </button>
      </div>
    </>
  );

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed left-4 top-4 z-40 flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-700 shadow-sm lg:hidden"
        aria-label="Ouvrir le menu"
      >
        <Menu className="h-5 w-5" strokeWidth={2} />
      </button>

      {open && (
        <div className="fixed inset-0 z-40 bg-black/40 lg:hidden" onClick={() => setOpen(false)} />
      )}

      <aside
        className={clsx(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col bg-white shadow-xl transition-transform duration-300 lg:hidden",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <button
          onClick={() => setOpen(false)}
          className="absolute right-3 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
          aria-label="Fermer le menu"
        >
          <X className="h-5 w-5" strokeWidth={2} />
        </button>
        {sidebarContent}
      </aside>

      <aside className="hidden w-64 flex-col border-r border-gray-200 bg-white lg:flex">
        {sidebarContent}
      </aside>
    </>
  );
}
