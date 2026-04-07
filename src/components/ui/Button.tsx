import { forwardRef, ButtonHTMLAttributes } from "react";
import { clsx } from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          "inline-flex items-center justify-center rounded-lg font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50",
          {
            "bg-brand-500 text-white hover:bg-brand-600 focus:ring-brand-500": variant === "primary",
            "bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500": variant === "secondary",
            "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500": variant === "danger",
            "text-gray-600 hover:bg-gray-100 hover:text-gray-900": variant === "ghost",
            "px-3 py-1.5 text-sm": size === "sm",
            "px-4 py-2 text-sm": size === "md",
            "px-6 py-3 text-base": size === "lg",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
