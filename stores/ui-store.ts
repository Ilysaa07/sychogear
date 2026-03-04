"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

interface UIStore {
  isDarkMode: boolean;
  isMobileMenuOpen: boolean;
  isCartDrawerOpen: boolean;
  isAdminSidebarOpen: boolean;
  toggleDarkMode: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  setCartDrawerOpen: (open: boolean) => void;
  setAdminSidebarOpen: (open: boolean) => void;
}

export const useUIStore = create<UIStore>()(
  persist(
    (set) => ({
      isDarkMode: true,
      isMobileMenuOpen: false,
      isCartDrawerOpen: false,
      isAdminSidebarOpen: false,

      toggleDarkMode: () =>
        set((state) => ({ isDarkMode: !state.isDarkMode })),

      setMobileMenuOpen: (open: boolean) =>
        set({ isMobileMenuOpen: open }),

      setCartDrawerOpen: (open: boolean) =>
        set({ isCartDrawerOpen: open }),
      
      setAdminSidebarOpen: (open: boolean) =>
        set({ isAdminSidebarOpen: open }),
    }),
    {
      name: "sychogear-ui",
      partialize: (state) => ({ isDarkMode: state.isDarkMode }),
    }
  )
);
