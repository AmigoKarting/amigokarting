"use client";

import { useState, useEffect } from "react";

export function SplashScreen() {
  const [phase, setPhase] = useState<"visible" | "fade" | "gone">("visible");

  useEffect(() => {
    if (sessionStorage.getItem("splash-seen")) {
      setPhase("gone");
      return;
    }
    const fadeTimer = setTimeout(() => setPhase("fade"), 3000);
    const goneTimer = setTimeout(() => {
      setPhase("gone");
      sessionStorage.setItem("splash-seen", "1");
    }, 3800);
    return () => { clearTimeout(fadeTimer); clearTimeout(goneTimer); };
  }, []);

  if (phase === "gone") return null;

  return (
    <div className={`fixed inset-0 z-[9999] flex items-center justify-center transition-opacity duration-700 ${phase === "fade" ? "opacity-0" : "opacity-100"}`}
      style={{ background: "linear-gradient(135deg, #1a1a1a 0%, #0a0a0a 50%, #1a1a1a 100%)" }}>

      <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-[0.06]">
        <div className="absolute inset-0 animate-[checkerSlide_6s_linear_infinite]"
          style={{ backgroundImage: "repeating-conic-gradient(#fff 0% 25%, transparent 0% 50%)", backgroundSize: "60px 60px" }} />
      </div>

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-0 top-[25%] h-[2px] animate-[speedLine_2s_ease-out_0.5s_both]" style={{ width: "100%", background: "linear-gradient(90deg, transparent, #EA580C, transparent)" }} />
        <div className="absolute left-0 top-[45%] h-[2px] animate-[speedLine_2s_ease-out_0.8s_both]" style={{ width: "100%", background: "linear-gradient(90deg, transparent, #F97316, transparent)" }} />
        <div className="absolute left-0 top-[65%] h-[2px] animate-[speedLine_2s_ease-out_1.1s_both]" style={{ width: "100%", background: "linear-gradient(90deg, transparent, #EA580C, transparent)" }} />
        <div className="absolute left-0 top-[80%] h-[1px] animate-[speedLine_2s_ease-out_1.3s_both]" style={{ width: "100%", background: "linear-gradient(90deg, transparent, #F97316, transparent)" }} />
      </div>

      <div className="relative flex flex-col items-center px-6">
        <div className="animate-[logoEntry_1s_cubic-bezier(0.16,1,0.3,1)_both]">
          <div className="flex h-32 w-32 items-center justify-center rounded-[2rem] shadow-2xl"
            style={{ background: "linear-gradient(135deg, #EA580C, #F97316)", boxShadow: "0 0 60px rgba(234,88,12,0.5)" }}>
            <img src="/logo-karting.png" alt="" className="h-28 w-28 object-contain" 
              onError={(e) => { (e.target as HTMLImageElement).outerHTML = '<span style="font-size:48px;font-weight:bold;color:white">AK</span>'; }} />
          </div>
        </div>

        <h1 className="mt-8 animate-[textEntry_0.8s_cubic-bezier(0.16,1,0.3,1)_0.4s_both] text-center text-4xl font-bold tracking-tight text-white">
          Amigo Karting
        </h1>

        <p className="mt-3 animate-[textEntry_0.8s_cubic-bezier(0.16,1,0.3,1)_0.7s_both] text-center text-sm font-medium tracking-[0.3em]"
          style={{ color: "#F97316" }}>
          PORTAIL DES EMPLOYÉS
        </p>

        <div className="mt-10 h-[3px] w-56 animate-[textEntry_0.8s_cubic-bezier(0.16,1,0.3,1)_1s_both] overflow-hidden rounded-full"
          style={{ background: "rgba(255,255,255,0.1)" }}>
          <div className="h-full animate-[loadBar_2s_ease-in-out_1s_both] rounded-full"
            style={{ background: "linear-gradient(90deg, #EA580C, #F97316)" }} />
        </div>
      </div>

      <style>{`
        @keyframes logoEntry {
          from { opacity: 0; transform: scale(0.3) translateY(30px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes textEntry {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes loadBar {
          from { width: 0%; }
          to { width: 100%; }
        }
        @keyframes speedLine {
          from { opacity: 0; transform: translateX(-100%); }
          40% { opacity: 1; }
          to { opacity: 0; transform: translateX(100%); }
        }
        @keyframes checkerSlide {
          from { transform: translateX(0); }
          to { transform: translateX(60px); }
        }
      `}</style>
    </div>
  );
}