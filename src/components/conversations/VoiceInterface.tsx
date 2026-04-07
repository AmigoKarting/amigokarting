"use client";

import { useState, useEffect, useRef, useCallback } from "react";

// ─── Types ─────────────────────────────────────────────────────
interface Message {
  id: string;
  role: "ai" | "employee";
  content: string;
  timestamp: Date;
}

type CallPhase =
  | "idle"
  | "connecting"
  | "listening"
  | "recording"
  | "processing"
  | "speaking"
  | "rating"
  | "ended";

function getSpeechRecognition(): any {
  if (typeof window === "undefined") return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

export function VoiceInterface() {
  const [phase, setPhase] = useState<CallPhase>("idle");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [transcript, setTranscript] = useState("");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [error, setError] = useState("");
  const [elapsedSec, setElapsedSec] = useState(0);
  const [rating, setRating] = useState(7);
  const [ratingComment, setRatingComment] = useState("");
  const [hasAskedRating, setHasAskedRating] = useState(false);
  const [browserSupported, setBrowserSupported] = useState(true);

  const startTimeRef = useRef<Date | null>(null);
  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (!getSpeechRecognition()) setBrowserSupported(false);
  }, []);

  useEffect(() => {
    if (!startTimeRef.current || phase === "idle" || phase === "ended") return;
    const interval = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startTimeRef.current!.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [phase]);

  useEffect(() => {
    if (elapsedSec >= 1200 && !hasAskedRating && phase === "listening") {
      setHasAskedRating(true);
      setPhase("rating");
    }
  }, [elapsedSec, hasAskedRating, phase]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, liveTranscript]);

  function formatTimer(sec: number): string {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  const speakText = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      setPhase("speaking");
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "fr-CA";
      utterance.rate = 1.05;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const frenchVoice = voices.find((v) => v.lang.startsWith("fr-CA"))
        || voices.find((v) => v.lang.startsWith("fr"))
        || null;
      if (frenchVoice) utterance.voice = frenchVoice;

      utterance.onend = () => { utteranceRef.current = null; resolve(); };
      utterance.onerror = () => { utteranceRef.current = null; resolve(); };

      utteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    });
  }, []);

  const skipSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    utteranceRef.current = null;
    setPhase("listening");
  }, []);

  const startSession = useCallback(async () => {
    setPhase("connecting");
    setError("");
    setMessages([]);

    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSessionId(data.sessionId);
      startTimeRef.current = new Date();

      setMessages([{
        id: `ai-${Date.now()}`,
        role: "ai",
        content: data.greeting,
        timestamp: new Date(),
      }]);

      window.speechSynthesis.getVoices();
      await speakText(data.greeting);
      setPhase("listening");
    } catch (err: any) {
      setError(err.message || "Impossible de démarrer la session.");
      setPhase("idle");
    }
  }, [speakText]);

  const startRecording = useCallback(() => {
    if (phase !== "listening") return;
    const SR = getSpeechRecognition();
    if (!SR) {
      setError("Utilise Chrome ou Edge pour la reconnaissance vocale.");
      return;
    }

    const recognition = new SR();
    recognition.lang = "fr-CA";
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      let interim = "";
      let final = "";
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      if (final) { setTranscript(final); setLiveTranscript(""); }
      else { setLiveTranscript(interim); }
    };

    recognition.onerror = (event: any) => {
      if (event.error === "not-allowed") {
        setError("Autorise le micro dans ton navigateur (icône cadenas à côté de l'URL).");
      } else if (event.error !== "aborted") {
        setError("Erreur micro. Réessaie.");
      }
      setPhase("listening");
    };

    recognition.onend = () => { recognitionRef.current = null; };

    recognitionRef.current = recognition;
    setPhase("recording");
    setTranscript("");
    setLiveTranscript("");
    recognition.start();
  }, [phase]);

  const stopRecording = useCallback(async () => {
    if (phase !== "recording") return;
    const recognition = recognitionRef.current;
    if (recognition) { recognition.stop(); recognitionRef.current = null; }

    await new Promise((r) => setTimeout(r, 400));
    setPhase("processing");

    const finalText = transcript || liveTranscript;
    if (!finalText.trim()) {
      setError("Je n'ai rien entendu. Parle plus fort ou rapproche-toi du micro.");
      setPhase("listening");
      setLiveTranscript("");
      return;
    }

    try {
      const userMsg: Message = {
        id: `user-${Date.now()}`,
        role: "employee",
        content: finalText,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, userMsg]);
      setLiveTranscript("");

      const history = messages.map((m) => ({
        role: m.role === "ai" ? ("assistant" as const) : ("user" as const),
        content: m.content,
      }));

      const convRes = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "message", sessionId, message: finalText, history }),
      });
      const convData = await convRes.json();
      if (!convRes.ok) throw new Error(convData.error);

      setMessages((prev) => [...prev, {
        id: `ai-${Date.now()}`,
        role: "ai",
        content: convData.response,
        timestamp: new Date(),
      }]);
      setTranscript("");

      await speakText(convData.response);
      setPhase("listening");
    } catch (err: any) {
      setError(err.message || "Erreur pendant le traitement.");
      setPhase("listening");
    }
  }, [phase, transcript, liveTranscript, messages, sessionId, speakText]);

  const endSession = useCallback(async (withRating: boolean = false) => {
    window.speechSynthesis.cancel();
    if (recognitionRef.current) { recognitionRef.current.stop(); recognitionRef.current = null; }

    const durationSec = startTimeRef.current
      ? Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000) : 0;

    try {
      await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "end", sessionId, durationSec,
          ...(withRating ? { rating, ratingComment } : {}),
        }),
      });
    } catch {}
    setPhase("ended");
  }, [sessionId, rating, ratingComment]);

  const submitRating = useCallback(async () => { await endSession(true); }, [endSession]);

  const isActive = !["idle", "ended"].includes(phase);
  const isRecordingPhase = phase === "recording";

  return (
    <div className="mx-auto max-w-lg">
      {!browserSupported && (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
            <svg className="h-7 w-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900">Navigateur non supporté</h2>
          <p className="mt-2 text-sm text-gray-500">
            La reconnaissance vocale nécessite <strong>Google Chrome</strong> ou <strong>Microsoft Edge</strong>.
          </p>
        </div>
      )}

      {browserSupported && phase === "idle" && (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-orange-100">
            <svg className="h-10 w-10 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Conversation vocale IA</h2>
          <p className="mt-2 text-sm text-gray-500">Révise les procédures en parlant avec l'assistant.</p>
          <div className="mt-5 space-y-2 text-left">
            {["Maintiens le bouton et parle", "L'IA écoute, répond et te corrige", "100% gratuit — micro du navigateur"].map((t) => (
              <div key={t} className="flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-2.5">
                <svg className="h-4 w-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm text-gray-600">{t}</span>
              </div>
            ))}
          </div>
          <button onClick={startSession} className="mt-6 w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-orange-500/25 transition-all hover:shadow-lg active:scale-[0.98]">
            Démarrer la conversation
          </button>
        </div>
      )}

      {isActive && phase !== "rating" && (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-4 text-center">
            <div className="flex items-center justify-center gap-2">
              {phase === "connecting" ? <span className="h-2 w-2 animate-pulse rounded-full bg-yellow-400" /> : <span className="h-2 w-2 rounded-full bg-green-400" />}
              <span className="text-xs font-medium text-gray-300">{phase === "connecting" ? "Connexion..." : "En ligne"}</span>
            </div>
            <p className="mt-1 text-lg font-semibold text-white">Assistant Amigo</p>
            <p className="font-mono text-sm tabular-nums text-gray-400">{formatTimer(elapsedSec)}</p>
          </div>

          <div className="h-48 overflow-y-auto sm:h-72 bg-gray-50 px-4 py-4">
            <div className="space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "employee" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${msg.role === "employee" ? "rounded-br-md bg-orange-500 text-white" : "rounded-bl-md bg-white text-gray-800 shadow-sm"}`}>
                    {msg.content}
                  </div>
                </div>
              ))}
              {(liveTranscript || (transcript && phase === "processing")) && (
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-br-md bg-orange-300 px-4 py-2.5 text-sm text-white">
                    {liveTranscript || transcript}{phase === "recording" && <span className="ml-1 animate-pulse">|</span>}
                  </div>
                </div>
              )}
              {phase === "processing" && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-gray-300" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-gray-300" style={{ animationDelay: "0.15s" }} />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-gray-300" style={{ animationDelay: "0.3s" }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {error && <div className="mx-4 mt-2 rounded-lg bg-red-50 px-3 py-2 text-center text-xs text-red-600">{error}</div>}

          <div className="border-t border-gray-100 px-6 py-5">
            <p className="mb-4 text-center text-xs text-gray-400">
              {phase === "connecting" && "Connexion en cours..."}
              {phase === "listening" && "Appuie et maintiens pour parler"}
              {phase === "recording" && "Je t'écoute... Relâche pour envoyer"}
              {phase === "processing" && "Traitement de ta réponse..."}
              {phase === "speaking" && "L'assistant parle..."}
            </p>

            <div className="flex items-center justify-center gap-6">
              <button onClick={() => setPhase("rating")} disabled={phase === "connecting" || phase === "processing"} className="flex h-12 w-12 items-center justify-center rounded-full bg-red-500 text-white transition hover:bg-red-600 disabled:opacity-50" aria-label="Terminer">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15.536 8.464a5 5 0 010 7.072M17.414 6.586a8 8 0 010 11.314M6.343 17.657l-1.414-1.414M3.515 14.828a8 8 0 010-5.656" /></svg>
              </button>

              <button onMouseDown={startRecording} onMouseUp={stopRecording} onTouchStart={(e) => { e.preventDefault(); startRecording(); }} onTouchEnd={(e) => { e.preventDefault(); stopRecording(); }} disabled={phase !== "listening" && phase !== "recording"} className={`flex h-20 w-20 items-center justify-center rounded-full text-white shadow-lg transition-all ${isRecordingPhase ? "scale-110 bg-red-500 shadow-red-500/30" : phase === "listening" ? "bg-orange-500 shadow-orange-500/25 hover:shadow-orange-500/40" : "bg-gray-300 shadow-none"}`} aria-label="Maintenir pour parler">
                {isRecordingPhase ? (
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map((i) => (<div key={i} className="w-1 animate-pulse rounded-full bg-white" style={{ height: `${12 + Math.random() * 16}px`, animationDelay: `${i * 0.1}s`, animationDuration: "0.5s" }} />))}
                  </div>
                ) : (
                  <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg>
                )}
              </button>

              <button onClick={skipSpeaking} disabled={phase !== "speaking"} className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-gray-600 transition hover:bg-gray-300 disabled:opacity-30" aria-label="Passer">
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 8.689c0-.864.933-1.405 1.683-.977l7.108 4.061a1.125 1.125 0 010 1.954l-7.108 4.061A1.125 1.125 0 013 16.811V8.69zM12.75 8.689c0-.864.933-1.405 1.683-.977l7.108 4.061a1.125 1.125 0 010 1.954l-7.108 4.061a1.125 1.125 0 01-1.683-.977V8.69z" /></svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {phase === "rating" && (
        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <h3 className="text-center text-lg font-semibold text-gray-900">Comment était cette conversation ?</h3>
          <p className="mt-1 text-center text-sm text-gray-500">{formatTimer(elapsedSec)} · {messages.filter((m) => m.role === "employee").length} messages</p>
          <div className="mt-6">
            <input type="range" min={1} max={10} value={rating} onChange={(e) => setRating(Number(e.target.value))} className="w-full accent-orange-500" />
            <div className="mt-2 text-center"><span className="text-4xl font-bold text-orange-600">{rating}</span><span className="text-lg text-gray-400">/10</span></div>
          </div>
          <textarea value={ratingComment} onChange={(e) => setRatingComment(e.target.value)} placeholder="Explique pourquoi (optionnel)" rows={3} className="mt-4 w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm transition focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100" />
          <div className="mt-5 flex gap-3">
            <button onClick={() => setPhase("listening")} className="flex-1 rounded-xl border-2 border-gray-200 px-4 py-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50">Continuer</button>
            <button onClick={submitRating} className="flex-1 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3 text-sm font-semibold text-white transition hover:shadow-md active:scale-[0.98]">Terminer</button>
          </div>
        </div>
      )}

      {phase === "ended" && (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Session terminée</h3>
          <p className="mt-1 text-sm text-gray-500">{formatTimer(elapsedSec)} · {messages.filter((m) => m.role === "employee").length} échanges{rating ? ` · Note : ${rating}/10` : ""}</p>
          <button onClick={() => { setPhase("idle"); setSessionId(null); setMessages([]); setElapsedSec(0); setHasAskedRating(false); setRating(7); setRatingComment(""); startTimeRef.current = null; }} className="mt-6 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-3 text-sm font-semibold text-white transition hover:shadow-md active:scale-[0.98]">
            Nouvelle conversation
          </button>
        </div>
      )}
    </div>
  );
}
