"use client";

import { create } from "zustand";

type CalendarView = "day" | "week" | "month";

interface FiltersStore {
  // Filtros del calendario
  calendarView: CalendarView;
  selectedDate: string; // ISO date string
  selectedDoctorId: string | null;
  setCalendarView: (view: CalendarView) => void;
  setSelectedDate: (date: string) => void;
  setSelectedDoctorId: (id: string | null) => void;

  // Filtros de búsqueda general
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const useFiltersStore = create<FiltersStore>()((set) => ({
  calendarView: "week",
  selectedDate: new Date().toISOString().split("T")[0],
  selectedDoctorId: null,
  setCalendarView: (view) => set({ calendarView: view }),
  setSelectedDate: (date) => set({ selectedDate: date }),
  setSelectedDoctorId: (id) => set({ selectedDoctorId: id }),

  searchQuery: "",
  setSearchQuery: (query) => set({ searchQuery: query }),
}));
