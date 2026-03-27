"use client";

import { Icon } from "@/components/ui/icon";

export function AIFab() {
  return (
    <div className="fixed bottom-8 right-8 z-[100]">
      <div className="relative group">
        {/* Indicador pulsante */}
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-slate-900 animate-pulse z-10" />

        {/* Botón principal */}
        <button className="bg-white dark:bg-slate-900 h-16 w-16 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/20 ring-4 ring-emerald-500/30 hover:scale-110 transition-transform cursor-pointer overflow-hidden border border-emerald-100 dark:border-emerald-900">
          <Icon name="smart_toy" className="text-emerald-500" size="lg" />
        </button>

        {/* Tooltip */}
        <div className="absolute bottom-20 right-0 bg-white dark:bg-slate-800 px-4 py-2 rounded-xl shadow-xl whitespace-nowrap border border-emerald-50 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          <p className="text-sm font-bold text-on-surface">Arca Assistant</p>
          <p className="text-xs text-on-surface-variant">Consultas rápidas</p>
        </div>
      </div>
    </div>
  );
}
