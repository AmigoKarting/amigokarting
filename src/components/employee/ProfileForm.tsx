"use client";

import { useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Employee } from "@/types/employee";

// ─── Types ─────────────────────────────────────────────────────
type FormFields = {
  date_of_birth: string;
  phone: string;
  address: string;
  city: string;
  postal_code: string;
  province: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  uniform_size_shirt: string;
};

type FieldErrors = Partial<Record<keyof FormFields, string>>;
type SaveStatus = "idle" | "saving" | "saved" | "error";

const SHIRT_SIZES = ["XS", "S", "M", "L", "XL", "XXL", "XXXL"] as const;
const PROVINCES = [
  { value: "QC", label: "Québec" },
  { value: "ON", label: "Ontario" },
  { value: "NB", label: "Nouveau-Brunswick" },
  { value: "NS", label: "Nouvelle-Écosse" },
  { value: "PE", label: "Île-du-Prince-Édouard" },
  { value: "NL", label: "Terre-Neuve" },
  { value: "MB", label: "Manitoba" },
  { value: "SK", label: "Saskatchewan" },
  { value: "AB", label: "Alberta" },
  { value: "BC", label: "Colombie-Britannique" },
] as const;

// ─── Helpers ───────────────────────────────────────────────────

function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
}

function formatPostalCode(raw: string): string {
  const clean = raw.replace(/[^a-zA-Z0-9]/g, "").toUpperCase().slice(0, 6);
  if (clean.length <= 3) return clean;
  return `${clean.slice(0, 3)} ${clean.slice(3)}`;
}

function validateField(field: keyof FormFields, value: string): string | null {
  const v = value.trim();
  switch (field) {
    case "phone":
      if (!v) return "Le numéro de téléphone est requis";
      if (v.replace(/\D/g, "").length < 10) return "Le numéro doit contenir 10 chiffres";
      return null;
    case "address":
      if (!v) return "L'adresse est requise";
      if (v.length < 5) return "L'adresse semble trop courte";
      return null;
    case "city":
      if (!v) return "La ville est requise";
      return null;
    case "postal_code":
      if (!v) return "Le code postal est requis";
      if (!/^[A-Z]\d[A-Z]\s?\d[A-Z]\d$/i.test(v)) return "Format invalide (ex: H2X 1Y4)";
      return null;
    case "emergency_contact_name":
      if (!v) return "Le nom du contact d'urgence est requis";
      if (v.length < 2) return "Le nom semble trop court";
      return null;
    case "emergency_contact_phone":
      if (!v) return "Le numéro d'urgence est requis";
      if (v.replace(/\D/g, "").length < 10) return "Le numéro doit contenir 10 chiffres";
      return null;
    case "uniform_size_shirt":
      if (!v) return "La taille de chandail est requise";
      return null;
    default:
      return null;
  }
}

const REQUIRED_FIELDS: (keyof FormFields)[] = [
  "phone", "address", "city", "postal_code",
  "emergency_contact_name", "emergency_contact_phone",
  "uniform_size_shirt",
];

const SECTIONS = [
  {
    id: "address",
    title: "Adresse complète",
    icon: "📍",
    fields: ["date_of_birth", "phone", "address", "city", "postal_code", "province"] as (keyof FormFields)[],
  },
  {
    id: "emergency",
    title: "Contact d'urgence",
    icon: "🚨",
    fields: ["emergency_contact_name", "emergency_contact_phone"] as (keyof FormFields)[],
  },
  {
    id: "uniform",
    title: "Grandeurs d'uniforme",
    icon: "👕",
    fields: ["uniform_size_shirt"] as (keyof FormFields)[],
  },
] as const;

