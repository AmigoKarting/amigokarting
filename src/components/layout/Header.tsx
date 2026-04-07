"use client";
import { useAuth } from "@/hooks/useAuth";

export function Header() {
  const { employee } = useAuth();

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <h1 className="text-lg font-bold text-brand-600">Amigo Karting</h1>
      {employee && (
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-100 text-sm font-medium text-brand-700">
            {employee.first_name[0]}
          </div>
          <span className="text-sm text-gray-600">{employee.first_name}</span>
        </div>
      )}
    </header>
  );
}
