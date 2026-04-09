"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { useAIChatStore } from "@/stores/ai-chat.store";
import { cn } from "@/lib/utils/cn";

const QUICK_SUGGESTIONS = [
  "Quiero agendar una cita",
  "¿Qué especialidades tienen?",
  "Información de la clínica",
];

export function AIChatPanel() {
  const {
    isOpen,
    messages,
    isLoading,
    error,
    sendMessage,
    close,
    reset,
    appointmentCreated,
    patientId,
  } = useAIChatStore();
  const [telegramLoading, setTelegramLoading] = useState(false);
  const [telegramError, setTelegramError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll al fondo cuando llegan mensajes
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isLoading, isOpen]);

  // Focus en el textarea al abrir
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

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

  const handleSuggestion = (text: string) => {
    if (isLoading) return;
    void sendMessage(text);
  };

  const showSuggestions = messages.length === 1 && !isLoading;
  const showTelegramCta = appointmentCreated && !!patientId;

  const handleTelegramLink = async () => {
    if (!patientId || telegramLoading) return;
    setTelegramLoading(true);
    setTelegramError(null);
    try {
      const res = await fetch("/api/telegram/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patientId }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setTelegramError(data.error ?? "No se pudo generar el enlace");
        return;
      }
      window.open(data.url, "_blank", "noopener,noreferrer");
    } catch {
      setTelegramError("Error de conexión");
    } finally {
      setTelegramLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-label="Noé"
      className="fixed bottom-28 right-6 z-[101] w-[calc(100vw-3rem)] max-w-[400px] h-[640px] max-h-[calc(100vh-9rem)] flex flex-col rounded-3xl shadow-2xl border border-emerald-100 dark:border-emerald-900/40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 rounded-full bg-white flex items-center justify-center overflow-hidden animate-noe-breathe">
            <div className="relative w-8 h-8">
              <Image
                src="/logo-nav.png"
                alt="Noé"
                fill
                sizes="32px"
                className="object-contain"
              />
            </div>
          </div>
          <div>
            <p className="font-bold text-sm">Noé</p>
            <p className="text-[11px] opacity-90 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-200 rounded-full animate-pulse" />
              En línea
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={reset}
            aria-label="Reiniciar conversación"
            className="p-2 hover:bg-white/15 rounded-full transition-colors"
          >
            <Icon name="refresh" size="sm" />
          </button>
          <button
            type="button"
            onClick={close}
            aria-label="Cerrar chat"
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
                  ? "bg-emerald-500 text-white rounded-br-sm"
                  : "bg-slate-100 dark:bg-slate-800 text-on-surface dark:text-slate-100 rounded-bl-sm"
              )}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {/* Sugerencias rápidas */}
        {showSuggestions && (
          <div className="flex flex-wrap gap-2 pt-2">
            {QUICK_SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => handleSuggestion(s)}
                className="px-3 py-1.5 text-xs font-medium bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full border border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Indicador de escribiendo */}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 dark:bg-slate-800 px-4 py-3 rounded-2xl rounded-bl-sm flex gap-1">
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex justify-start">
            <div className="bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 px-4 py-2.5 rounded-2xl text-xs border border-red-200 dark:border-red-800">
              {error}
            </div>
          </div>
        )}

        {/* CTA: vincular Telegram tras reserva exitosa */}
        {showTelegramCta && (
          <div className="flex justify-start pt-2">
            <div className="max-w-[90%] bg-sky-50 dark:bg-sky-900/30 border border-sky-200 dark:border-sky-800 rounded-2xl p-3 space-y-2">
              <p className="text-xs text-sky-900 dark:text-sky-100">
                📱 ¿Quieres recibir recordatorios de tu cita por Telegram?
              </p>
              <button
                type="button"
                onClick={handleTelegramLink}
                disabled={telegramLoading}
                className="w-full bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white text-xs font-semibold py-2 px-3 rounded-xl transition-colors"
              >
                {telegramLoading ? "Generando enlace..." : "Conectar con Telegram"}
              </button>
              {telegramError && (
                <p className="text-[11px] text-red-600 dark:text-red-300">{telegramError}</p>
              )}
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-100 dark:border-slate-800 p-3">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe tu mensaje..."
            rows={1}
            disabled={isLoading}
            className="flex-1 resize-none bg-slate-100 dark:bg-slate-800 border-none rounded-2xl px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-emerald-500/30 max-h-24 disabled:opacity-50"
          />
          <button
            type="button"
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            aria-label="Enviar mensaje"
            className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
          >
            <Icon name="send" size="sm" />
          </button>
        </div>
        <p className="text-[10px] text-slate-400 mt-2 text-center">
          Powered by Gemini · Tus datos están protegidos
        </p>
      </div>
    </div>
  );
}
