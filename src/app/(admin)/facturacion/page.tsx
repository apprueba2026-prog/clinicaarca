import type { Metadata } from "next";
import { Icon } from "@/components/ui/icon";

export const metadata: Metadata = {
  title: "Facturación",
  description: "Gestión de comprobantes electrónicos, boletas y facturas SUNAT.",
};

export default function FacturacionPage() {
  return (
    <>
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold tracking-tight text-on-surface-variant">
          Facturación SUNAT
        </h2>
        <p className="text-slate-500 mt-1">
          Gestión centralizada de comprobantes electrónicos.
        </p>
      </div>

      <div className="bg-surface-container-lowest dark:bg-slate-900/50 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-16 flex flex-col items-center text-center">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Icon name="receipt_long" size="xl" className="text-primary" />
        </div>
        <h3 className="text-xl font-extrabold text-on-surface mb-2">
          Módulo en Desarrollo
        </h3>
        <p className="text-sm text-slate-500 max-w-md mb-6">
          El módulo de facturación electrónica con integración directa a SUNAT
          estará disponible próximamente. Incluirá emisión de boletas, facturas
          y reportes contables.
        </p>
        <div className="flex gap-4">
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-center">
            <Icon name="description" size="md" className="text-sky-600 mb-1" />
            <p className="text-[10px] font-bold text-slate-500 uppercase">Boletas</p>
          </div>
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-center">
            <Icon name="article" size="md" className="text-sky-600 mb-1" />
            <p className="text-[10px] font-bold text-slate-500 uppercase">Facturas</p>
          </div>
          <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-center">
            <Icon name="analytics" size="md" className="text-sky-600 mb-1" />
            <p className="text-[10px] font-bold text-slate-500 uppercase">Reportes</p>
          </div>
        </div>
      </div>
    </>
  );
}
