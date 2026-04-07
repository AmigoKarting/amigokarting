"use client";
import type { EmployeeMissingInfo } from "@/types/employee";
import Link from "next/link";

export function MissingInfoAlert({ missing }: { missing: EmployeeMissingInfo }) {
  if (!missing.has_missing_info) return null;

  const fields: string[] = [];
  if (missing.missing_phone) fields.push("téléphone");
  if (missing.missing_address) fields.push("adresse");
  if (missing.missing_emergency_contact) fields.push("contact d'urgence");
  if (missing.missing_uniform_shirt) fields.push("grandeur de chandail");

  return (
    <div className="rounded-lg border border-red-200 bg-red-50 p-4">
      <p className="text-sm font-medium text-red-800">
        Informations manquantes dans ta fiche :
      </p>
      <p className="mt-1 text-sm text-red-600">{fields.join(", ")}</p>
      <Link href="/profile" className="mt-2 inline-block text-sm font-medium text-red-700 underline hover:text-red-800">
        Compléter ma fiche
      </Link>
    </div>
  );
}
