import { clsx } from "clsx";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger";
}

export function Badge({ children, variant = "default" }: BadgeProps) {
  return (
    <span className={clsx(
      "inline-flex rounded-md px-2 py-0.5 text-xs font-medium",
      {
        "bg-gray-100 text-gray-600": variant === "default",
        "bg-green-50 text-green-700": variant === "success",
        "bg-amber-50 text-amber-700": variant === "warning",
        "bg-red-50 text-red-700": variant === "danger",
      }
    )}>
      {children}
    </span>
  );
}
