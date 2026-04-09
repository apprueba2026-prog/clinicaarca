"use client";

import { create } from "zustand";
import type { ProcedureCategory } from "@/lib/types/enums";

interface BookingState {
  // Wizard navigation
  currentStep: 1 | 2 | 3 | 4;
  selectionMode: "service" | "doctor" | null;

  // Selecciones del paciente
  selectedCategory: ProcedureCategory | null;
  selectedDoctorId: string | null;
  selectedDate: string | null; // 'YYYY-MM-DD'
  selectedSlot: { start: string; end: string } | null;
  notes: string;

  // Actions
  setStep: (step: 1 | 2 | 3 | 4) => void;
  setSelectionMode: (mode: "service" | "doctor") => void;
  selectCategory: (category: ProcedureCategory) => void;
  selectDoctor: (id: string) => void;
  selectDate: (date: string) => void;
  selectSlot: (slot: { start: string; end: string }) => void;
  setNotes: (notes: string) => void;
  goBack: () => void;
  reset: () => void;

  // Persistencia en localStorage para flujo auth-gate
  saveDraft: () => void;
  restoreDraft: () => boolean;
  clearDraft: () => void;
}

const DRAFT_KEY = "booking_draft";

export const useBookingStore = create<BookingState>()((set, get) => ({
  currentStep: 1,
  selectionMode: null,
  selectedCategory: null,
  selectedDoctorId: null,
  selectedDate: null,
  selectedSlot: null,
  notes: "",

  setStep: (step) => set({ currentStep: step }),

  setSelectionMode: (mode) => set({ selectionMode: mode }),

  selectCategory: (category) =>
    set({ selectedCategory: category, selectedDoctorId: null }),

  selectDoctor: (id) => set({ selectedDoctorId: id }),

  selectDate: (date) => set({ selectedDate: date, selectedSlot: null }),

  selectSlot: (slot) => set({ selectedSlot: slot }),

  setNotes: (notes) => set({ notes }),

  goBack: () => {
    const { currentStep, selectionMode } = get();
    if (currentStep === 1) return;

    // Si está en paso 2 y vino por doctor, volver al paso 1
    // Si está en paso 3 y solo hay 1 doctor (auto-select), volver al paso 1
    if (currentStep === 2) {
      set({ currentStep: 1, selectedDoctorId: null });
      return;
    }

    if (currentStep === 3) {
      // Si vino por doctor directo, volver a paso 1
      if (selectionMode === "doctor") {
        set({ currentStep: 1, selectedDate: null, selectedSlot: null });
      } else {
        set({
          currentStep: 2,
          selectedDate: null,
          selectedSlot: null,
          selectedDoctorId: null,
        });
      }
      return;
    }

    if (currentStep === 4) {
      set({ currentStep: 3 });
    }
  },

  reset: () =>
    set({
      currentStep: 1,
      selectionMode: null,
      selectedCategory: null,
      selectedDoctorId: null,
      selectedDate: null,
      selectedSlot: null,
      notes: "",
    }),

  saveDraft: () => {
    const state = get();
    const draft = {
      currentStep: state.currentStep,
      selectionMode: state.selectionMode,
      selectedCategory: state.selectedCategory,
      selectedDoctorId: state.selectedDoctorId,
      selectedDate: state.selectedDate,
      selectedSlot: state.selectedSlot,
      notes: state.notes,
    };
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch {
      // localStorage no disponible
    }
  },

  restoreDraft: () => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return false;

      const draft = JSON.parse(raw);
      set({
        currentStep: 4, // Siempre ir al paso 4 al restaurar
        selectionMode: draft.selectionMode,
        selectedCategory: draft.selectedCategory,
        selectedDoctorId: draft.selectedDoctorId,
        selectedDate: draft.selectedDate,
        selectedSlot: draft.selectedSlot,
        notes: draft.notes ?? "",
      });
      return true;
    } catch {
      return false;
    }
  },

  clearDraft: () => {
    try {
      localStorage.removeItem(DRAFT_KEY);
    } catch {
      // localStorage no disponible
    }
  },
}));
