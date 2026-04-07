"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { VideoWatchLog } from "@/types/training";

export function useTrainingProgress(employeeId: string) {
  const [progress, setProgress] = useState<VideoWatchLog[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("video_watch_log")
        .select("*")
        .eq("employee_id", employeeId);
      setProgress(data || []);
      setLoading(false);
    }
    if (employeeId) load();
  }, [employeeId]);

  function isVideoCompleted(videoId: string) {
    return progress.some((p) => p.video_id === videoId && p.completed);
  }

  function getVideoProgress(videoId: string) {
    return progress.find((p) => p.video_id === videoId)?.watched_sec || 0;
  }

  const completedCount = progress.filter((p) => p.completed).length;

  return { progress, loading, isVideoCompleted, getVideoProgress, completedCount };
}
