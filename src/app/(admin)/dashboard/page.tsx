"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { KPICard } from "@/components/shared/kpi-card";
import { AppointmentRow } from "@/components/shared/appointment-row";
import { ClinicPerformance } from "@/components/charts/clinic-performance";
import { SubscriptionPromo } from "@/components/shared/subscription-promo";
import { useTodayAppointments, useDashboardKPIs } from "@/hooks/use-dashboard";
import { useAuth } from "@/hooks/use-auth";
import { formatCurrency } from "@/lib/utils/format-currency";
import { formatFullDateWithTime } from "@/lib/utils/format-date";

const INITIALS_COLORS = [
  "bg-sky-100 dark:bg-sky-900/40 text-sky-700 dark:text-sky-400",
  "bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-400",
  "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400",
  "bg-violet-100 dark:bg-violet-900/40 text-violet-700 dark:text-violet-400",
  "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400",
];

function getInitials(firstName: string, lastName: string) {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

function formatTime12h(time: string) {
  const [h, m] = time.split(":");
  const hour = parseInt(h);
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${String(h12).padStart(2, "0")}:${m} ${ampm}`;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: appointments, isLoading: loadingAppts } =
    useTodayAppointments();
  const { appointmentCount, newPatients, revenue } = useDashboardKPIs();

  const displayName =
    user?.user_metadata?.full_name ??
    user?.user_metadata?.first_name ??
    "Doctor";

  return (
    <>
      {/* Welcome Heading */}
      <header className="mb-10">
        <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white font-headline tracking-tight">
          Hola, {displayName}. Este es el estado de hoy.
        </h2>
        <p className="text-slate-500 mt-1">
          {formatFullDateWithTime(new Date())}
        </p>
      </header>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <KPICard
          icon="calendar_today"
          iconColorClass="text-sky-600 dark:text-sky-400"
          iconBgClass="bg-sky-50 dark:bg-sky-900/30"
          label="Citas Hoy"
          value={appointmentCount.data ?? 0}
          badge={{
            text: "+2 hoy",
            colorClass: "text-green-600 bg-green-50",
          }}
        />
        <KPICard
          icon="person_add"
          iconColorClass="text-indigo-600 dark:text-indigo-400"
          iconBgClass="bg-indigo-50 dark:bg-indigo-900/30"
          label="Nuevos Pacientes (Mes)"
          value={newPatients.data ?? 0}
          badge={{
            text: "Meta: 8",
            colorClass: "text-indigo-600 bg-indigo-50",
          }}
        />
        <KPICard
          icon="payments"
          iconColorClass="text-emerald-600 dark:text-emerald-400"
          iconBgClass="bg-emerald-50 dark:bg-emerald-900/30"
          label="Ingresos Estimados"
          value={formatCurrency(revenue.data ?? 0)}
          badge={{
            text: "Proyectado",
            colorClass: "text-slate-400",
          }}
        />
        <KPICard
          icon="smart_toy"
          iconColorClass="text-amber-600 dark:text-amber-400"
          iconBgClass="bg-amber-50 dark:bg-amber-900/30"
          label="Alertas IA"
          value="1 Reprogramación pendiente"
          warningBorder
          pulse
          valueClassName="!text-lg !font-bold text-amber-700 dark:text-amber-400 leading-tight"
        />
      </div>

      {/* Appointments Table */}
      <section className="bg-surface-container-lowest dark:bg-slate-800 rounded-xl shadow-sm overflow-hidden border border-slate-100 dark:border-slate-800">
        <div className="px-8 py-6 border-b border-slate-50 dark:border-slate-900 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white font-headline">
              Próximas Citas de la Mañana
            </h3>
            <p className="text-sm text-slate-500">
              Mostrando pacientes programados antes de las 12:00 PM
            </p>
          </div>
          <Link
            href="/agenda"
            className="text-sky-600 hover:text-sky-700 text-sm font-bold flex items-center gap-1 transition-colors"
          >
            Ver agenda completa
            <Icon name="arrow_forward" size="sm" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50">
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Hora
                </th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Paciente
                </th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Doctor
                </th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Especialidad
                </th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  Estado
                </th>
                <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-slate-900">
              {loadingAppts ? (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center">
                    <div className="flex items-center justify-center gap-2 text-slate-400">
                      <Icon
                        name="progress_activity"
                        size="sm"
                        className="animate-spin"
                      />
                      Cargando citas...
                    </div>
                  </td>
                </tr>
              ) : appointments && appointments.length > 0 ? (
                appointments.map((appt, i) => (
                  <AppointmentRow
                    key={appt.id}
                    time={formatTime12h(appt.start_time)}
                    patientName={`${appt.patient.first_name} ${appt.patient.last_name.charAt(0)}.`}
                    patientInitials={getInitials(
                      appt.patient.first_name,
                      appt.patient.last_name
                    )}
                    initialsColorClass={
                      INITIALS_COLORS[i % INITIALS_COLORS.length]
                    }
                    doctorName={`${appt.doctor.profile.first_name} ${appt.doctor.profile.last_name}`}
                    specialty={
                      appt.procedure?.category ??
                      appt.doctor.specialty ??
                      "General"
                    }
                    status={appt.status}
                  />
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-8 py-12 text-center">
                    <div className="text-slate-400">
                      <Icon
                        name="event_available"
                        className="text-4xl mb-2 mx-auto block w-fit"
                      />
                      <p className="font-medium">
                        No hay citas programadas para hoy
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="px-8 py-4 bg-slate-50 dark:bg-slate-900/30 text-center">
          <p className="text-[11px] font-mono text-slate-400 tracking-wider">
            Sincronización en tiempo real activa.
          </p>
        </div>
      </section>

      {/* Bottom Section: Chart + Promo */}
      <section className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ClinicPerformance />
        <SubscriptionPromo />
      </section>
    </>
  );
}
