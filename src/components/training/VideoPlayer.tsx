"use client";

import { useRef, useEffect, useCallback, useState } from "react";

// ─── Types ─────────────────────────────────────────────────────
interface VideoPlayerProps {
  videoUrl: string;
  videoId: string;
  videoTitle?: string;
  durationSec?: number;
  initialWatchedSec?: number;
  initialMaxPosition?: number;
  initialCompleted?: boolean;
  onComplete?: () => void;
}

type PlayerState = "loading" | "ready" | "playing" | "paused" | "ended" | "error";

const SAVE_INTERVAL_MS = 8_000; // Sauvegarder toutes les 8 secondes
const SEEK_TOLERANCE = 2;       // Tolérance de 2 secondes pour le seeking

// ─── Helpers ───────────────────────────────────────────────────
function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

// ─── Composant principal ───────────────────────────────────────
export function VideoPlayer({
  videoUrl,
  videoId,
  videoTitle,
  durationSec,
  initialWatchedSec = 0,
  initialMaxPosition = 0,
  initialCompleted = false,
  onComplete,
}: VideoPlayerProps) {
  // ─── Refs ──────────────────────────────────────────────────
  const videoRef = useRef<HTMLVideoElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const maxPositionRef = useRef(initialMaxPosition);
  const lastSavedRef = useRef(initialWatchedSec);
  const isSavingRef = useRef(false);

  // ─── State ─────────────────────────────────────────────────
  const [playerState, setPlayerState] = useState<PlayerState>("loading");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(durationSec || 0);
  const [completed, setCompleted] = useState(initialCompleted);
  const [showSeekWarning, setShowSeekWarning] = useState(false);
  const [saveIndicator, setSaveIndicator] = useState(false);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);

  // ─── Sauvegarde dans Supabase ──────────────────────────────
  const saveProgress = useCallback(
    async (isCompleted: boolean = false) => {
      if (isSavingRef.current) return;
      isSavingRef.current = true;

      const watchedSec = Math.floor(maxPositionRef.current);

      // Ne pas sauvegarder si rien n'a changé
      if (!isCompleted && watchedSec === lastSavedRef.current) {
        isSavingRef.current = false;
        return;
      }

      try {
        const res = await fetch("/api/training/progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            videoId,
            watchedSec,
            maxPosition: watchedSec,
            completed: isCompleted,
          }),
        });

        if (res.ok) {
          lastSavedRef.current = watchedSec;
          setSaveIndicator(true);
          setTimeout(() => setSaveIndicator(false), 1500);
        }
      } catch (err) {
        console.error("Erreur sauvegarde progression:", err);
      } finally {
        isSavingRef.current = false;
      }
    },
    [videoId]
  );

  // ─── Sauvegarde automatique périodique ─────────────────────
  useEffect(() => {
    if (completed) return;

    const interval = setInterval(() => {
      if (maxPositionRef.current > 0) {
        saveProgress(false);
      }
    }, SAVE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [videoId, completed, saveProgress]);

  // ─── Sauvegarder quand l'utilisateur quitte la page ───────
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (maxPositionRef.current > lastSavedRef.current) {
        // Utiliser sendBeacon pour fiabilité
        const data = JSON.stringify({
          videoId,
          watchedSec: Math.floor(maxPositionRef.current),
          maxPosition: Math.floor(maxPositionRef.current),
          completed: false,
        });
        navigator.sendBeacon("/api/training/progress", new Blob([data], { type: "application/json" }));
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [videoId]);

  // ─── Événements vidéo ─────────────────────────────────────
  const handleLoadedMetadata = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    setDuration(video.duration);
    setPlayerState("ready");

    // Reprendre là où l'employé s'est arrêté
    if (initialWatchedSec > 0 && !initialCompleted) {
      video.currentTime = Math.min(initialWatchedSec, video.duration);
      maxPositionRef.current = Math.max(maxPositionRef.current, initialWatchedSec);
    }
  }, [initialWatchedSec, initialCompleted]);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    setCurrentTime(video.currentTime);

    // Mettre à jour la position max atteinte
    if (video.currentTime > maxPositionRef.current) {
      maxPositionRef.current = video.currentTime;
    }
  }, []);

  // ─── ANTI-AVANCE RAPIDE ───────────────────────────────────
  const handleSeeking = useCallback(() => {
    const video = videoRef.current;
    if (!video || completed) return;

    const maxAllowed = maxPositionRef.current + SEEK_TOLERANCE;

    if (video.currentTime > maxAllowed) {
      // BLOQUÉ — ramener à la position max
      video.currentTime = maxPositionRef.current;
      setShowSeekWarning(true);
      setTimeout(() => setShowSeekWarning(false), 2500);
    }
    // Reculer est toujours permis
  }, [completed]);

  const handlePlay = useCallback(() => setPlayerState("playing"), []);
  const handlePause = useCallback(() => setPlayerState("paused"), []);
  const handleError = useCallback(() => setPlayerState("error"), []);

  const handleEnded = useCallback(async () => {
    setPlayerState("ended");
    setCompleted(true);
    await saveProgress(true);
    onComplete?.();
  }, [saveProgress, onComplete]);

  // ─── Contrôles personnalisés ──────────────────────────────
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused || video.ended) {
      video.play();
    } else {
      video.pause();
    }
  }, []);

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setMuted(!muted);
  }, [muted]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const val = parseFloat(e.target.value);
    video.volume = val;
    setVolume(val);
    if (val > 0 && muted) {
      video.muted = false;
      setMuted(false);
    }
  }, [muted]);

  // ─── Clic sur la barre de progression ─────────────────────
  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const video = videoRef.current;
      const bar = progressBarRef.current;
      if (!video || !bar || duration === 0) return;

      const rect = bar.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const pct = Math.max(0, Math.min(1, clickX / rect.width));
      const targetTime = pct * duration;

      // Seul le recul ou aller jusqu'au max est permis
      if (completed || targetTime <= maxPositionRef.current + SEEK_TOLERANCE) {
        video.currentTime = targetTime;
      } else {
        setShowSeekWarning(true);
        setTimeout(() => setShowSeekWarning(false), 2500);
      }
    },
    [duration, completed]
  );

  // ─── Raccourci clavier espace ─────────────────────────────
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        togglePlay();
      }
    },
    [togglePlay]
  );

  // ─── Calculs pour le rendu ────────────────────────────────
  const progressPct = duration > 0 ? (currentTime / duration) * 100 : 0;
  const maxAllowedPct = duration > 0 ? (maxPositionRef.current / duration) * 100 : 0;
  const isPlaying = playerState === "playing";

  // ─── Rendu ────────────────────────────────────────────────
  return (
    <div
      className="group relative overflow-hidden rounded-xl bg-black"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      {/* ─── Vidéo (contrôles natifs cachés) ─────────────── */}
      <video
        ref={videoRef}
        src={videoUrl}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onSeeking={handleSeeking}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={handleEnded}
        onError={handleError}
        preload="metadata"
        playsInline
        controlsList="nodownload noplaybackrate"
        disablePictureInPicture
        className="w-full cursor-pointer"
        onClick={togglePlay}
      />

      {/* ─── Overlay : bouton play central ───────────────── */}
      {(playerState === "ready" || playerState === "paused") && !completed && (
        <button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/20 transition-opacity hover:bg-black/30"
          aria-label="Lire la vidéo"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg transition-transform hover:scale-110">
            <svg className="ml-1 h-7 w-7 text-gray-900" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </button>
      )}

      {/* ─── Overlay : vidéo complétée ───────────────────── */}
      {completed && playerState !== "playing" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="mt-3 text-sm font-medium text-white">Vidéo complétée</p>
          <button
            onClick={() => {
              const video = videoRef.current;
              if (video) {
                video.currentTime = 0;
                video.play();
              }
            }}
            className="mt-2 rounded-lg bg-white/20 px-4 py-1.5 text-xs text-white transition hover:bg-white/30"
          >
            Revoir
          </button>
        </div>
      )}

      {/* ─── Avertissement anti-avance rapide ────────────── */}
      {showSeekWarning && (
        <div className="absolute left-1/2 top-4 z-30 -translate-x-1/2 animate-pulse rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white shadow-lg">
          Tu ne peux pas avancer la vidéo
        </div>
      )}

      {/* ─── Indicateur de sauvegarde ────────────────────── */}
      {saveIndicator && (
        <div className="absolute right-3 top-3 z-30 flex items-center gap-1.5 rounded-md bg-black/60 px-2.5 py-1 text-xs text-green-400">
          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Sauvegardé
        </div>
      )}

      {/* ─── Titre vidéo (en haut) ───────────────────────── */}
      {videoTitle && (
        <div className="pointer-events-none absolute left-0 right-0 top-0 bg-gradient-to-b from-black/60 to-transparent px-4 pb-8 pt-3 opacity-0 transition-opacity group-hover:opacity-100">
          <p className="text-sm font-medium text-white">{videoTitle}</p>
        </div>
      )}

      {/* ─── Barre de contrôle custom (en bas) ───────────── */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-4 pb-3 pt-8 opacity-0 transition-opacity group-hover:opacity-100">
        {/* Barre de progression */}
        <div
          ref={progressBarRef}
          onClick={handleProgressClick}
          className="relative mb-3 h-1.5 cursor-pointer rounded-full bg-white/20 transition-all group-hover:h-2.5"
          role="progressbar"
          aria-valuenow={Math.round(progressPct)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          {/* Zone autorisée (gris clair) — jusqu'où l'employé peut naviguer */}
          {!completed && (
            <div
              className="absolute inset-y-0 left-0 rounded-full bg-white/20"
              style={{ width: `${Math.min(maxAllowedPct, 100)}%` }}
            />
          )}
          {/* Progression actuelle (orange) */}
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-orange-500 transition-[width] duration-200"
            style={{ width: `${Math.min(progressPct, 100)}%` }}
          />
          {/* Curseur */}
          <div
            className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white opacity-0 shadow-md transition-opacity group-hover:opacity-100"
            style={{ left: `${Math.min(progressPct, 100)}%` }}
          />
        </div>

        {/* Contrôles */}
        <div className="flex items-center gap-3">
          {/* Play/Pause */}
          <button onClick={togglePlay} className="text-white transition hover:text-orange-400" aria-label={isPlaying ? "Pause" : "Lecture"}>
            {isPlaying ? (
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>

          {/* Volume */}
          <div className="flex items-center gap-1.5">
            <button onClick={toggleMute} className="text-white transition hover:text-orange-400" aria-label={muted ? "Activer le son" : "Couper le son"}>
              {muted || volume === 0 ? (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                </svg>
              ) : (
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M12 6.253v11.494m0 0L8.293 14.04H6a1 1 0 01-1-1v-2.08a1 1 0 011-1h2.293L12 6.253z" />
                </svg>
              )}
            </button>
            <input
              type="range"
              min={0} max={1} step={0.05}
              value={muted ? 0 : volume}
              onChange={handleVolumeChange}
              className="h-1 w-16 cursor-pointer appearance-none rounded-full bg-white/30 accent-orange-500
                         [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:appearance-none
                         [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
              aria-label="Volume"
            />
          </div>

          {/* Timer */}
          <span className="ml-auto font-mono text-xs tabular-nums text-white/80">
            {formatTime(currentTime)} / {formatTime(duration)}
          </span>

          {/* Vitesse (seulement 0.75x et 1x — pas de 1.5x/2x qui serait de la triche) */}
          <button
            onClick={() => {
              const video = videoRef.current;
              if (!video) return;
              const newRate = playbackRate === 1 ? 0.75 : 1;
              video.playbackRate = newRate;
              setPlaybackRate(newRate);
            }}
            className="rounded bg-white/10 px-2 py-0.5 text-xs text-white/80 transition hover:bg-white/20"
            aria-label="Vitesse de lecture"
          >
            {playbackRate}x
          </button>

          {/* Plein écran */}
          <button
            onClick={() => videoRef.current?.requestFullscreen?.()}
            className="text-white/80 transition hover:text-white"
            aria-label="Plein écran"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 8V4m0 0h4M4 4l5 5m11-5h-4m4 0v4m0-4l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5h-4m4 0v-4m0 4l-5-5" />
            </svg>
          </button>
        </div>
      </div>

      {/* ─── Erreur de chargement ────────────────────────── */}
      {playerState === "error" && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900">
          <svg className="mb-3 h-10 w-10 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
          <p className="text-sm text-gray-400">Impossible de charger la vidéo</p>
          <button
            onClick={() => videoRef.current?.load()}
            className="mt-2 rounded-lg bg-white/10 px-4 py-1.5 text-xs text-white transition hover:bg-white/20"
          >
            Réessayer
          </button>
        </div>
      )}

      {/* ─── Mini barre de progression (toujours visible) ── */}
      {!completed && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 group-hover:opacity-0">
          <div
            className="h-full bg-orange-500 transition-[width] duration-200"
            style={{ width: `${Math.min(progressPct, 100)}%` }}
          />
        </div>
      )}

      {/* ─── Badge complété (toujours visible) ───────────── */}
      {completed && (
        <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-md bg-green-600 px-2.5 py-1 text-xs font-medium text-white">
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Complétée
        </div>
      )}
    </div>
  );
}
