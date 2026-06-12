import { create } from "zustand";

// État partagé du tiroir de menu mobile : permet à la barre du bas (BottomNav)
// d'ouvrir le menu latéral (Sidebar).
interface MenuState {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const useMenuStore = create<MenuState>((set) => ({
  open: false,
  setOpen: (open) => set({ open }),
}));
