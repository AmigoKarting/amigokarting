"use client";

import { useEffect, useRef, useState } from "react";
import { CheckCircle2, Lightbulb, AlertTriangle, Timer } from "lucide-react";

// Rendu interactif et agréable d'une formation (texte brut structuré) :
// sections stylées, encadrés « À retenir » et « Exemple », avertissements,
// temps de lecture et barre de progression.

function noAccent(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function isHeading(line: string): boolean {
  const t = line.trim();
  if (t.length < 3 || t.length > 78 || t.startsWith("•")) return false;
  const letters = t.replace(/[^a-zA-ZÀ-ÿ]/g, "");
  if (letters.length < 2) return false;
  const upper = (t.match(/[A-ZÀ-Þ]/g) || []).length;
  return upper / letters.length >= 0.6;
}

type SecType = "intro" | "section" | "retenir" | "exemple";

function classify(heading: string): SecType {
  const n = noAccent(heading);
  if (/\ba ?retenir\b/.test(n)) return "retenir";
  if (/(exemple|mise en situation|cas avance|cas pratique)/.test(n)) return "exemple";
  return "section";
}

interface Section {
  type: SecType;
  heading: string | null;
  lines: string[];
}

function parse(content: string): Section[] {
  const out: Section[] = [];
  let cur: Section = { type: "intro", heading: null, lines: [] };
  for (const raw of content.split("\n")) {
    const t = raw.trim();
    if (isHeading(t)) {
      if (cur.heading || cur.lines.some((l) => l.trim())) out.push(cur);
      cur = { type: classify(t), heading: t, lines: [] };
    } else {
      cur.lines.push(raw);
    }
  }
  if (cur.heading || cur.lines.some((l) => l.trim())) out.push(cur);
  return out;
}

// Rend des lignes (puces groupées en liste, paragraphes, avertissements)
function renderLines(lines: string[], variant: "check" | "dot" | "plain") {
  const blocks: JSX.Element[] = [];
  let bullets: string[] = [];
  const flush = (key: string) => {
    if (!bullets.length) return;
    blocks.push(
      <ul key={key} className="my-2 space-y-1.5">
        {bullets.map((b, i) => (
          <li key={i} className="flex gap-2 text-[15px] leading-relaxed text-gray-700">
            {variant === "check" ? (
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-green-600" strokeWidth={2} />
            ) : (
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand-600" />
            )}
            <span>{b}</span>
          </li>
        ))}
      </ul>
    );
    bullets = [];
  };
  lines.forEach((raw, idx) => {
    const t = raw.trim();
    if (!t) {
      flush(`u${idx}`);
      return;
    }
    if (t.startsWith("•")) {
      bullets.push(t.replace(/^•\s?/, ""));
      return;
    }
    flush(`u${idx}`);
    if (/^(avertissement|attention|danger|important)\b/i.test(noAccent(t))) {
      blocks.push(
        <p key={`w${idx}`} className="my-2 flex gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[15px] leading-relaxed text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" strokeWidth={2} />
          <span>{t}</span>
        </p>
      );
    } else {
      blocks.push(
        <p key={`p${idx}`} className="my-2 text-[15px] leading-relaxed text-gray-700">
          {t}
        </p>
      );
    }
  });
  flush("uend");
  return blocks;
}

function nice(heading: string): string {
  // "À RETENIR" -> "À retenir" ; garde les autres tels quels
  if (/^a ?retenir/.test(noAccent(heading))) return "À retenir";
  if (/^exemples? concrets?/.test(noAccent(heading))) return "Exemples concrets";
  return heading.charAt(0) + heading.slice(1).toLowerCase();
}

export function FormationContent({ content }: { content: string }) {
  const sections = parse(content);
  const minutes = Math.max(1, Math.round(content.trim().split(/\s+/).length / 180));
  const rootRef = useRef<HTMLDivElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    let scroller: HTMLElement | Window = window;
    let node: HTMLElement | null = el.parentElement;
    while (node) {
      const oy = getComputedStyle(node).overflowY;
      if (oy === "auto" || oy === "scroll") {
        scroller = node;
        break;
      }
      node = node.parentElement;
    }
    const update = () => {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const total = rect.height - vh;
      const passed = Math.min(Math.max(-rect.top + 120, 0), Math.max(total, 1));
      setProgress(total > 0 ? Math.round((passed / total) * 100) : 100);
    };
    update();
    (scroller as any).addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      (scroller as any).removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div ref={rootRef} className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
      {/* Barre de progression de lecture */}
      <div className="sticky top-0 z-10 h-1.5 bg-gray-100">
        <div
          className="h-full rounded-r-full bg-brand-600 transition-all duration-150"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="p-5 sm:p-6">
        {/* Méta : temps de lecture */}
        <div className="mb-4 flex items-center gap-2 text-xs font-medium text-gray-500">
          <span className="inline-flex items-center gap-1 rounded-md bg-orange-50 px-2.5 py-1 text-brand-700">
            <Timer className="h-3.5 w-3.5" strokeWidth={2} /> ~{minutes} min de lecture
          </span>
          <span>{sections.filter((s) => s.heading).length} sections</span>
        </div>

        <div className="space-y-5">
          {sections.map((sec, i) => {
            const hasBody = sec.lines.some((l) => l.trim());
            // évite un encadré coloré vide (ex. « EXEMPLES CONCRETS » suivi de sous-titres)
            if (!hasBody && (sec.type === "exemple" || sec.type === "retenir")) return null;

            if (sec.type === "retenir") {
              return (
                <div key={i} className="rounded-xl border border-green-200 bg-green-50 p-4">
                  <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-green-700">
                    <CheckCircle2 className="h-4 w-4" strokeWidth={2} /> {nice(sec.heading || "À retenir")}
                  </h3>
                  {renderLines(sec.lines, "check")}
                </div>
              );
            }
            if (sec.type === "exemple") {
              return (
                <div key={i} className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                  <h3 className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-blue-700">
                    <Lightbulb className="h-4 w-4" strokeWidth={2} /> {nice(sec.heading || "Exemple")}
                  </h3>
                  {renderLines(sec.lines, "dot")}
                </div>
              );
            }
            if (sec.type === "section") {
              return (
                <div key={i}>
                  <h3 className="mb-1 flex items-center gap-2 border-b border-gray-100 pb-1.5 text-base font-semibold text-gray-900">
                    <span className="inline-block h-4 w-1 rounded-full bg-brand-600" />
                    {sec.heading}
                  </h3>
                  {renderLines(sec.lines, "dot")}
                </div>
              );
            }
            // intro (texte avant la première section)
            return <div key={i}>{renderLines(sec.lines, "dot")}</div>;
          })}
        </div>
      </div>
    </div>
  );
}
