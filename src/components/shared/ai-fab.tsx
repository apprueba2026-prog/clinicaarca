"use client";

import Image from "next/image";
import { Icon } from "@/components/ui/icon";
import { useAIChatStore } from "@/stores/ai-chat.store";
import { AIChatPanel } from "./ai-chat-panel";

export function AIFab() {
  const { toggle, isOpen } = useAIChatStore();

  return (
    <>
      <div className="fixed bottom-8 right-8 z-[100]">
        <div className="relative group">
          {/* Indicador pulsante (solo cuando está cerrado) */}
          {!isOpen && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse z-10" />
          )}

          {/* Botón principal */}
          <button
            type="button"
            onClick={toggle}
            aria-label={isOpen ? "Cerrar Noé" : "Abrir Noé"}
            className="bg-white dark:bg-slate-900 h-16 w-16 rounded-full flex items-center justify-center shadow-2xl shadow-primary/20 ring-4 ring-primary/30 hover:scale-110 transition-transform cursor-pointer overflow-hidden border border-primary/10 dark:border-primary/30"
          >
            {isOpen ? (
              <Icon name="close" className="text-primary" size="lg" />
            ) : (
              <div className="relative w-12 h-12 animate-noe-breathe group-hover:rotate-[3deg] transition-transform">
                <Image
                  src="/logo-nav.png"
                  alt="Noé"
                  fill
                  sizes="48px"
                  className="object-contain"
                  priority={false}
                />
              </div>
            )}
          </button>

          {/* Tooltip (solo cuando está cerrado) */}
          {!isOpen && (
            <div className="absolute bottom-20 right-0 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl shadow-xl whitespace-nowrap border border-emerald-50 dark:border-emerald-900/40 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <p className="text-sm font-bold text-on-surface dark:text-slate-100">
                Noé
              </p>
              <p className="text-xs text-on-surface-variant dark:text-slate-400">
                Consultas rápidas
              </p>
            </div>
          )}
        </div>
      </div>

      <AIChatPanel />
    </>
  );
}
