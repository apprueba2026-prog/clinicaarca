"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center max-w-md px-8">
          <h1 className="text-4xl font-extrabold text-slate-900 mb-2">
            Error del Sistema
          </h1>
          <p className="text-sm text-slate-500 mb-6">
            {error.message || "Ocurrió un error crítico. Intenta recargar la página."}
          </p>
          <button
            onClick={reset}
            className="px-6 py-3 bg-sky-600 text-white font-bold rounded-xl hover:bg-sky-700 transition-colors cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      </body>
    </html>
  );
}
