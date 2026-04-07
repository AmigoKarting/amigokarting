export interface TrainingModule {
  id: string;
  title: string;
  description: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  chapters?: TrainingChapter[];
}

export interface TrainingChapter {
  id: string;
  module_id: string;
  title: string;
  sort_order: number;
  created_at: string;
  videos?: TrainingVideo[];
}

export interface TrainingVideo {
  id: string;
  chapter_id: string;
  title: string;
  description: string | null;
  video_url: string;
  duration_sec: number | null;
  sort_order: number;
  created_at: string;
}

export interface VideoWatchLog {
  id: string;
  employee_id: string;
  video_id: string;
  watched_sec: number;
  completed: boolean;
  completed_at: string | null;
  started_at: string;
}