// ─── Composant principal ───────────────────────────────────────
export function ProfileForm({ employee }: { employee: Employee }) {
  const supabase = createClient();

  const [form, setForm] = useState<FormFields>({
    date_of_birth: employee.date_of_birth || "",
    phone: employee.phone || "",
    address: employee.address || "",
    city: employee.city || "",
    postal_code: employee.postal_code || "",
    province: employee.province || "QC",
    emergency_contact_name: employee.emergency_contact_name || "",
    emergency_contact_phone: employee.emergency_contact_phone || "",
    uniform_size_shirt: employee.uniform_size_shirt || "",
  });

  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Set<keyof FormFields>>(new Set());
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [saveError, setSaveError] = useState("");

  const updateField = useCallback((field: keyof FormFields, raw: string) => {
    let value = raw;
    if (field === "phone" || field === "emergency_contact_phone") {
      value = formatPhone(raw);
    } else if (field === "postal_code") {
      value = formatPostalCode(raw);
    }
    setForm((prev) => ({ ...prev, [field]: value }));
    setStatus("idle");
    setSaveError("");
    if (touched.has(field)) {
      const err = validateField(field, value);
      setErrors((prev) => {
        const next = { ...prev };
        if (err) next[field] = err;
        else delete next[field];
        return next;
      });
    }
  }, [touched]);

  const handleBlur = useCallback((field: keyof FormFields) => {
    setTouched((prev) => new Set(prev).add(field));
    const err = validateField(field, form[field]);
    setErrors((prev) => {
      const next = { ...prev };
      if (err) next[field] = err;
      else delete next[field];
      return next;
    });
  }, [form]);

  const sectionCompletion = useMemo(() => {
    return SECTIONS.map((section) => {
      const requiredInSection = section.fields.filter((f) =>
        REQUIRED_FIELDS.includes(f)
      );
      const filledCount = requiredInSection.filter(
        (f) => form[f].trim().length > 0 && !validateField(f, form[f])
      ).length;
      return {
        ...section,
        filled: filledCount,
        total: requiredInSection.length,
        complete: filledCount === requiredInSection.length,
      };
    });
  }, [form]);

  const totalRequired = REQUIRED_FIELDS.length;
  const totalFilled = REQUIRED_FIELDS.filter(
    (f) => form[f].trim().length > 0 && !validateField(f, form[f])
  ).length;

  const handleSave = useCallback(async () => {
    const allTouched = new Set<keyof FormFields>(
      Object.keys(form) as (keyof FormFields)[]
    );
    setTouched(allTouched);

    const newErrors: FieldErrors = {};
    for (const field of REQUIRED_FIELDS) {
      const err = validateField(field, form[field]);
      if (err) newErrors[field] = err;
    }
    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstErrorField = REQUIRED_FIELDS.find((f) => newErrors[f]);
      if (firstErrorField) {
        document.getElementById(`field-${firstErrorField}`)?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }
      return;
    }

    setStatus("saving");
    setSaveError("");

    const { error } = await supabase
      .from("employees")
      .update({
        date_of_birth: form.date_of_birth || null,
        phone: form.phone.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        postal_code: form.postal_code.trim().toUpperCase(),
        province: form.province,
        emergency_contact_name: form.emergency_contact_name.trim(),
        emergency_contact_phone: form.emergency_contact_phone.trim(),
        uniform_size_shirt: form.uniform_size_shirt,
      })
      .eq("id", employee.id);

    if (error) {
      console.error("Erreur sauvegarde:", error);
      setStatus("error");
      setSaveError("Erreur lors de la sauvegarde. Réessaie.");
    } else {
      setStatus("saved");
    }
  }, [form, employee.id, supabase]);

  return (
    <div className="space-y-6">
      {/* ─── Barre de progression globale ──────────────────── */}
      <div className="rounded-xl bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700">
            Complétion de ta fiche
          </span>
          <span className="text-sm font-bold text-brand-600">
            {totalFilled}/{totalRequired}
          </span>
        </div>
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-gray-100">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${(totalFilled / totalRequired) * 100}%`,
              backgroundColor:
                totalFilled === totalRequired ? "#16a34a" : "#f97316",
            }}
          />
        </div>
        <div className="mt-3 flex gap-4">
          {sectionCompletion.map((s) => (
            <div key={s.id} className="flex items-center gap-1.5 text-xs">
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] ${
                  s.complete
                    ? "bg-green-100 text-green-700"
                    : "bg-orange-100 text-orange-700"
                }`}
              >
                {s.complete ? "✓" : s.filled}
              </span>
              <span className="text-gray-500">{s.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ─── Section 1 : Adresse complète ──────────────────── */}
      <section className="rounded-xl bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4">
          <span className="text-lg">{SECTIONS[0].icon}</span>
          <h2 className="font-semibold text-gray-900">{SECTIONS[0].title}</h2>
          {sectionCompletion[0].complete && (
            <span className="ml-auto rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              Complet
            </span>
          )}
        </div>
        <div className="space-y-4 px-6 py-5">
          {/* Date de naissance */}
          <div id="field-date_of_birth">
            <label htmlFor="date_of_birth" className="mb-1.5 block text-sm font-medium text-gray-700">
              Date de naissance
            </label>
            <input
              id="date_of_birth"
              type="date"
              value={form.date_of_birth}
              onChange={(e) => updateField("date_of_birth", e.target.value)}
              className="w-full rounded-lg border-2 border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 transition focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
            />
          </div>

          {/* Téléphone */}
          <FieldInput
            id="phone"
            label="Numéro de téléphone"
            value={form.phone}
            onChange={(v) => updateField("phone", v)}
            onBlur={() => handleBlur("phone")}
            error={touched.has("phone") ? errors.phone : undefined}
            placeholder="514-555-1234"
            type="tel"
            inputMode="tel"
            required
          />

          {/* Adresse */}
          <FieldInput
            id="address"
            label="Adresse"
            value={form.address}
            onChange={(v) => updateField("address", v)}
            onBlur={() => handleBlur("address")}
            error={touched.has("address") ? errors.address : undefined}
            placeholder="123 rue Principale"
            autoComplete="street-address"
            required
          />

          {/* Ville + Code postal + Province */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <FieldInput
              id="city"
              label="Ville"
              value={form.city}
              onChange={(v) => updateField("city", v)}
              onBlur={() => handleBlur("city")}
              error={touched.has("city") ? errors.city : undefined}
              placeholder="Québec"
              autoComplete="address-level2"
              required
            />
            <FieldInput
              id="postal_code"
              label="Code postal"
              value={form.postal_code}
              onChange={(v) => updateField("postal_code", v)}
              onBlur={() => handleBlur("postal_code")}
              error={touched.has("postal_code") ? errors.postal_code : undefined}
              placeholder="G1K 1A1"
              autoComplete="postal-code"
              maxLength={7}
              required
            />
            <div id="field-province">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Province
              </label>
              <select
                value={form.province}
                onChange={(e) => updateField("province", e.target.value)}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 transition
                           focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100"
              >
                {PROVINCES.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Section 2 : Contact d'urgence ─────────────────── */}
      <section className="rounded-xl bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4">
          <span className="text-lg">{SECTIONS[1].icon}</span>
          <h2 className="font-semibold text-gray-900">{SECTIONS[1].title}</h2>
          {sectionCompletion[1].complete && (
            <span className="ml-auto rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              Complet
            </span>
          )}
        </div>
        <div className="space-y-4 px-6 py-5">
          <FieldInput
            id="emergency_contact_name"
            label="Nom complet"
            value={form.emergency_contact_name}
            onChange={(v) => updateField("emergency_contact_name", v)}
            onBlur={() => handleBlur("emergency_contact_name")}
            error={touched.has("emergency_contact_name") ? errors.emergency_contact_name : undefined}
            placeholder="Marie Tremblay"
            autoComplete="off"
            required
          />
          <FieldInput
            id="emergency_contact_phone"
            label="Numéro de téléphone"
            value={form.emergency_contact_phone}
            onChange={(v) => updateField("emergency_contact_phone", v)}
            onBlur={() => handleBlur("emergency_contact_phone")}
            error={touched.has("emergency_contact_phone") ? errors.emergency_contact_phone : undefined}
            placeholder="514-555-5678"
            type="tel"
            inputMode="tel"
            required
          />
        </div>
      </section>

      {/* ─── Section 3 : Uniformes ─────────────────────────── */}
      <section className="rounded-xl bg-white shadow-sm">
        <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-4">
          <span className="text-lg">{SECTIONS[2].icon}</span>
          <h2 className="font-semibold text-gray-900">{SECTIONS[2].title}</h2>
          {sectionCompletion[2].complete && (
            <span className="ml-auto rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
              Complet
            </span>
          )}
        </div>
        <div className="space-y-4 px-6 py-5">
          <div id="field-uniform_size_shirt">
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Chandail <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2">
              {SHIRT_SIZES.map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() => {
                    updateField("uniform_size_shirt", size);
                    handleBlur("uniform_size_shirt");
                  }}
                  className={`rounded-lg border-2 px-4 py-2 text-sm font-medium transition ${
                    form.uniform_size_shirt === size
                      ? "border-orange-400 bg-orange-50 text-orange-700"
                      : "border-gray-200 bg-white text-gray-600 hover:border-gray-300"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
            {touched.has("uniform_size_shirt") && errors.uniform_size_shirt && (
              <p className="mt-1.5 text-xs text-red-500">
                {errors.uniform_size_shirt}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ─── Bouton sauvegarder ────────────────────────────── */}
      <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={handleSave}
          disabled={status === "saving"}
          className="relative flex items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-r from-orange-500
                     to-orange-600 px-8 py-3 text-sm font-semibold text-white shadow-md shadow-orange-500/25
                     transition-all hover:shadow-lg hover:shadow-orange-500/30 active:scale-[0.98]
                     disabled:from-gray-300 disabled:to-gray-300 disabled:shadow-none"
        >
          {status === "saving" ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Sauvegarde...
            </>
          ) : (
            "Sauvegarder ma fiche"
          )}
        </button>

        {status === "saved" && (
          <div className="flex items-center gap-2 rounded-lg bg-green-50 px-4 py-2.5 text-sm text-green-700">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            Fiche sauvegardée avec succès !
          </div>
        )}
        {status === "error" && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2.5 text-sm text-red-600">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            {saveError}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Composant réutilisable : champ de saisie ──────────────────
function FieldInput({
  id,
  label,
  value,
  onChange,
  onBlur,
  error,
  placeholder = "",
  type = "text",
  inputMode,
  autoComplete,
  maxLength,
  required = false,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  error?: string;
  placeholder?: string;
  type?: string;
  inputMode?: "text" | "tel" | "numeric";
  autoComplete?: string;
  maxLength?: number;
  required?: boolean;
}) {
  const hasError = !!error;
  const isFilled = value.trim().length > 0 && !hasError;

  return (
    <div id={`field-${id}`}>
      <label
        htmlFor={id}
        className="mb-1.5 flex items-center gap-1 text-sm font-medium text-gray-700"
      >
        {label}
        {required && <span className="text-red-500">*</span>}
        {isFilled && required && (
          <svg className="ml-auto h-3.5 w-3.5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        )}
      </label>
      <input
        id={id}
        type={type}
        inputMode={inputMode}
        autoComplete={autoComplete}
        maxLength={maxLength}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        placeholder={placeholder}
        className={`w-full rounded-lg border-2 px-3 py-2.5 text-sm text-gray-900 transition-all duration-200
                    placeholder:text-gray-300 focus:outline-none focus:ring-2 ${
          hasError
            ? "border-red-300 bg-red-50/50 focus:border-red-400 focus:ring-red-100"
            : isFilled
              ? "border-green-200 bg-green-50/30 focus:border-green-400 focus:ring-green-100"
              : "border-gray-200 bg-white focus:border-orange-400 focus:ring-orange-100"
        }`}
      />
      {hasError && (
        <p className="mt-1.5 text-xs text-red-500">{error}</p>
      )}
    </div>
  );
}