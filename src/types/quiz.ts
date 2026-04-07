export interface Quiz {
  id: string;
  chapter_id: string;
  title: string;
  passing_score: number;
  created_at: string;
  questions?: QuizQuestion[];
}

export interface QuizQuestion {
  id: string;
  quiz_id: string;
  question_text: string;
  explanation: string | null;
  sort_order: number;
  choices?: QuizChoice[];
}

export interface QuizChoice {
  id: string;
  question_id: string;
  choice_text: string;
  is_correct: boolean;
  sort_order: number;
}

export interface QuizAttempt {
  id: string;
  employee_id: string;
  quiz_id: string;
  score: number | null;
  passed: boolean;
  started_at: string;
  completed_at: string | null;
}

export interface QuizQuestionStats {
  question_id: string;
  question_text: string;
  quiz_title: string;
  total_answers: number;
  correct_answers: number;
  success_rate: number;
}
