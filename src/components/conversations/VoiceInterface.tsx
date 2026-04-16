"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface Message {
  id: string;
  role: "ai" | "employee";
  content: string;
  timestamp: Date;
}

type CallPhase = "idle" | "connecting" | "listening" | "recording" | "processing" | "speaking" | "rating" | "ended";

function getSR(): any {
  if (typeof window === "undefined") return null;
  return (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition || null;
}

export function VoiceInterface({ simulationId }: { simulationId?: string } = {}) {
  const [phase, setPhase] = useState<CallPhase>("idle");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [transcript, setTranscript] = useState("");
  const [liveTranscript, setLiveTranscript] = useState("");
  const [textInput, setTextInput] = useState("");
  const [error, setError] = useState("");
  const [elapsedSec, setElapsedSec] = useState(0);
  const [rating, setRating] = useState(7);
  const [ratingComment, setRatingComment] = useState("");
  const [hasAskedRating, setHasAskedRating] = useState(false);
  const [browserSupported, setBrowserSupported] = useState(true);

  const startTimeRef = useRef<Date | null>(null);
  const recRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const uttRef = useRef<SpeechSynthesisUtterance | null>(null);
  const silenceRef = useRef<any>(null);
  const phaseRef = useRef<CallPhase>("idle");
  const finalRef = useRef("");
  const sidRef = useRef<string | null>(null);
  const msgsRef = useRef<Message[]>([]);
  const textInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { phaseRef.current = phase; }, [phase]);
  useEffect(() => { sidRef.current = sessionId; }, [sessionId]);
  useEffect(() => { msgsRef.current = messages; }, [messages]);
  useEffect(() => { if (!getSR()) setBrowserSupported(false); }, []);

  useEffect(() => {
    if (!startTimeRef.current || phase === "idle" || phase === "ended") return;
    const iv = setInterval(() => {
      setElapsedSec(Math.floor((Date.now() - startTimeRef.current!.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(iv);
  }, [phase]);

  useEffect(() => {
    if (elapsedSec >= 1200 && !hasAskedRating && phase === "listening") {
      setHasAskedRating(true);
      stopMic();
      setPhase("rating");
    }
  }, [elapsedSec, hasAskedRating, phase]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, liveTranscript]);

  useEffect(() => {
    return () => { stopMic(); window.speechSynthesis.cancel(); };
  }, []);

  function fmt(sec: number) {
    return `${String(Math.floor(sec / 60)).padStart(2, "0")}:${String(sec % 60).padStart(2, "0")}`;
  }

  function stopMic() {
    if (recRef.current) { try { recRef.current.stop(); } catch {} recRef.current = null; }
    if (silenceRef.current) { clearTimeout(silenceRef.current); silenceRef.current = null; }
  }

  const speak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve) => {
      setPhase("speaking");
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = "fr-CA";
      u.rate = 1.05;
      const voices = window.speechSynthesis.getVoices();
      const v = voices.find((v) => v.lang.startsWith("fr-CA")) || voices.find((v) => v.lang.startsWith("fr"));
      if (v) u.voice = v;
      u.onend = () => { uttRef.current = null; resolve(); };
      u.onerror = () => { uttRef.current = null; resolve(); };
      uttRef.current = u;
      window.speechSynthesis.speak(u);
    });
  }, []);

  const skipSpeak = useCallback(() => {
    window.speechSynthesis.cancel();
    uttRef.current = null;
    setPhase("listening");
  }, []);

  const sendToAI = useCallback(async (text: string) => {
    if (!text.trim()) {
      setPhase("listening");
      setTimeout(() => { if (phaseRef.current === "listening") autoListen(); }, 1000);
      return;
    }

    setPhase("processing");
    setLiveTranscript("");

    try {
      const userMsg: Message = { id: `u-${Date.now()}`, role: "employee", content: text, timestamp: new Date() };
      setMessages((prev) => [...prev, userMsg]);

      const history = msgsRef.current.map((m) => ({
        role: m.role === "ai" ? ("assistant" as const) : ("user" as const),
        content: m.content,
      }));

      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "message", sessionId: sidRef.current, message: text, history, simulationId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setMessages((prev) => [...prev, { id: `ai-${Date.now()}`, role: "ai", content: data.response, timestamp: new Date() }]);
      setTranscript("");
      finalRef.current = "";

      await speak(data.response);

      setPhase("listening");
      setTimeout(() => { if (phaseRef.current === "listening") autoListen(); }, 600);
    } catch (err: any) {
      setError(err.message || "Erreur.");
      setPhase("listening");
      setTimeout(() => { if (phaseRef.current === "listening") autoListen(); }, 2000);
    }
  }, [speak, simulationId]);

  // Send text message
  const sendText = useCallback(() => {
    if (!textInput.trim() || phase === "processing") return;
    stopMic();
    const text = textInput.trim();
    setTextInput("");
    sendToAI(text);
  }, [textInput, phase, sendToAI]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendText();
    }
  }, [sendText]);

  // Auto-listen with silence detection
  const autoListen = useCallback(() => {
    if (phaseRef.current !== "listening") return;
    const SR = getSR();
    if (!SR) return;

    stopMic();

    const rec = new SR();
    rec.lang = "fr-CA";
    rec.continuous = true;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    let accumulated = "";

    rec.onresult = (e: any) => {
      let interim = "";
      let fin = "";
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) fin += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }

      if (fin) { accumulated = fin; finalRef.current = fin; setTranscript(fin); setLiveTranscript(""); }
      else if (interim) { setLiveTranscript(interim); }

      if (silenceRef.current) clearTimeout(silenceRef.current);
      silenceRef.current = setTimeout(() => {
        const txt = accumulated || finalRef.current || interim;
        if (txt.trim()) {
          stopMic();
          sendToAI(txt.trim());
        }
      }, 2000);
    };

    rec.onerror = (e: any) => {
      if (e.error === "not-allowed") {
        setError("Autorise le micro dans ton navigateur.");
        setPhase("listening");
        return;
      }
      if (e.error !== "aborted") {
        setTimeout(() => {
          if (phaseRef.current === "listening" || phaseRef.current === "recording") {
            setPhase("listening");
            setTimeout(() => autoListen(), 800);
          }
        }, 500);
      }
    };

    rec.onend = () => {
      recRef.current = null;
      if (phaseRef.current === "recording" && !accumulated && !finalRef.current) {
        setPhase("listening");
        setTimeout(() => { if (phaseRef.current === "listening") autoListen(); }, 500);
      }
    };

    recRef.current = rec;
    setPhase("recording");
    setTranscript("");
    setLiveTranscript("");
    finalRef.current = "";
    try { rec.start(); } catch {}
  }, [sendToAI]);

  // Manual hold-to-talk
  const manualStart = useCallback(() => {
    if (phase !== "listening" && phase !== "recording") return;
    stopMic();

    const SR = getSR();
    if (!SR) return;

    const rec = new SR();
    rec.lang = "fr-CA";
    rec.continuous = false;
    rec.interimResults = true;

    rec.onresult = (e: any) => {
      let interim = "";
      let fin = "";
      for (let i = 0; i < e.results.length; i++) {
        if (e.results[i].isFinal) fin += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      if (fin) { setTranscript(fin); setLiveTranscript(""); finalRef.current = fin; }
      else { setLiveTranscript(interim); }
    };

    rec.onerror = () => { setPhase("listening"); };
    rec.onend = () => { recRef.current = null; };

    recRef.current = rec;
    setPhase("recording");
    setTranscript("");
    setLiveTranscript("");
    finalRef.current = "";
    rec.start();
  }, [phase]);

  const manualStop = useCallback(async () => {
    if (phase !== "recording") return;
    stopMic();
    await new Promise((r) => setTimeout(r, 400));
    sendToAI(transcript || liveTranscript || finalRef.current);
  }, [phase, transcript, liveTranscript, sendToAI]);

  const startSession = useCallback(async () => {
    setPhase("connecting");
    setError("");
    setMessages([]);

    try {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "start", simulationId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      setSessionId(data.sessionId);
      sidRef.current = data.sessionId;
      startTimeRef.current = new Date();

      const msg: Message = { id: `ai-${Date.now()}`, role: "ai", content: data.greeting, timestamp: new Date() };
      setMessages([msg]);
      msgsRef.current = [msg];

      window.speechSynthesis.getVoices();
      await speak(data.greeting);

      setPhase("listening");
      setTimeout(() => { if (phaseRef.current === "listening") autoListen(); }, 600);
    } catch (err: any) {
      setError(err.message || "Impossible de démarrer.");
      setPhase("idle");
    }
  }, [speak, autoListen, simulationId]);

  const endSession = useCallback(async (withRating = false) => {
    window.speechSynthesis.cancel();
    stopMic();
    const dur = startTimeRef.current ? Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000) : 0;
    try {
      await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "end", sessionId, durationSec: dur, ...(withRating ? { rating, ratingComment } : {}) }),
      });
    } catch {}
    setPhase("ended");
  }, [sessionId, rating, ratingComment]);

  const submitRating = useCallback(async () => { await endSession(true); }, [endSession]);

  const isActive = !["idle", "ended"].includes(phase);
  const isRec = phase === "recording";
  const canSend = phase === "listening" || phase === "recording";

  return (
    <div className="mx-auto max-w-lg">
      {!browserSupported && (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
            <svg className="h-7 w-7 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" /></svg>
          </div>
          <h2 className="text-lg font-bold text-gray-900">Navigateur non supporté</h2>
          <p className="mt-2 text-sm text-gray-500">Utilise <strong>Google Chrome</strong> ou <strong>Microsoft Edge</strong>.</p>
        </div>
      )}

      {browserSupported && phase === "idle" && (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full bg-orange-100">
            <svg className="h-10 w-10 text-orange-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">Conversation IA</h2>
          <p className="mt-2 text-sm text-gray-500">Révise les procédures avec ton chef formateur.</p>
          <div className="mt-5 space-y-2 text-left">
            {["Parle avec le micro ou écris ton message", "L'IA détecte quand tu arrêtes de parler", "Tu peux taper ta réponse si tu préfères", "100% gratuit"].map((t) => (
              <div key={t} className="flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-2.5">
                <svg className="h-4 w-4 shrink-0 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                <span className="text-sm text-gray-600">{t}</span>
              </div>
            ))}
          </div>
          <button onClick={startSession} className="mt-6 w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-orange-500/25 active:scale-[0.98]">Démarrer la conversation</button>
        </div>
      )}

      {isActive && phase !== "rating" && (
        <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
          {/* Header */}
          <div className="bg-gradient-to-r from-gray-900 to-gray-800 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {phase === "connecting" ? <span className="h-2 w-2 animate-pulse rounded-full bg-yellow-400" /> : isRec ? <span className="h-2 w-2 animate-pulse rounded-full bg-red-400" /> : <span className="h-2 w-2 rounded-full bg-green-400" />}
                <span className="text-xs font-medium text-gray-300">
                  {phase === "connecting" ? "Connexion..." : isRec ? "Je t'écoute..." : phase === "processing" ? "Réflexion..." : phase === "speaking" ? "Parle..." : "En ligne"}
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold text-white">Chef Formateur</p>
                <p className="font-mono text-xs tabular-nums text-gray-400">{fmt(elapsedSec)}</p>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="h-[55vh] overflow-y-auto sm:h-[60vh] bg-gray-50 px-4 py-4">
            <div className="space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.role === "employee" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                    msg.role === "employee" 
                      ? "rounded-br-md bg-orange-500 text-white" 
                      : "rounded-bl-md bg-white text-gray-800 shadow-sm"
                  }`}>{msg.content}</div>
                </div>
              ))}
              {(liveTranscript || (transcript && phase === "processing")) && (
                <div className="flex justify-end">
                  <div className="max-w-[85%] rounded-2xl rounded-br-md bg-orange-300 px-4 py-2.5 text-sm text-white">
                    {liveTranscript || transcript}{isRec && <span className="ml-1 animate-pulse">|</span>}
                  </div>
                </div>
              )}
              {phase === "processing" && (
                <div className="flex justify-start">
                  <div className="rounded-2xl rounded-bl-md bg-white px-4 py-3 shadow-sm">
                    <div className="flex gap-1"><span className="h-2 w-2 animate-bounce rounded-full bg-gray-300" /><span className="h-2 w-2 animate-bounce rounded-full bg-gray-300" style={{ animationDelay: "0.15s" }} /><span className="h-2 w-2 animate-bounce rounded-full bg-gray-300" style={{ animationDelay: "0.3s" }} /></div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {error && <div className="mx-4 mt-2 rounded-lg bg-red-50 px-3 py-2 text-center text-xs text-red-600">{error}</div>}

          {/* Status */}
          {isRec && (
            <div className="flex items-center justify-center gap-2 bg-red-50 px-4 py-2">
              <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500" />
              <span className="text-xs font-medium text-red-700">Écoute en cours... parle maintenant</span>
            </div>
          )}

          {/* Zone de saisie texte + boutons */}
          <div className="border-t border-gray-100 px-4 py-3">
            <div className="flex items-end gap-2">
              {/* Bouton terminer */}
              <button 
                onClick={() => { stopMic(); setPhase("rating"); }} 
                disabled={phase === "connecting" || phase === "processing"} 
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-500 text-white active:scale-95 disabled:opacity-50" 
                aria-label="Terminer"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
              </button>

              {/* Zone texte */}
              <div className="relative flex-1">
                <textarea
                  ref={textInputRef}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isRec ? "Le micro écoute... ou tape ici" : "Tape ta réponse ici..."}
                  rows={1}
                  disabled={phase === "processing" || phase === "connecting"}
                  className="w-full resize-none rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 pr-12 text-sm transition focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100 disabled:bg-gray-50 disabled:opacity-60"
                  style={{ minHeight: 44, maxHeight: 100 }}
                />
              </div>

              {/* Bouton micro */}
              <button
                onMouseDown={manualStart}
                onMouseUp={manualStop}
                onTouchStart={(e) => { e.preventDefault(); manualStart(); }}
                onTouchEnd={(e) => { e.preventDefault(); manualStop(); }}
                disabled={!canSend}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all ${
                  isRec 
                    ? "bg-red-500 text-white animate-pulse" 
                    : canSend 
                      ? "bg-gray-100 text-gray-600 active:bg-gray-200" 
                      : "bg-gray-100 text-gray-300"
                }`}
                aria-label="Maintenir pour parler"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg>
              </button>

              {/* Bouton envoyer */}
              <button
                onClick={sendText}
                disabled={!textInput.trim() || phase === "processing" || phase === "connecting"}
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-all ${
                  textInput.trim() && canSend
                    ? "bg-orange-500 text-white active:scale-95"
                    : "bg-gray-100 text-gray-300"
                }`}
                aria-label="Envoyer"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>
              </button>
            </div>

            {/* Skip speaking button */}
            {phase === "speaking" && (
              <button onClick={skipSpeak} className="mt-2 w-full rounded-lg bg-gray-100 px-3 py-2 text-xs font-medium text-gray-500 active:bg-gray-200">
                Passer la réponse vocale
              </button>
            )}
          </div>
        </div>
      )}

      {phase === "rating" && (
        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <h3 className="text-center text-lg font-semibold text-gray-900">Comment était cette conversation ?</h3>
          <p className="mt-1 text-center text-sm text-gray-500">{fmt(elapsedSec)} · {messages.filter((m) => m.role === "employee").length} messages</p>
          <div className="mt-6">
            <input type="range" min={1} max={10} value={rating} onChange={(e) => setRating(Number(e.target.value))} className="w-full accent-orange-500" />
            <div className="mt-2 text-center"><span className="text-4xl font-bold text-orange-600">{rating}</span><span className="text-lg text-gray-400">/10</span></div>
          </div>
          <textarea value={ratingComment} onChange={(e) => setRatingComment(e.target.value)} placeholder="Explique pourquoi (optionnel)" rows={3} className="mt-4 w-full rounded-xl border-2 border-gray-200 px-4 py-3 text-sm focus:border-orange-400 focus:outline-none focus:ring-2 focus:ring-orange-100" />
          <div className="mt-5 flex gap-3">
            <button onClick={() => { setPhase("listening"); setTimeout(() => autoListen(), 600); }} className="flex-1 rounded-xl border-2 border-gray-200 px-4 py-3 text-sm font-medium text-gray-600 active:bg-gray-50">Continuer</button>
            <button onClick={submitRating} className="flex-1 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-3 text-sm font-semibold text-white active:scale-[0.98]">Terminer</button>
          </div>
        </div>
      )}

      {phase === "ended" && (
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100">
            <svg className="h-7 w-7 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900">Session terminée</h3>
          <p className="mt-1 text-sm text-gray-500">{fmt(elapsedSec)} · {messages.filter((m) => m.role === "employee").length} échanges{rating ? ` · Note : ${rating}/10` : ""}</p>
          <button onClick={() => { setPhase("idle"); setSessionId(null); setMessages([]); setElapsedSec(0); setHasAskedRating(false); setRating(7); setRatingComment(""); startTimeRef.current = null; finalRef.current = ""; setTextInput(""); }} className="mt-6 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 px-8 py-3 text-sm font-semibold text-white active:scale-[0.98]">Nouvelle conversation</button>
        </div>
      )}
    </div>
  );
}
