"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

// ─── Types ─────────────────────────────────────────────────────
type LoginStep = "name" | "pin" | "loading" | "success" | "error" | "register" | "register_loading" | "register_success";

interface LoginResponse {
  success: boolean;
  email: string;
  password: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    role: "employee" | "manager";
  };
  error?: string;
}

// ─── Composant PIN Input (4 cases individuelles) ───────────────
function PinInput({
  value,
  onChange,
  onComplete,
  disabled,
}: {
  value: string;
  onChange: (pin: string) => void;
  onComplete: (pin: string) => void;
  disabled: boolean;
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(4, "").split("").slice(0, 4);

  function handleChange(index: number, char: string) {
    if (!/^\d?$/.test(char)) return;

    const newDigits = [...digits];
    newDigits[index] = char;
    const newPin = newDigits.join("").replace(/\s/g, "");
    onChange(newPin);

    if (char && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    if (newPin.length === 4) {
      onComplete(newPin);
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newDigits = [...digits];
      newDigits[index - 1] = "";
      onChange(newDigits.join("").replace(/\s/g, ""));
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 4);
    if (pasted.length > 0) {
      onChange(pasted);
      const focusIdx = Math.min(pasted.length, 3);
      inputRefs.current[focusIdx]?.focus();
      if (pasted.length === 4) onComplete(pasted);
    }
  }

  // Focus le premier input au montage
  useEffect(() => {
    const timer = setTimeout(() => inputRefs.current[0]?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex justify-center gap-3" onPaste={handlePaste}>
      {[0, 1, 2, 3].map((i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digits[i]?.trim() || ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          disabled={disabled}
          aria-label={`Chiffre ${i + 1}`}
          className="h-16 w-14 rounded-xl border-2 border-gray-200 bg-white text-center text-2xl
                     font-bold text-gray-900 caret-transparent transition-all duration-200
                     placeholder:text-gray-300
                     focus:border-orange-400 focus:outline-none focus:ring-4 focus:ring-orange-100
                     disabled:bg-gray-50 disabled:opacity-60"
        />
      ))}
    </div>
  );
}

// ─── Icône karting SVG ─────────────────────────────────────────
function KartingIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Casque */}
      <path
        d="M32 8C20 8 12 17 12 26v4c0 2 1 4 3 5h34c2-1 3-3 3-5v-4C52 17 44 8 32 8z"
        fill="currentColor"
        opacity="0.15"
      />
      <path
        d="M32 8C20 8 12 17 12 26v4c0 2 1 4 3 5h34c2-1 3-3 3-5v-4C52 17 44 8 32 8z"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Visière */}
      <path
        d="M16 24h32v4c0 1-1 3-3 4H19c-2-1-3-3-3-4v-4z"
        fill="currentColor"
        opacity="0.3"
      />
      {/* Kart body */}
      <rect x="14" y="40" width="36" height="10" rx="3" fill="currentColor" opacity="0.15" stroke="currentColor" strokeWidth="2.5" />
      {/* Roues */}
      <circle cx="20" cy="54" r="5" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="2.5" />
      <circle cx="44" cy="54" r="5" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="2.5" />
      {/* Volant */}
      <path d="M28 40v-3a4 4 0 018 0v3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

// ─── Composant principal ───────────────────────────────────────
export default function LoginPage() {
  const [step, setStep] = useState<LoginStep>("name");
  const [firstName, setFirstName] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [employeeName, setEmployeeName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const supabase = createClient();

  // Focus sur le champ prénom au chargement
  useEffect(() => {
    nameInputRef.current?.focus();
  }, []);

  // ─── Passer à l'étape PIN ─────────────────────────────────
  function handleNameSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (firstName.trim().length < 2) {
      setError("Entre ton prénom (au moins 2 lettres)");
      return;
    }
    setError("");
    setStep("pin");
  }

  // ─── Soumettre le login ────────────────────────────────────
  const handleLogin = useCallback(
    async (pinValue: string) => {
      setStep("loading");
      setError("");

      try {
        // Étape 1 : Appeler notre API pour vérifier l'employé
        // et préparer le compte Supabase Auth
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: firstName.trim(),
            pin: pinValue,
          }),
        });

        const data: LoginResponse = await res.json();

        if (!res.ok || !data.success) {
          setError(data.error || "Identifiant ou code incorrect.");
          setPin("");
          setStep("pin");
          return;
        }

        // Étape 2 : Se connecter côté client via Supabase Auth
        // pour obtenir la session et le JWT
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: data.email,
          password: data.password,
        });

        if (authError) {
          console.error("Erreur Supabase Auth:", authError);
          setError("Erreur de connexion. Réessaie.");
          setPin("");
          setStep("pin");
          return;
        }

        // Succès !
        setEmployeeName(data.employee.firstName);
        setStep("success");

        // Rediriger après un court délai pour l'animation
        setTimeout(() => {
          const destination = (data.employee.role === "manager" || data.employee.role === "patron" || data.employee.role === "developpeur") ? "/admin" : "/dashboard";
          router.push(destination);
          router.refresh();
        }, 1200);
      } catch (err) {
        console.error("Erreur login:", err);
        setError("Impossible de se connecter. Vérifie ta connexion internet.");
        setPin("");
        setStep("pin");
      }
    },
    [firstName, router, supabase]
  );

  // ─── Revenir au prénom ─────────────────────────────────────
  function goBackToName() {
    setStep("name");
    setPin("");
    setError("");
  }

  // ─── Aller à l'inscription ──────────────────────────────────
  function goToRegister() {
    setStep("register");
    setError("");
    setRegLastName("");
    setRegPhone("");
  }

  // ─── Formater le téléphone ──────────────────────────────────
  function formatPhoneInput(raw: string): string {
    const digits = raw.replace(/\D/g, "").slice(0, 10);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  // ─── Soumettre l'inscription ────────────────────────────────
  const handleRegister = useCallback(async () => {
    if (!firstName.trim() || !regLastName.trim() || !regPhone.trim()) {
      setError("Tous les champs sont requis.");
      return;
    }

    const digits = regPhone.replace(/\D/g, "");
    if (digits.length < 10) {
      setError("Le numéro doit contenir 10 chiffres.");
      return;
    }

    setStep("register_loading");
    setError("");

    try {
      // Créer le compte
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: regLastName.trim(),
          phone: regPhone.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Erreur lors de la création.");
        setStep("register");
        return;
      }

      // Se connecter automatiquement
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

      if (authError) {
        setError("Compte créé ! Connecte-toi avec ton prénom et tes 4 derniers chiffres.");
        setStep("name");
        return;
      }

      setEmployeeName(data.employee.firstName);
      setStep("register_success");

      setTimeout(() => {
        router.push("/dashboard");
        router.refresh();
      }, 1500);
    } catch (err) {
      setError("Erreur de connexion. Réessaie.");
      setStep("register");
    }
  }, [firstName, regLastName, regPhone, router, supabase]);

  // ─── Rendu ─────────────────────────────────────────────────
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      {/* Particules déco (damier de course) */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.03]">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "repeating-conic-gradient(#fff 0% 25%, transparent 0% 50%)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Carte principale */}
      <div className="relative w-full max-w-sm">
        {/* Badge orange en haut */}
        <div className="absolute -top-5 left-1/2 z-10 -translate-x-1/2">
          <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl shadow-lg shadow-orange-500/30">
            <img src="/logo-karting.png" alt="Amigo Karting" className="h-16 w-16 rounded-xl" />
          </div>
        </div>

        <div className="overflow-hidden rounded-3xl bg-white pt-12 shadow-2xl shadow-black/30">
          {/* En-tête */}
          <div className="px-8 pb-2 text-center">
            <h1 className="text-xl font-bold tracking-tight text-gray-900">
              Amigo Karting
            </h1>
            <p className="mt-1 text-sm text-gray-400">Portail des employés</p>
          </div>

          {/* Contenu dynamique par étape */}
          <div className="px-8 pb-8 pt-4">
            {/* ─── ÉTAPE 1 : Prénom ──────────────────────── */}
            {step === "name" && (
              <form onSubmit={handleNameSubmit} className="space-y-5">
                <div>
                  <label
                    htmlFor="firstName"
                    className="mb-1.5 block text-sm font-medium text-gray-600"
                  >
                    Ton prénom
                  </label>
                  <input
                    ref={nameInputRef}
                    id="firstName"
                    type="text"
                    autoComplete="given-name"
                    autoCapitalize="words"
                    spellCheck={false}
                    value={firstName}
                    onChange={(e) => {
                      setFirstName(e.target.value);
                      setError("");
                    }}
                    placeholder="ex. Marc"
                    required
                    className="w-full rounded-xl border-2 border-gray-200 bg-gray-50/50 px-4 py-3.5
                               text-base text-gray-900 transition-all duration-200
                               placeholder:text-gray-300
                               focus:border-orange-400 focus:bg-white focus:outline-none
                               focus:ring-4 focus:ring-orange-100"
                  />
                </div>

                {error && (
                  <div className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={firstName.trim().length < 2}
                  className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r
                             from-orange-500 to-orange-600 px-4 py-3.5 text-sm font-semibold
                             text-white shadow-md shadow-orange-500/25 transition-all duration-200
                             hover:shadow-lg hover:shadow-orange-500/30
                             active:scale-[0.98]
                             disabled:from-gray-300 disabled:to-gray-300 disabled:shadow-none"
                >
                  <span className="relative z-10">Continuer</span>
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-500 group-hover:translate-x-full" />
                </button>

                <button
                  type="button"
                  onClick={goToRegister}
                  className="w-full text-center text-xs text-gray-400 transition hover:text-orange-500"
                >
                  Nouveau ? <span className="underline">Créer mon compte</span>
                </button>
              </form>
            )}

            {/* ─── ÉTAPE 2 : Code PIN ────────────────────── */}
            {(step === "pin" || step === "loading") && (
              <div className="space-y-5">
                <div className="text-center">
                  <button
                    onClick={goBackToName}
                    disabled={step === "loading"}
                    className="mb-3 inline-flex items-center gap-1 text-xs text-gray-400 transition hover:text-gray-600 disabled:opacity-50"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Modifier le prénom
                  </button>
                  <p className="text-sm text-gray-500">
                    Salut{" "}
                    <span className="font-semibold text-gray-900">
                      {firstName.trim()}
                    </span>{" "}
                    ! Entre ton code.
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    4 derniers chiffres de ton numéro de téléphone
                  </p>
                </div>

                <PinInput
                  value={pin}
                  onChange={setPin}
                  onComplete={handleLogin}
                  disabled={step === "loading"}
                />

                {step === "loading" && (
                  <div className="flex justify-center pt-2">
                    <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-gray-200 border-t-orange-500" />
                  </div>
                )}

                {error && (
                  <div className="rounded-xl bg-red-50 px-4 py-2.5 text-center text-sm text-red-600">
                    {error}
                  </div>
                )}
              </div>
            )}

            {/* ─── ÉTAPE 3 : Succès login ─────────────────── */}
            {step === "success" && (
              <div className="space-y-4 py-4 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                  <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900">
                    Bienvenue {employeeName} !
                  </p>
                  <p className="mt-1 text-sm text-gray-400">
                    Redirection en cours...
                  </p>
                </div>
                <div className="flex justify-center">
                  <div className="h-1 w-24 overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full animate-[progress_1.2s_ease-in-out_forwards] rounded-full bg-green-500" />
                  </div>
                </div>
              </div>
            )}

            {/* ─── INSCRIPTION ─────────────────────────────── */}
            {(step === "register" || step === "register_loading") && (
              <div className="space-y-5">
                <div className="text-center">
                  <button
                    onClick={goBackToName}
                    disabled={step === "register_loading"}
                    className="mb-3 inline-flex items-center gap-1 text-xs text-gray-400 transition hover:text-gray-600 disabled:opacity-50"
                  >
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                    </svg>
                    Retour à la connexion
                  </button>
                  <p className="text-sm font-medium text-gray-700">Créer ton compte</p>
                  <p className="mt-1 text-xs text-gray-400">
                    Remplis tes informations pour commencer
                  </p>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-600">
                    Prénom
                  </label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="Ton prénom"
                    disabled={step === "register_loading"}
                    className="w-full rounded-xl border-2 border-gray-200 bg-gray-50/50 px-4 py-3
                               text-sm text-gray-900 transition
                               placeholder:text-gray-300
                               focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100
                               disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-600">
                    Nom de famille
                  </label>
                  <input
                    type="text"
                    value={regLastName}
                    onChange={(e) => setRegLastName(e.target.value)}
                    placeholder="Ton nom"
                    disabled={step === "register_loading"}
                    className="w-full rounded-xl border-2 border-gray-200 bg-gray-50/50 px-4 py-3
                               text-sm text-gray-900 transition
                               placeholder:text-gray-300
                               focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100
                               disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-600">
                    Numéro de téléphone
                  </label>
                  <input
                    type="tel"
                    inputMode="tel"
                    value={regPhone}
                    onChange={(e) => setRegPhone(formatPhoneInput(e.target.value))}
                    placeholder="514-555-1234"
                    disabled={step === "register_loading"}
                    className="w-full rounded-xl border-2 border-gray-200 bg-gray-50/50 px-4 py-3
                               text-sm text-gray-900 transition
                               placeholder:text-gray-300
                               focus:border-orange-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-orange-100
                               disabled:opacity-60"
                  />
                  <p className="mt-1.5 text-xs text-gray-400">
                    Les 4 derniers chiffres seront ton code de connexion
                  </p>
                </div>

                {error && (
                  <div className="rounded-xl bg-red-50 px-4 py-2.5 text-center text-sm text-red-600">
                    {error}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleRegister}
                  disabled={
                    step === "register_loading" ||
                    firstName.trim().length < 2 ||
                    regLastName.trim().length < 2 ||
                    regPhone.replace(/\D/g, "").length < 10
                  }
                  className="group relative w-full overflow-hidden rounded-xl bg-gradient-to-r
                             from-orange-500 to-orange-600 px-4 py-3.5 text-sm font-semibold
                             text-white shadow-md shadow-orange-500/25 transition-all duration-200
                             hover:shadow-lg hover:shadow-orange-500/30
                             active:scale-[0.98]
                             disabled:from-gray-300 disabled:to-gray-300 disabled:shadow-none"
                >
                  {step === "register_loading" ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      Création...
                    </span>
                  ) : (
                    <span className="relative z-10">Créer mon compte</span>
                  )}
                </button>
              </div>
            )}

            {/* ─── INSCRIPTION RÉUSSIE ─────────────────────── */}
            {step === "register_success" && (
              <div className="space-y-4 py-4 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
                  <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-900">
                    Bienvenue {employeeName} !
                  </p>
                  <p className="mt-1 text-sm text-gray-400">
                    Ton compte est créé. Redirection...
                  </p>
                </div>
                <div className="flex justify-center">
                  <div className="h-1 w-24 overflow-hidden rounded-full bg-gray-100">
                    <div className="h-full animate-[progress_1.2s_ease-in-out_forwards] rounded-full bg-green-500" />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Pied de page */}
          <div className="border-t border-gray-100 bg-gray-50/50 px-8 py-4">
            <p className="text-center text-xs text-gray-400">
              {step === "name"
                ? "Utilise le prénom donné par ton gestionnaire"
                : step === "pin"
                  ? "Problème de connexion ? Parle à ton gestionnaire."
                  : step === "register"
                    ? "Tes 4 derniers chiffres de téléphone = ton mot de passe"
                    : "\u00A0"}
            </p>
          </div>
        </div>
      </div>

      {/* Lien aide */}
      <a href="/aide-install" className="mt-6 inline-flex items-center gap-2 text-sm text-gray-400 transition hover:text-white">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
        </svg>
        Comment installer l'app sur mon téléphone ?
      </a>

      {/* CSS pour l'animation de la barre de progression */}
      <style>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}
