import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-surface">
      <div className="text-center max-w-md px-8">
        <span className="material-symbols-outlined text-7xl text-slate-300 mb-6 block">
          explore_off
        </span>
        <h1 className="text-4xl font-extrabold text-on-surface mb-2">404</h1>
        <h2 className="text-lg font-bold text-slate-500 mb-4">
          Página no encontrada
        </h2>
        <p className="text-sm text-slate-400 mb-8">
          La página que buscas no existe o fue movida.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary font-bold rounded-xl shadow-lg shadow-primary/20 hover:opacity-90 transition-all"
        >
          <span className="material-symbols-outlined text-sm">home</span>
          Volver al Inicio
        </Link>
      </div>
    </div>
  );
}
