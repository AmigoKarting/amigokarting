"use client";

import { useState } from "react";
import procedures from "@/data/procedures.json";
import { useAuth } from "@/hooks/useAuth";
import { roleKbCategory } from "@/lib/roles";
import {
  AlertTriangle, Siren, HeartPulse, CloudRain, Wrench, Wallet, Search, Users,
  HelpCircle, Shield, Flag, Phone, Package, Flame, Megaphone, ThermometerSnowflake,
  ChevronDown, type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  AlertTriangle, Siren, HeartPulse, CloudRain, Wrench, Wallet, Search, Users,
  HelpCircle, Shield, Flag, Phone, Package, Flame, Megaphone, ThermometerSnowflake,
};

interface Proc {
  id: string; category: string; urgent: boolean; icon: string;
  title: string; when: string; steps: string[];
}

function noAccent(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
}

export default function ProceduresPage() {
  const { employee } = useAuth();
  const myCat = roleKbCategory(employee?.role); // "caisse" | "piste" | null
  const [open, setOpen] = useState<string | null>(null);
  const [q, setQ] = useState("");

  const all = (procedures as Proc[]).filter(
    (p) => !myCat || p.category === myCat || p.category === "general"
  );
  const nq = noAccent(q.trim());
  const list = nq
    ? all.filter((p) => noAccent(p.title + " " + p.when + " " + p.steps.join(" ")).includes(nq))
    : all;
  const urgent = list.filter((p) => p.urgent);
  const normal = list.filter((p) => !p.urgent);

  function Card({ p }: { p: Proc }) {
    const Icon = ICONS[p.icon] || HelpCircle;
    const isOpen = open === p.id;
    return (
      <div className={`overflow-hidden rounded-xl border bg-white shadow-sm ${p.urgent ? "border-red-200" : "border-gray-200"}`}>
        <button onClick={() => setOpen(isOpen ? null : p.id)} className="flex w-full items-center gap-3 p-4 text-left">
          <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${p.urgent ? "bg-red-50 text-red-600" : "bg-orange-50 text-brand-600"}`}>
            <Icon className="h-5 w-5" strokeWidth={2} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-900">{p.title}</p>
            <p className="truncate text-xs text-gray-500">{p.when}</p>
          </div>
          <ChevronDown className={`h-5 w-5 shrink-0 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`} strokeWidth={2} />
        </button>
        {isOpen && (
          <div className="border-t border-gray-100 px-4 pb-4 pt-3">
            <ol className="space-y-2">
              {p.steps.map((s, i) => (
                <li key={i} className="flex gap-3 text-sm text-gray-700">
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ${p.urgent ? "bg-red-100 text-red-700" : "bg-orange-100 text-brand-700"}`}>{i + 1}</span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-5 lg:max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900">En cas de…</h1>
        <p className="mt-1 text-sm text-gray-500">La marche à suivre, tout de suite. Touche une situation.</p>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" strokeWidth={2} />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Chercher une situation…"
          className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-4 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
        />
      </div>

      {urgent.length > 0 && (
        <div className="space-y-2">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-red-600">
            <Siren className="h-4 w-4" strokeWidth={2} /> Urgences
          </p>
          {urgent.map((p) => <Card key={p.id} p={p} />)}
        </div>
      )}

      {normal.length > 0 && (
        <div className="space-y-2">
          {urgent.length > 0 && <p className="text-sm font-semibold text-gray-700">Situations courantes</p>}
          {normal.map((p) => <Card key={p.id} p={p} />)}
        </div>
      )}

      {list.length === 0 && (
        <p className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500 shadow-sm">
          Aucune procédure pour « {q} ».
        </p>
      )}
    </div>
  );
}
