"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface PresenceUser {
  id: string;
  firstName: string;
  currentPage: string;
}

export function useRealtimePresence(employeeId: string, firstName: string) {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const supabase = createClient();

  useEffect(() => {
    const channel = supabase.channel("presence:training", {
      config: { presence: { key: employeeId } },
    });

    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState();
        const users: PresenceUser[] = Object.entries(state).map(([key, data]) => ({
          id: key,
          firstName: (data as any)[0]?.firstName || "?",
          currentPage: (data as any)[0]?.currentPage || "",
        }));
        setOnlineUsers(users);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            firstName,
            currentPage: window.location.pathname,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => { supabase.removeChannel(channel); };
  }, [employeeId, firstName]);

  return { onlineUsers };
}
