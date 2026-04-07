export function ProgressBar({ value, max = 100, label }: { value: number; max?: number; label?: string }) {
  const pct = Math.min(Math.round((value / max) * 100), 100);

  return (
    <div>
      {label && <p className="mb-1 text-sm text-gray-600">{label}</p>}
      <div className="h-3 w-full overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-brand-500 transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-right text-xs text-gray-400">{pct}%</p>
    </div>
  );
}
