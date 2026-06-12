"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import {
  Home, GraduationCap, MessageCircle, TrendingUp, LayoutDashboard, Users,
  BarChart3, Menu as MenuIcon, type LucideIcon,
} from "lucide-react";
import { useMenuStore } from "@/stores/menuStore";

const ICONS: Record<string, LucideIcon> = {
  Home, GraduationCap, MessageCircle, TrendingUp, LayoutDashboard, Users, BarChart: BarChart3,
};

interface Item { label: string; href: string; icon: string }

// Pages « plein écran » avec leur propre saisie en bas : on cache la barre
// pour ne pas chevaucher la zone de texte.
export const HIDE_ON = ["/qa", "/conversations", "/admin/my-qa", "/admin/my-conversations"];

export function BottomNav({ items }: { items: Item[] }) {
  const pathname = usePathname();
  const setOpen = useMenuStore((s) => s.setOpen);

  if (HIDE_ON.includes(pathname)) return null;

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 backdrop-blur lg:hidden"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto grid max-w-lg grid-cols-5">
        {items.slice(0, 4).map((item) => {
          const Icon = ICONS[item.icon] || Home;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={clsx(
                "flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium transition active:scale-95",
                active ? "text-brand-600" : "text-gray-400"
              )}
            >
              <Icon className="h-[22px] w-[22px]" strokeWidth={2} />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <button
          onClick={() => setOpen(true)}
          className="flex flex-col items-center justify-center gap-0.5 py-2.5 text-[10px] font-medium text-gray-400 transition active:scale-95 active:text-brand-600"
        >
          <MenuIcon className="h-[22px] w-[22px]" strokeWidth={2} />
          <span>Menu</span>
        </button>
      </div>
    </nav>
  );
}
