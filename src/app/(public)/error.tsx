"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/icon";

export default function PublicError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <div className="text-center max-w-md">
        <Icon name="error" className="text-error mb-4 text-[48px] w-[48px] h-[48px]" />
        <h2 className="text-xl font-extrabold text-on-surface dark:text-white mb-2">
          Algo salió mal
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          {error.message || "Ocurrió un error inesperado. Intenta de nuevo."}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-6 py-2.5 bg-primary text-on-primary font-bold rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all cursor-pointer"
          >
            Reintentar
          </button>
          <Link
            href="/"
            className="px-6 py-2.5 bg-slate-100 dark:bg-slate-800 text-on-surface dark:text-white font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
          >
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
