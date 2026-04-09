import { create } from "zustand";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface AIChatState {
  isOpen: boolean;
  sessionId: string | null;
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
  appointmentCreated: boolean;
  patientId: string | null;

  open: () => void;
  close: () => void;
  toggle: () => void;
  reset: () => void;
  sendMessage: (text: string) => Promise<void>;
}

const SESSION_KEY = "arca_chat_session_id";

const WELCOME_MESSAGE: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "¡Hola! 🦷 Soy Noé, el asistente virtual de Clínica Arca. ¿En qué te puedo ayudar hoy?",
  timestamp: Date.now(),
};

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function generateSessionId(): string {
  // UUID v4 simple (suficiente para identificación de sesión, no criptográfico)
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function loadSessionId(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(SESSION_KEY);
}

function saveSessionId(id: string): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(SESSION_KEY, id);
}

function clearSessionId(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(SESSION_KEY);
}

export const useAIChatStore = create<AIChatState>((set, get) => ({
  isOpen: false,
  sessionId: null,
  messages: [WELCOME_MESSAGE],
  isLoading: false,
  error: null,
  appointmentCreated: false,
  patientId: null,

  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  reset: () => {
    clearSessionId();
    set({
      sessionId: null,
      messages: [{ ...WELCOME_MESSAGE, timestamp: Date.now() }],
      error: null,
      appointmentCreated: false,
      patientId: null,
    });
  },

  sendMessage: async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || get().isLoading) return;

    // Asegurar sessionId (lo persistimos en sessionStorage)
    let sessionId = get().sessionId ?? loadSessionId();
    if (!sessionId) {
      sessionId = generateSessionId();
      saveSessionId(sessionId);
    }

    const userMsg: ChatMessage = {
      id: makeId(),
      role: "user",
      content: trimmed,
      timestamp: Date.now(),
    };

    set((s) => ({
      sessionId,
      messages: [...s.messages, userMsg],
      isLoading: true,
      error: null,
    }));

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: trimmed }),
      });

      const data = (await res.json()) as {
        message?: string;
        sessionId?: string;
        error?: string;
        appointmentCreated?: boolean;
        patientId?: string;
        debug?: string;
      };

      if (!res.ok || data.error) {
        const errMsg =
          process.env.NODE_ENV !== "production" && data.debug
            ? `${data.error ?? "Error"} (${data.debug})`
            : data.error ?? "Error en el asistente";
        throw new Error(errMsg);
      }

      const assistantMsg: ChatMessage = {
        id: makeId(),
        role: "assistant",
        content: data.message ?? "",
        timestamp: Date.now(),
      };

      set((s) => ({
        messages: [...s.messages, assistantMsg],
        isLoading: false,
        appointmentCreated: data.appointmentCreated
          ? true
          : s.appointmentCreated,
        patientId: data.patientId ?? s.patientId,
      }));
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error desconocido";
      set({ isLoading: false, error: message });
    }
  },
}));
