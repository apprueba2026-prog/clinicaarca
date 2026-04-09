import type { Metadata } from "next";
import { Icon } from "@/components/ui/icon";

export const metadata: Metadata = {
  title: "Configuración",
  description: "Ajustes generales de la clínica, horarios y preferencias del sistema.",
};

export default function ConfiguracionPage() {
  return (
    <>
      <div className="mb-8">
        <h2 className="text-3xl font-extrabold tracking-tight text-on-surface-variant">
          Configuración
        </h2>
        <p className="text-slate-500 mt-1">
          Ajustes generales del sistema y la clínica.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Datos de la Clínica */}
        <div className="bg-surface-container-lowest dark:bg-slate-900/50 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
              <Icon name="apartment" size="md" className="text-sky-700 dark:text-sky-400" />
            </div>
            <div>
              <h3 className="font-bold text-on-surface">Datos de la Clínica</h3>
              <p className="text-xs text-slate-500">Nombre, dirección, teléfono</p>
            </div>
          </div>
          <p className="text-xs text-slate-400">Próximamente</p>
        </div>

        {/* Horarios de Atención */}
        <div className="bg-surface-container-lowest dark:bg-slate-900/50 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Icon name="schedule" size="md" className="text-emerald-700 dark:text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-on-surface">Horarios de Atención</h3>
              <p className="text-xs text-slate-500">Días y horas por consultorio</p>
            </div>
          </div>
          <p className="text-xs text-slate-400">Próximamente</p>
        </div>

        {/* Usuarios y Roles */}
        <div className="bg-surface-container-lowest dark:bg-slate-900/50 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
              <Icon name="admin_panel_settings" size="md" className="text-violet-700 dark:text-violet-400" />
            </div>
            <div>
              <h3 className="font-bold text-on-surface">Usuarios y Roles</h3>
              <p className="text-xs text-slate-500">Admin, dentista, recepcionista</p>
            </div>
          </div>
          <p className="text-xs text-slate-400">Próximamente</p>
        </div>

        {/* Notificaciones */}
        <div className="bg-surface-container-lowest dark:bg-slate-900/50 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Icon name="notifications_active" size="md" className="text-amber-700 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="font-bold text-on-surface">Notificaciones</h3>
              <p className="text-xs text-slate-500">WhatsApp, email, recordatorios</p>
            </div>
          </div>
          <p className="text-xs text-slate-400">Próximamente</p>
        </div>
      </div>
    </>
  );
}
