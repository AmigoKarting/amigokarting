"use client";

import { useState, useEffect, useCallback } from "react";

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Vérifier si déjà installé
    if (window.matchMedia("(display-mode: standalone)").matches) {
      setIsInstalled(true);
      return;
    }

    // Détecter iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    // Vérifier si on a déjà fermé le banner récemment
    const dismissed = localStorage.getItem("install-dismissed");
    if (dismissed) {
      const dismissedAt = new Date(dismissed);
      const daysSince = (Date.now() - dismissedAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince < 7) return; // Ne pas remontrer avant 7 jours
    }

    // Sur iOS, montrer le guide après 3 secondes
    if (ios) {
      const timer = setTimeout(() => setShowBanner(true), 3000);
      return () => clearTimeout(timer);
    }

    // Sur Android/Chrome, écouter l'événement beforeinstallprompt
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setTimeout(() => setShowBanner(true), 2000);
    };

    window.addEventListener("beforeinstallprompt", handler);

    // Enregistrer le service worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = useCallback(async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const result = await deferredPrompt.userChoice;

    if (result.outcome === "accepted") {
      setShowBanner(false);
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
  }, [deferredPrompt, isIOS]);

  const handleDismiss = useCallback(() => {
    setShowBanner(false);
    setShowIOSGuide(false);
    localStorage.setItem("install-dismissed", new Date().toISOString());
  }, []);

  if (isInstalled || !showBanner) return null;

  return (
    <>
      {/* Banner d'installation */}
      {!showIOSGuide && (
        <div className="fixed bottom-0 left-0 right-0 z-50 safe-bottom">
          <div className="mx-auto max-w-lg p-4">
            <div className="overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-gray-200">
              <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-5 py-3">
                <p className="text-center text-sm font-semibold text-white">
                  Installe l'app sur ton téléphone
                </p>
              </div>
              <div className="px-5 py-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-orange-100">
                    <span className="text-xl font-bold text-orange-600">AK</span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900">Amigo Karting</p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      Accès rapide sans ouvrir le navigateur. Comme une vraie app.
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={handleInstall}
                    className="flex-1 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition active:scale-[0.98]"
                  >
                    Installer
                  </button>
                  <button
                    onClick={handleDismiss}
                    className="rounded-xl bg-gray-100 px-4 py-3 text-sm font-medium text-gray-500 transition hover:bg-gray-200"
                  >
                    Plus tard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Guide iOS (Safari ne supporte pas l'install automatique) */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center">
          <div className="w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 text-center">
              <p className="text-lg font-bold text-white">Installer sur iPhone</p>
            </div>
            <div className="space-y-5 px-6 py-5">
              {/* Étape 1 */}
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-600">
                  1
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Appuie sur le bouton partage</p>
                  <p className="mt-0.5 text-xs text-gray-500">L'icône carré avec la flèche vers le haut</p>
                  <div className="mt-2 flex justify-center">
                    <svg className="h-8 w-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15m0-3l-3-3m0 0l-3 3m3-3V15" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Étape 2 */}
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-600">
                  2
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Défile vers le bas</p>
                  <p className="mt-0.5 text-xs text-gray-500">Et appuie sur "Sur l'écran d'accueil"</p>
                </div>
              </div>

              {/* Étape 3 */}
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-orange-100 text-sm font-bold text-orange-600">
                  3
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Appuie "Ajouter"</p>
                  <p className="mt-0.5 text-xs text-gray-500">L'icône Amigo Karting apparaît sur ton écran d'accueil</p>
                </div>
              </div>

              <button
                onClick={handleDismiss}
                className="w-full rounded-xl bg-gray-100 px-4 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-200"
              >
                J'ai compris
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
