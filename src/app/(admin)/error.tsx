"use client";

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
        <span className="material-symbols-outlined text-5xl text-error mb-4 block">
          error
        </span>
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
