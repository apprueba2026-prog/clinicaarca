"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

type ThemeMode = "light" | "dark" | "system";

interface ThemeStore {
  theme: ThemeMode;
  resolvedTheme: "light" | "dark";
  setTheme: (theme: ThemeMode) => void;
}

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      theme: "system",
      resolvedTheme: "light",
      setTheme: (theme) =>
        set({
          theme,
          resolvedTheme: theme === "system" ? getSystemTheme() : theme,
        }),
    }),
    {
      name: "clinica-arca-theme",
      onRehydrateStorage: () => (state) => {
        if (state && state.theme === "system") {
          state.resolvedTheme = getSystemTheme();
        }
      },
    }
  )
);
