export interface ConversationSession {
  id: string;
  employee_id: string;
  started_at: string;
  ended_at: string | null;
  duration_sec: number | null;
  rating: number | null;
  rating_comment: string | null;
}

export interface ConversationMessage {
  id: string;
  session_id: string;
  role: "ai" | "employee";
  content: string;
  question_id: string | null;
  is_correct: boolean | null;
  created_at: string;
}

export interface ConversationQuestion {
  id: string;
  question_text: string;
  category: string | null;
  is_priority: boolean;
  source: "generated" | "manual";
  created_at: string;
}

export interface EmployeeConversationReport {
  employee_id: string;
  first_name: string;
  last_name: string;
  total_sessions: number;
  total_seconds: number;
  avg_rating: number | null;
  seconds_this_week: number;
  seconds_this_month: number;
}
