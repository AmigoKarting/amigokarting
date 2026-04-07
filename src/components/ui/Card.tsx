import { ReactNode } from "react";
import { clsx } from "clsx";

interface CardProps {
  children: ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
}

export function Card({ children, className, padding = "md" }: CardProps) {
  return (
    <div className={clsx(
      "rounded-xl bg-white shadow-sm",
      { "p-4": padding === "sm", "p-6": padding === "md", "p-8": padding === "lg" },
      className
    )}>
      {children}
    </div>
  );
}
