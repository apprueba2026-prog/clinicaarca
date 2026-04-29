"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { useAdminAIChatStore } from "@/stores/admin-ai-chat.store";
import { cn } from "@/lib/utils/cn";

const QUICK_ADMIN_SUGGESTIONS = [
  "Buscar paciente por DNI",
  "Agendar nueva cita",
  "Ver disponibilidad de hoy",
];

const TYPING_PHRASES = [
  "Procesando…",
  "Buscando datos…",
  "Casi listo…",
];

/**
 * Botón flotante + panel del Noé Operativo (uso interno staff).
 * Versión más sobria que el público, paleta primary (no emerald).
 */
export function AdminAIPanel() {
  const {
    isOpen,
    messages,
    isLoading,
    error,
    sendMessage,
    open,
    close,
    reset,
  } = useAdminAIChatStore();

  const [input, setInput] = useState("");
  const [typingIdx, setTypingIdx] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [messages, isLoading, isOpen]);

  useEffect(() => {
    if (!isLoading) {
      setTypingIdx(0);
      return;
    }
    const id = setInterval(() => {
      setTypingIdx((i) => (i + 1) % TYPING_PHRASES.length);
    }, 2500);
    return () => clearInterval(id);
  }, [isLoading]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    void sendMessage(input);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const showSuggestions = messages.length === 1 && !isLoading;

  return (
    <>
      {/* Botón flotante */}
      <button
        type="button"
        onClick={isOpen ? close : open}
        aria-label={isOpen ? "Cerrar Noé Operativo" : "Abrir Noé Operativo"}
        className={cn(
          "fixed bottom-6 right-6 z-[100] w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95",
          isOpen
            ? "bg-slate-700 text-white"
            : "bg-primary text-on-primary"
        )}
      >
        <Icon name={isOpen ? "close" : "smart_toy"} />
      </button>

      {/* Panel */}
      {isOpen && (
        <div
          role="dialog"
          aria-label="Noé Operativo"
          className="fixed bottom-24 right-6 z-[101] w-[calc(100vw-3rem)] max-w-[420px] h-[640px] max-h-[calc(100vh-9rem)] flex flex-col rounded-3xl shadow-2xl border border-outline-variant bg-surface-container-lowest overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 bg-primary text-on-primary">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-on-primary/15 flex items-center justify-center">
                <Icon name="smart_toy" />
              </div>
              <div>
                <p className="font-bold text-sm">Noé Operativo</p>
                <p className="text-[11px] opacity-90 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-emerald-300 rounded-full animate-pulse" />
                  Asistente interno
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={reset}
                aria-label="Reiniciar"
                className="p-2 hover:bg-white/15 rounded-full transition-colors"
              >
                <Icon name="refresh" size="sm" />
              </button>
              <button
                type="button"
                onClick={close}
                aria-label="Cerrar"
                className="p-2 hover:bg-white/15 rounded-full transition-colors"
              >
                <Icon name="close" size="sm" />
              </button>
            </div>
          </div>

          {/* Mensajes */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex",
                  msg.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap",
                    msg.role === "user"
                      ? "bg-primary text-on-primary rounded-br-sm"
                      : "bg-surface-container-low text-on-surface rounded-bl-sm"
                  )}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {showSuggestions && (
              <div className="flex flex-wrap gap-2 pt-2">
                {QUICK_ADMIN_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => void sendMessage(s)}
                    className="px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary rounded-full border border-primary/20 hover:bg-primary/20 transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-surface-container-low px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                  </div>
                  <span className="text-xs text-on-surface-variant">
                    {TYPING_PHRASES[typingIdx]}
                  </span>
                </div>
              </div>
            )}

            {error && (
              <div className="flex justify-start">
                <div className="bg-error/10 text-error px-4 py-2.5 rounded-2xl text-xs border border-error/30">
                  {error}
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-outline-variant p-3">
            <div className="flex items-end gap-2">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Pregúntale a Noé Operativo…"
                rows={1}
                disabled={isLoading}
                className="flex-1 resize-none bg-surface-container-low border-none rounded-2xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/30 max-h-24 disabled:opacity-50"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                aria-label="Enviar"
                className="w-10 h-10 rounded-full bg-primary text-on-primary flex items-center justify-center hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
              >
                <Icon name="send" size="sm" />
              </button>
            </div>
            <p className="text-[10px] text-on-surface-variant mt-2 text-center">
              Solo personal autorizado · Powered by Gemini
            </p>
          </div>
        </div>
      )}
    </>
  );
}
