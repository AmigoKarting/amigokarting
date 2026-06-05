"use client";

import { useState, type ReactNode } from "react";
import { Folder, ChevronDown, ChevronRight } from "lucide-react";

export function CollapsibleCategory({
  title,
  count,
  defaultOpen = false,
  children,
}: {
  title: string;
  count: number;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition hover:bg-gray-50"
      >
        <span className="flex items-center gap-2 text-gray-800">
          <Folder className="h-4 w-4 text-orange-500" />
          <span className="text-sm font-semibold uppercase tracking-wide">{title}</span>
          <span className="rounded-full bg-orange-50 px-2 py-0.5 text-xs font-medium text-orange-600">
            {count}
          </span>
        </span>
        {open ? (
          <ChevronDown className="h-5 w-5 shrink-0 text-gray-400" />
        ) : (
          <ChevronRight className="h-5 w-5 shrink-0 text-gray-400" />
        )}
      </button>

      {open && <div className="border-t border-gray-100 p-3">{children}</div>}
    </div>
  );
}
