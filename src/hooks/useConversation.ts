"use client";
import { useState, useCallback, useRef } from "react";

interface Message {
  role: "ai" | "employee";
  content: string;
}

export function useConversation(employeeId: string) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const startTimeRef = useRef<Date | null>(null);

  const startSession = useCallback(async () => {
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "start", employeeId }),
    });
    const { sessionId: id, greeting } = await res.json();
    setSessionId(id);
    startTimeRef.current = new Date();
    setMessages([{ role: "ai", content: greeting }]);
    return id;
  }, [employeeId]);

  const sendMessage = useCallback(async (content: string) => {
    if (!sessionId) return;
    setMessages((prev) => [...prev, { role: "employee", content }]);
    setIsLoading(true);

    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "message",
        sessionId,
        employeeId,
        message: content,
        history: messages.map((m) => ({
          role: m.role === "ai" ? "assistant" : "user",
          content: m.content,
        })),
      }),
    });

    const { response } = await res.json();
    setMessages((prev) => [...prev, { role: "ai", content: response }]);
    setIsLoading(false);
    return response;
  }, [sessionId, employeeId, messages]);

  const endSession = useCallback(async (rating: number, comment: string) => {
    if (!sessionId || !startTimeRef.current) return;
    const durationSec = Math.floor((Date.now() - startTimeRef.current.getTime()) / 1000);

    await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "end",
        sessionId,
        rating,
        ratingComment: comment,
        durationSec,
      }),
    });

    setSessionId(null);
    setMessages([]);
  }, [sessionId]);

  const elapsedMinutes = startTimeRef.current
    ? Math.floor((Date.now() - startTimeRef.current.getTime()) / 60000)
    : 0;

  return {
    messages, sessionId, isLoading, elapsedMinutes,
    startSession, sendMessage, endSession,
  };
}
