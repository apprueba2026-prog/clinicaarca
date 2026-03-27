"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Icon } from "@/components/ui/icon";
import { PatientRow } from "@/components/shared/patient-row";
import { InvoiceCard } from "@/components/shared/invoice-card";
import { InvoiceModal } from "@/components/shared/invoice-modal";
import { NewPatientModal } from "@/components/shared/new-patient-modal";
import {
  SlideOverPanel,
  SlideOverHeader,
  SlideOverTabs,
} from "@/components/layout/slide-over-panel";
import { useModalStore } from "@/stores/modal.store";
import { useDebounce } from "@/hooks/use-debounce";
import { patientsService } from "@/lib/services/patients.service";
import { invoicesService } from "@/lib/services/invoices.service";
import { formatDate } from "@/lib/utils/format-date";
import { formatCurrency } from "@/lib/utils/format-currency";
import type { Patient } from "@/lib/types/patient";
import type { AppointmentWithDetails } from "@/lib/types/appointment";
import { createClient } from "@/lib/supabase/client";

type PatientFilter = "all" | "debtors" | "this_month";

async function getPatientAppointments(
  patientId: string
): Promise<AppointmentWithDetails[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("appointments")
    .select(
      `id, scheduled_date, start_time, end_time, status, priority, notes, room,
       patient:patients(first_name, last_name, dni, phone),
       doctor:doctors(specialty, profile:profiles(first_name, last_name)),
       procedure:procedures(name, category)`
    )
    .eq("patient_id", patientId)
    .order("scheduled_date", { ascending: false })
    .limit(20);

  if (error) throw error;
  return (data as unknown as AppointmentWithDetails[]) ?? [];
}

const APPOINTMENT_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: "Pendiente", color: "bg-amber-100 text-amber-700" },
  confirmed: { label: "Confirmada", color: "bg-sky-100 text-sky-700" },
  in_progress: { label: "En curso", color: "bg-blue-100 text-blue-700" },
  completed: { label: "Completada", color: "bg-green-100 text-green-700" },
  cancelled: { label: "Cancelada", color: "bg-slate-100 text-slate-500" },
  no_show: { label: "No asistió", color: "bg-red-100 text-red-700" },
};

