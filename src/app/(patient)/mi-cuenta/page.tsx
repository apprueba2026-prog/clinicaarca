"use client";

import { useAuth } from "@/hooks/use-auth";
import { Icon } from "@/components/ui/icon";
import { PatientDashboard } from "./_components/patient-dashboard";

export default function MiCuentaPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Icon name="progress_activity" size="lg" className="animate-spin text-primary" />
      </div>
    );
  }

  const firstName = user?.user_metadata?.first_name;

  return (
    <div>
      {/* Header de bienvenida */}
      <div className="border-b border-outline-variant/20 dark:border-slate-800/50 bg-surface-container-lowest/50 dark:bg-slate-900/30">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
          <h1 className="text-xl font-headline font-bold text-on-surface dark:text-white">
            {firstName ? `Hola, ${firstName}` : "Mi Cuenta"}
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Gestiona tus citas y datos personales
          </p>
        </div>
      </div>

      {/* Dashboard con tabs */}
      <PatientDashboard />
    </div>
  );
}
