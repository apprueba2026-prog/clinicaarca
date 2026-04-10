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

  // Datos de paciente guest (sin cuenta)
  guestName: string;
  guestPhone: string;
  guestEmail: string;
  guestDni: string;

  // Actions
  setStep: (step: 1 | 2 | 3 | 4) => void;
  setSelectionMode: (mode: "service" | "doctor") => void;
  selectCategory: (category: ProcedureCategory) => void;
  selectDoctor: (id: string) => void;
  selectDate: (date: string) => void;
  selectSlot: (slot: { start: string; end: string }) => void;
  setNotes: (notes: string) => void;
  setGuestName: (name: string) => void;
  setGuestPhone: (phone: string) => void;
  setGuestEmail: (email: string) => void;
  setGuestDni: (dni: string) => void;
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
  guestName: "",
  guestPhone: "",
  guestEmail: "",
  guestDni: "",

  setStep: (step) => set({ currentStep: step }),

  setSelectionMode: (mode) => set({ selectionMode: mode }),

  selectCategory: (category) =>
    set({ selectedCategory: category, selectedDoctorId: null }),

  selectDoctor: (id) => set({ selectedDoctorId: id }),

  selectDate: (date) => set({ selectedDate: date, selectedSlot: null }),

  selectSlot: (slot) => set({ selectedSlot: slot }),

  setNotes: (notes) => set({ notes }),

  setGuestName: (guestName) => set({ guestName }),
  setGuestPhone: (guestPhone) => set({ guestPhone }),
  setGuestEmail: (guestEmail) => set({ guestEmail }),
  setGuestDni: (guestDni) => set({ guestDni }),

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
        // NO limpiar selectedDoctorId: si hay 1 solo doctor, el paso 2
        // tiene un auto-advance que rebotaría al paso 3 inmediatamente
        // creando un loop invisible. Mantener el doctor seleccionado
        // permite al usuario ver el paso 2 y cambiar si quiere.
        set({
          currentStep: 2,
          selectedDate: null,
          selectedSlot: null,
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
      guestName: "",
      guestPhone: "",
      guestEmail: "",
      guestDni: "",
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
      guestName: state.guestName,
      guestPhone: state.guestPhone,
      guestEmail: state.guestEmail,
      guestDni: state.guestDni,
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
        guestName: draft.guestName ?? "",
        guestPhone: draft.guestPhone ?? "",
        guestEmail: draft.guestEmail ?? "",
        guestDni: draft.guestDni ?? "",
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
