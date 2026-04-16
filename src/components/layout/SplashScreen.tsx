"use client";

import { useState, useEffect } from "react";

export function SplashScreen() {
  const [phase, setPhase] = useState<"visible" | "fade" | "gone">("visible");

  useEffect(() => {
    // Check if already seen this session
    if (sessionStorage.getItem("splash-seen")) {
      setPhase("gone");
      return;
    }

    // Phase 1: Show splash for 2 seconds
    const fadeTimer = setTimeout(() => setPhase("fade"), 2000);
    // Phase 2: Remove from DOM after fade animation
    const goneTimer = setTimeout(() => {
      setPhase("gone");
      sessionStorage.setItem("splash-seen", "1");
    }, 2600);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(goneTimer);
    };
  }, []);

  if (phase === "gone") return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 transition-opacity duration-600 ${
        phase === "fade" ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Damier animé en fond */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.04]">
        <div
          className="absolute inset-0 animate-[checkerSlide_8s_linear_infinite]"
          style={{
            backgroundImage: "repeating-conic-gradient(#fff 0% 25%, transparent 0% 50%)",
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* Lignes de vitesse */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-0 top-[30%] h-[1px] w-full animate-[speedLine_1.5s_ease-out_0.3s_both] bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />
        <div className="absolute left-0 top-[50%] h-[1px] w-full animate-[speedLine_1.5s_ease-out_0.5s_both] bg-gradient-to-r from-transparent via-orange-500/20 to-transparent" />
        <div className="absolute left-0 top-[70%] h-[1px] w-full animate-[speedLine_1.5s_ease-out_0.7s_both] bg-gradient-to-r from-transparent via-orange-500/30 to-transparent" />
      </div>

      {/* Contenu central */}
      <div className="relative flex flex-col items-center">
        {/* Logo */}
        <div className="animate-[logoEntry_0.8s_cubic-bezier(0.16,1,0.3,1)_both]">
          <div className="flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-orange-500 to-orange-600 shadow-2xl shadow-orange-500/40">
            <img
              src="/logo-karting.png"
              alt="Amigo Karting"
              className="h-20 w-20 object-contain"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = "none";
              }}
            />
          </div>
        </div>

        {/* Nom */}
        <h1 className="mt-6 animate-[textEntry_0.6s_cubic-bezier(0.16,1,0.3,1)_0.3s_both] text-3xl font-bold tracking-tight text-white">
          Amigo Karting
        </h1>

        {/* Sous-titre */}
        <p className="mt-2 animate-[textEntry_0.6s_cubic-bezier(0.16,1,0.3,1)_0.5s_both] text-sm tracking-widest text-orange-400/80">
          PORTAIL DES EMPLOYÉS
        </p>

        {/* Ligne de chargement */}
        <div className="mt-8 h-[2px] w-48 animate-[textEntry_0.6s_cubic-bezier(0.16,1,0.3,1)_0.7s_both] overflow-hidden rounded-full bg-white/10">
          <div className="h-full animate-[loadBar_1.5s_ease-in-out_0.8s_both] rounded-full bg-gradient-to-r from-orange-500 to-orange-400" />
        </div>
      </div>

      <style>{`
        @keyframes logoEntry {
          from { opacity: 0; transform: scale(0.5) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes textEntry {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes loadBar {
          from { width: 0%; }
          to { width: 100%; }
        }
        @keyframes speedLine {
          from { opacity: 0; transform: translateX(-100%); }
          50% { opacity: 1; }
          to { opacity: 0; transform: translateX(100%); }
        }
        @keyframes checkerSlide {
          from { transform: translateX(0); }
          to { transform: translateX(50px); }
        }
      `}</style>
    </div>
  );
}
