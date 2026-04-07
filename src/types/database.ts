// Ce fichier sera auto-généré par : npm run db:types
// Placeholder pour le typage Supabase
export type Database = {
  public: {
    Tables: {
      employees: { Row: import("./employee").Employee; Insert: Partial<import("./employee").Employee>; Update: Partial<import("./employee").Employee> };
      training_modules: { Row: import("./training").TrainingModule; Insert: Partial<import("./training").TrainingModule>; Update: Partial<import("./training").TrainingModule> };
      training_chapters: { Row: import("./training").TrainingChapter; Insert: Partial<import("./training").TrainingChapter>; Update: Partial<import("./training").TrainingChapter> };
      training_videos: { Row: import("./training").TrainingVideo; Insert: Partial<import("./training").TrainingVideo>; Update: Partial<import("./training").TrainingVideo> };
      video_watch_log: { Row: import("./training").VideoWatchLog; Insert: Partial<import("./training").VideoWatchLog>; Update: Partial<import("./training").VideoWatchLog> };
      quizzes: { Row: import("./quiz").Quiz; Insert: Partial<import("./quiz").Quiz>; Update: Partial<import("./quiz").Quiz> };
      quiz_questions: { Row: import("./quiz").QuizQuestion; Insert: Partial<import("./quiz").QuizQuestion>; Update: Partial<import("./quiz").QuizQuestion> };
      quiz_choices: { Row: import("./quiz").QuizChoice; Insert: Partial<import("./quiz").QuizChoice>; Update: Partial<import("./quiz").QuizChoice> };
      conversation_sessions: { Row: import("./conversation").ConversationSession; Insert: Partial<import("./conversation").ConversationSession>; Update: Partial<import("./conversation").ConversationSession> };
      conversation_messages: { Row: import("./conversation").ConversationMessage; Insert: Partial<import("./conversation").ConversationMessage>; Update: Partial<import("./conversation").ConversationMessage> };
    };
    Views: {};
    Functions: {};
  };
};
