import { create } from "zustand";

export interface AdminChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

interface AdminAIChatState {
  isOpen: boolean;
  sessionId: string | null;
  messages: AdminChatMessage[];
  isLoading: boolean;
  error: string | null;

  open: () => void;
  close: () => void;
  toggle: () => void;
  reset: () => void;
  sendMessage: (text: string) => Promise<void>;
}

const SESSION_KEY = "arca_admin_chat_session_id";

const WELCOME: AdminChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hola, soy Noé Operativo 🩺. Te ayudo a buscar pacientes, agendar y reprogramar citas, o consultar la agenda. ¿Qué necesitas?",
  timestamp: Date.now(),
};

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function generateSessionId(): string {
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

export const useAdminAIChatStore = create<AdminAIChatState>((set, get) => ({
  isOpen: false,
  sessionId: null,
  messages: [WELCOME],
  isLoading: false,
  error: null,

  open: () => set({ isOpen: true }),
  close: () => set({ isOpen: false }),
  toggle: () => set((s) => ({ isOpen: !s.isOpen })),
  reset: () => {
    clearSessionId();
    set({
      sessionId: null,
      messages: [{ ...WELCOME, timestamp: Date.now() }],
      error: null,
    });
  },

  sendMessage: async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    let sessionId = get().sessionId ?? loadSessionId();
    if (!sessionId) {
      sessionId = generateSessionId();
      saveSessionId(sessionId);
    }

    const userMsg: AdminChatMessage = {
      id: makeId(),
      role: "user",
      content: trimmed,
      timestamp: Date.now(),
    };
    set((s) => ({
      messages: [...s.messages, userMsg],
      isLoading: true,
      error: null,
      sessionId,
    }));

    try {
      const res = await fetch("/api/ai/admin-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, message: trimmed }),
      });
      const data = (await res.json()) as {
        message?: string;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? "Error procesando consulta");
      }
      const assistantMsg: AdminChatMessage = {
        id: makeId(),
        role: "assistant",
        content: data.message ?? "",
        timestamp: Date.now(),
      };
      set((s) => ({
        messages: [...s.messages, assistantMsg],
        isLoading: false,
      }));
    } catch (err) {
      set({
        isLoading: false,
        error: err instanceof Error ? err.message : "Error de conexión",
      });
    }
  },
}));
