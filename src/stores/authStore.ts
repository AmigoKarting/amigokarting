import { create } from "zustand";
import type { Employee } from "@/types/employee";

interface AuthState {
  employee: Employee | null;
  isLoading: boolean;
  setEmployee: (employee: Employee | null) => void;
  setLoading: (loading: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  employee: null,
  isLoading: true,
  setEmployee: (employee) => set({ employee, isLoading: false }),
  setLoading: (isLoading) => set({ isLoading }),
}));