export default function PacientesPage() {
  const openModal = useModalStore((s) => s.openModal);

  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<PatientFilter>("all");
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  const debouncedSearch = useDebounce(searchQuery, 300);

  // Fetch patients
  const { data: patients = [], isLoading } = useQuery({
    queryKey: ["patients", "list", debouncedSearch],
    queryFn: () =>
      debouncedSearch
        ? patientsService.search(debouncedSearch)
        : patientsService.getAll(0, 50),
  });

  // Fetch invoices for selected patient
  const { data: patientInvoices = [] } = useQuery({
    queryKey: ["invoices", selectedPatient?.id],
    queryFn: () => invoicesService.getByPatient(selectedPatient!.id),
    enabled: !!selectedPatient,
  });

  // Fetch appointments for selected patient
  const { data: patientAppointments = [] } = useQuery({
    queryKey: ["patient-appointments", selectedPatient?.id],
    queryFn: () => getPatientAppointments(selectedPatient!.id),
    enabled: !!selectedPatient,
  });

  // Fetch balance for selected patient
  const { data: patientBalance = 0 } = useQuery({
    queryKey: ["patient-balance", selectedPatient?.id],
    queryFn: () => invoicesService.getPatientBalance(selectedPatient!.id),
    enabled: !!selectedPatient,
  });

  const getAccountStatus = useCallback(() => {
    return "al_dia" as const;
  }, []);

  const filteredPatients = useMemo(() => {
    return patients;
  }, [patients]);

  function handleViewPatient(patient: Patient) {
    setSelectedPatient(patient);
    setActiveTab(0);
  }

  function handleBillingPatient(patient: Patient) {
    setSelectedPatient(patient);
    setActiveTab(2);
  }

  function handleCloseSlideOver() {
    setSelectedPatient(null);
  }

  function handleOpenInvoiceModal() {
    if (!selectedPatient) return;
    openModal("new-invoice", {
      patientId: selectedPatient.id,
      patientName: `${selectedPatient.first_name} ${selectedPatient.last_name}`,
      patientDni: selectedPatient.dni,
    });
  }

  return (
    <>
      {/* Header Section */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-on-surface-variant">
            Directorio de Pacientes
          </h2>
          <p className="text-slate-500 mt-1">
            Gestión centralizada de expedientes y estados de cuenta.
          </p>
        </div>
        <div className="flex gap-4">
          {/* Filter */}
          <div className="relative">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as PatientFilter)}
              className="appearance-none bg-surface-container-lowest border-none px-6 py-3 pr-10 rounded-xl text-sm font-medium shadow-sm focus:ring-2 focus:ring-sky-500/20 cursor-pointer text-slate-600 dark:text-slate-400 dark:bg-slate-800"
            >
              <option value="all">Todos los pacientes</option>
              <option value="debtors">Deudores</option>
              <option value="this_month">Atendidos este mes</option>
            </select>
            <Icon
              name="expand_more"
              size="sm"
              className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400"
            />
          </div>

          {/* New Patient */}
          <button
            onClick={() => openModal("new-patient")}
            className="px-6 py-3 bg-primary text-on-primary rounded-xl font-bold flex items-center gap-2 hover:opacity-90 shadow-lg shadow-primary/20 transition-all cursor-pointer"
          >
            <Icon name="person_add" size="sm" />
            Nuevo Registro
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-xl">
          <Icon
            name="search"
            size="sm"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por DNI, Nombre o Teléfono..."
            className="w-full pl-11 pr-4 py-3 bg-surface-container-lowest dark:bg-slate-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-sky-500/20 shadow-sm"
          />
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-surface-container-lowest dark:bg-slate-900/50 rounded-2xl shadow-sm overflow-hidden border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low/50 dark:bg-slate-800/50">
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                Paciente
              </th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                Contacto
              </th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                Última Visita
              </th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">
                Estado de Cuenta
              </th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-20 text-center">
                  <div className="flex items-center justify-center gap-3 text-slate-400">
                    <Icon
                      name="progress_activity"
                      className="animate-spin"
                    />
                    <span className="text-sm font-medium">
                      Cargando pacientes...
                    </span>
                  </div>
                </td>
              </tr>
            ) : filteredPatients.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <Icon name="person_search" size="xl" />
                    <p className="text-sm font-medium">
                      {debouncedSearch
                        ? "No se encontraron pacientes"
                        : "Sin pacientes registrados"}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              filteredPatients.map((patient) => (
                <PatientRow
                  key={patient.id}
                  patient={patient}
                  lastVisit={null}
                  accountStatus={getAccountStatus()}
                  onView={() => handleViewPatient(patient)}
                  onBilling={() => handleBillingPatient(patient)}
                />
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Slide-over Panel */}
      <SlideOverPanel
        isOpen={!!selectedPatient}
        onClose={handleCloseSlideOver}
      >
        {selectedPatient && (
          <>
            <SlideOverHeader onClose={handleCloseSlideOver} onEdit={() => {}}>
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  {selectedPatient.avatar_url ? (
                    <img
                      src={selectedPatient.avatar_url}
                      alt={selectedPatient.first_name}
                      className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-slate-800 shadow-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center text-sky-700 dark:text-sky-400 font-bold text-2xl border-4 border-white dark:border-slate-800 shadow-lg">
                      {selectedPatient.first_name.charAt(0)}
                      {selectedPatient.last_name.charAt(0)}
                    </div>
                  )}
                  <div className="absolute bottom-0 right-0 w-6 h-6 bg-green-500 border-4 border-white dark:border-slate-800 rounded-full" />
                </div>
                <h3 className="text-xl font-extrabold text-on-surface">
                  {selectedPatient.first_name} {selectedPatient.last_name}
                </h3>
                <p className="text-sm text-slate-500">
                  DNI: {selectedPatient.dni}
                  {selectedPatient.is_premium && " • Paciente Premium"}
                </p>
              </div>
            </SlideOverHeader>

            <SlideOverTabs
              tabs={["Historial", "Citas", "Facturación"]}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />

            <div className="flex-1 overflow-y-auto p-8">
              {/* Tab: Historial */}
              {activeTab === 0 && (
                <div className="space-y-4">
                  <h4 className="text-sm font-extrabold text-slate-500 uppercase tracking-widest mb-4">
                    Datos del Paciente
                  </h4>
                  <div className="space-y-3">
                    <InfoRow
                      icon="phone"
                      label="Teléfono"
                      value={selectedPatient.phone}
                    />
                    <InfoRow
                      icon="mail"
                      label="Email"
                      value={selectedPatient.email || "No registrado"}
                    />
                    <InfoRow
                      icon="cake"
                      label="Nacimiento"
                      value={
                        selectedPatient.birth_date
                          ? formatDate(selectedPatient.birth_date)
                          : "No registrado"
                      }
                    />
                    <InfoRow
                      icon="location_on"
                      label="Dirección"
                      value={selectedPatient.address || "No registrada"}
                    />
                    <InfoRow
                      icon="calendar_today"
                      label="Registrado"
                      value={formatDate(selectedPatient.created_at)}
                    />
                  </div>
                  {selectedPatient.notes && (
                    <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                      <p className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase mb-1">
                        Notas
                      </p>
                      <p className="text-sm text-amber-800 dark:text-amber-300">
                        {selectedPatient.notes}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Citas */}
              {activeTab === 1 && (
                <div>
                  <h4 className="text-sm font-extrabold text-slate-500 uppercase tracking-widest mb-4">
                    Historial de Citas
                  </h4>
                  {patientAppointments.length === 0 ? (
                    <div className="py-12 text-center text-slate-400">
                      <Icon name="event_busy" size="xl" />
                      <p className="text-sm mt-2">Sin citas registradas</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {patientAppointments.map((appt) => {
                        const statusConfig =
                          APPOINTMENT_STATUS_LABELS[appt.status] ??
                          APPOINTMENT_STATUS_LABELS.pending;
                        return (
                          <div
                            key={appt.id}
                            className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl"
                          >
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-sm font-bold text-on-surface">
                                  {appt.procedure?.name ?? "Consulta General"}
                                </p>
                                <p className="text-xs text-slate-500 mt-0.5">
                                  {formatDate(appt.scheduled_date)} •{" "}
                                  {appt.start_time.slice(0, 5)} -{" "}
                                  {appt.end_time.slice(0, 5)}
                                </p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                  Dr. {appt.doctor.profile.first_name}{" "}
                                  {appt.doctor.profile.last_name}
                                </p>
                              </div>
                              <span
                                className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-tight rounded-full ${statusConfig.color}`}
                              >
                                {statusConfig.label}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Facturación */}
              {activeTab === 2 && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="text-sm font-extrabold text-slate-500 uppercase tracking-widest">
                      Comprobantes Emitidos
                    </h4>
                    <button
                      onClick={handleOpenInvoiceModal}
                      className="text-xs font-bold text-sky-700 dark:text-sky-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Icon name="add_circle" size="sm" />
                      Generar Nuevo
                    </button>
                  </div>

                  {patientInvoices.length === 0 ? (
                    <div className="py-12 text-center text-slate-400">
                      <Icon name="receipt_long" size="xl" />
                      <p className="text-sm mt-2">Sin comprobantes</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {patientInvoices.map((inv) => (
                        <InvoiceCard key={inv.id} invoice={inv} />
                      ))}
                    </div>
                  )}

                  {/* Balance Card */}
                  {patientBalance > 0 && (
                    <div className="mt-8 p-6 rounded-2xl bg-primary text-on-primary flex flex-col gap-4 shadow-xl shadow-primary/20">
                      <div>
                        <p className="text-xs font-medium opacity-80 uppercase">
                          Saldo Pendiente
                        </p>
                        <p className="text-3xl font-extrabold tracking-tight">
                          {formatCurrency(patientBalance)}
                        </p>
                      </div>
                      <button className="w-full py-3 bg-white text-primary font-extrabold rounded-xl hover:bg-slate-50 transition-colors cursor-pointer">
                        Cobrar Ahora
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </SlideOverPanel>

      {/* Modals */}
      <NewPatientModal />
      <InvoiceModal />
    </>
  );
}

/** Helper: Info row for Historial tab */
function InfoRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon name={icon} size="sm" className="text-slate-400" />
      <div>
        <p className="text-[10px] font-bold text-slate-400 uppercase">
          {label}
        </p>
        <p className="text-sm text-on-surface">{value}</p>
      </div>
    </div>
  );
}
