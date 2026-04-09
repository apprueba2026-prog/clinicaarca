"use client";

import { Icon } from "@/components/ui/icon";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md">
        <Icon name="error" className="text-error mb-4 text-[48px] w-[48px] h-[48px]" />
        <h2 className="text-xl font-extrabold text-on-surface mb-2">
          Algo salió mal
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          {error.message || "Ocurrió un error inesperado. Intenta de nuevo."}
        </p>
        <button
          onClick={reset}
          className="px-6 py-2.5 bg-primary text-on-primary font-bold rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all cursor-pointer"
        >
          Reintentar
        </button>
      </div>
    </div>
  );
}
