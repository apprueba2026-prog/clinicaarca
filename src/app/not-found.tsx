import Link from "next/link";
import { Icon } from "@/components/ui/icon";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-surface">
      <div className="text-center max-w-md px-8">
        <Icon name="explore_off" className="text-slate-300 mb-6 text-[72px] w-[72px] h-[72px]" />
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
          <Icon name="home" size="sm" />
          Volver al Inicio
        </Link>
      </div>
    </div>
  );
}
