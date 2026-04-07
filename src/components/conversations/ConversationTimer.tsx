"use client";
import { useState, useEffect } from "react";

interface Props {
  startTime: Date;
  onTwentyMinutes: () => void;
}

export function ConversationTimer({ startTime, onTwentyMinutes }: Props) {
  const [elapsed, setElapsed] = useState(0);
  const [triggered, setTriggered] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      const sec = Math.floor((Date.now() - startTime.getTime()) / 1000);
      setElapsed(sec);

      if (sec >= 1200 && !triggered) {
        setTriggered(true);
        onTwentyMinutes();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime, triggered, onTwentyMinutes]);

  const min = Math.floor(elapsed / 60);
  const sec = elapsed % 60;

  return (
    <div className="text-center text-sm tabular-nums text-gray-500">
      {String(min).padStart(2, "0")}:{String(sec).padStart(2, "0")}
    </div>
  );
}
