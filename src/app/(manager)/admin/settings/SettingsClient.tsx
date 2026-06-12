"use client";
import { useEffect, useState } from "react";
import { Bell, Check } from "lucide-react";

const DAYS = [
  { c: "Mon", l: "Lun" }, { c: "Tue", l: "Mar" }, { c: "Wed", l: "Mer" },
  { c: "Thu", l: "Jeu" }, { c: "Fri", l: "Ven" }, { c: "Sat", l: "Sam" }, { c: "Sun", l: "Dim" },
];

export function SettingsClient() {
  const [generating, setGenerating] = useState(false);

  // ─── Config des rappels ───────────────────────────────
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [enabled, setEnabled] = useState(true);
  const [hour, setHour] = useState(18);
  const [days, setDays] = useState<string[]>(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]);
  const [ficheDay, setFicheDay] = useState("Mon");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/reminder-config");
        if (res.ok) {
          const d = await res.json();
          setEnabled(d.enabled);
          setHour(d.hour);
          setDays(d.days);
          setFicheDay(d.ficheDay);
        }
      } catch {}
      setLoading(false);
    })();
  }, []);

  function toggleDay(c: string) {
    setDays((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
    setSaved(false);
  }

  async function save() {
    setSaving(true);
    setSaved(false);
    try {
      const res = await fetch("/api/admin/reminder-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled, hour, days, ficheDay }),
      });
      if (res.ok) setSaved(true);
    } catch {}
    setSaving(false);
  }

  async function handleGenerateQuestions() {
    setGenerating(true);
    await fetch("/api/admin/questions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "generate", topic: "Procédures de sécurité karting", count: 20 }),
    });
    setGenerating(false);
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Paramètres</h1>

      {/* ─── Rappels automatiques ─── */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2">
          <Bell className="h-5 w-5 text-brand-600" strokeWidth={2} />
          <h2 className="font-semibold text-gray-900">Rappels automatiques</h2>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Choisis quand les employés reçoivent les rappels (heure et jours).
        </p>

        {loading ? (
          <div className="mt-4 h-24 animate-pulse rounded-lg bg-gray-100" />
        ) : (
          <div className="mt-5 space-y-5">
            {/* Activer / désactiver */}
            <label className="flex items-center justify-between gap-3">
              <span className="text-sm font-medium text-gray-900">Activer les rappels</span>
              <button
                type="button"
                onClick={() => { setEnabled(!enabled); setSaved(false); }}
                className={`relative h-6 w-11 rounded-full transition ${enabled ? "bg-brand-600" : "bg-gray-300"}`}
                aria-pressed={enabled}
              >
                <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${enabled ? "left-[22px]" : "left-0.5"}`} />
              </button>
            </label>

            <div className={enabled ? "" : "pointer-events-none opacity-50"}>
              {/* Heure d'envoi */}
              <label className="block">
                <span className="text-sm font-medium text-gray-900">Heure d'envoi</span>
                <span className="ml-1 text-xs text-gray-400">(heure du Québec)</span>
                <select
                  value={hour}
                  onChange={(e) => { setHour(parseInt(e.target.value, 10)); setSaved(false); }}
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                >
                  {Array.from({ length: 24 }, (_, i) => (
                    <option key={i} value={i}>{i.toString().padStart(2, "0")} h 00</option>
                  ))}
                </select>
              </label>

              {/* Jours du rappel d'activité */}
              <div className="mt-5">
                <p className="text-sm font-medium text-gray-900">Jours du rappel « viens t'entraîner »</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {DAYS.map((d) => (
                    <button
                      key={d.c}
                      type="button"
                      onClick={() => toggleDay(d.c)}
                      className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition ${
                        days.includes(d.c)
                          ? "border-brand-600 bg-orange-50 text-brand-700"
                          : "border-gray-200 bg-white text-gray-500 hover:border-gray-300"
                      }`}
                    >
                      {d.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Jour du rappel fiche */}
              <label className="mt-5 block">
                <span className="text-sm font-medium text-gray-900">Jour du rappel « complète ta fiche »</span>
                <select
                  value={ficheDay}
                  onChange={(e) => { setFicheDay(e.target.value); setSaved(false); }}
                  className="mt-1 block w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:border-brand-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
                >
                  {DAYS.map((d) => (
                    <option key={d.c} value={d.c}>{d.l}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={save}
                disabled={saving}
                className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
              >
                {saving ? "Enregistrement…" : "Enregistrer"}
              </button>
              {saved && (
                <span className="flex items-center gap-1 text-sm text-green-600">
                  <Check className="h-4 w-4" strokeWidth={2} /> Enregistré
                </span>
              )}
            </div>
          </div>
        )}
      </section>

      {/* ─── Génération de questions IA ─── */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900">Génération de questions</h2>
        <p className="mt-1 text-sm text-gray-500">
          Générer des questions pour les conversations à partir des thèmes de formation.
        </p>
        <button
          onClick={handleGenerateQuestions}
          disabled={generating}
          className="mt-4 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
        >
          {generating ? "Génération en cours…" : "Générer 20 questions"}
        </button>
      </section>
    </div>
  );
}
