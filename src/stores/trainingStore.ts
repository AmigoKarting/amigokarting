import { create } from "zustand";
import type { TrainingModule } from "@/types/training";

interface TrainingState {
  modules: TrainingModule[];
  currentModuleId: string | null;
  currentChapterId: string | null;
  setModules: (modules: TrainingModule[]) => void;
  setCurrentModule: (id: string | null) => void;
  setCurrentChapter: (id: string | null) => void;
}

export const useTrainingStore = create<TrainingState>((set) => ({
  modules: [],
  currentModuleId: null,
  currentChapterId: null,
  setModules: (modules) => set({ modules }),
  setCurrentModule: (currentModuleId) => set({ currentModuleId }),
  setCurrentChapter: (currentChapterId) => set({ currentChapterId }),
}));
