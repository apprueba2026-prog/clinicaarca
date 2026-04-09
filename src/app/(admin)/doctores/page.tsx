"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import {
  SlideOverPanel,
  SlideOverHeader,
  SlideOverTabs,
} from "@/components/layout/slide-over-panel";
import {
  useAdminDoctors,
  useToggleDoctorPublic,
} from "@/hooks/use-admin-doctors";
import { DoctorFormModal } from "./_components/doctor-form-modal";
import { ScheduleEditor } from "./_components/schedule-editor";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import type { DoctorWithProfile } from "@/lib/types/doctor";

const SPECIALTY_LABELS: Record<string, string> = {
  general: "Odontología General",
  implantes: "Implantes Dentales",
  odontopediatria: "Odontopediatría",
  ortodoncia: "Ortodoncia",
  sedacion: "Sedación Dental",
  cirugia: "Cirugía Oral",
  estetica: "Estética Dental",
  endodoncia: "Endodoncia",
  periodoncia: "Periodoncia",
};

export default function DoctoresPage() {
  const { data: doctors = [], isLoading } = useAdminDoctors();
  const togglePublicMutation = useToggleDoctorPublic();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<DoctorWithProfile | null>(null);
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorWithProfile | null>(null);
  const [activeTab, setActiveTab] = useState(0);

  const handleTogglePublic = (doctor: DoctorWithProfile) => {
    togglePublicMutation.mutate({
      id: doctor.id,
      isPublic: !doctor.is_public,
    });
  };

  const handleEditFromSlideOver = () => {
    if (selectedDoctor) {
      setEditingDoctor(selectedDoctor);
      setSelectedDoctor(null);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-end justify-between mb-8">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-on-surface-variant">
            Gestión de Doctores
          </h2>
          <p className="text-on-surface-variant mt-1">
            Administra especialistas, horarios y visibilidad pública.
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-3 bg-primary text-on-primary rounded-xl font-bold flex items-center gap-2 hover:opacity-90 shadow-lg shadow-primary/20 transition-all cursor-pointer"
        >
          <Icon name="person_add" size="sm" />
          Nuevo Doctor
        </button>
      </div>

      {/* Table */}
      <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden border border-outline-variant">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-low/50">
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Doctor
              </th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Especialidades
              </th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Colegiatura
              </th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Consulta
              </th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                Estado
              </th>
              <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-on-surface-variant text-right">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {isLoading ? (
              <tr>
                <td colSpan={6} className="px-6 py-20 text-center">
                  <div className="flex items-center justify-center gap-3 text-on-surface-variant">
                    <Icon name="progress_activity" className="animate-spin" />
                    <span className="text-sm font-medium">Cargando doctores...</span>
                  </div>
                </td>
              </tr>
            ) : doctors.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-20 text-center">
                  <div className="flex flex-col items-center gap-2 text-on-surface-variant">
                    <Icon name="stethoscope" size="xl" />
                    <p className="text-sm font-medium">Sin doctores registrados</p>
                  </div>
                </td>
              </tr>
            ) : (
              doctors.map((doctor) => (
                <tr
                  key={doctor.id}
                  className="hover:bg-surface-container-low/30 transition-colors"
                >
                  {/* Doctor */}
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                        {doctor.profile.first_name.charAt(0)}
                        {doctor.profile.last_name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-on-surface">
                          Dr(a). {doctor.profile.first_name} {doctor.profile.last_name}
                        </p>
                        <p className="text-xs text-on-surface-variant">
                          {doctor.profile.email}
                        </p>
                      </div>
                    </div>
                  </td>

                  {/* Especialidades */}
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {doctor.specialties.map((s) => (
                        <span
                          key={s}
                          className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium"
                        >
                          {SPECIALTY_LABELS[s] ?? s}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Colegiatura */}
                  <td className="px-6 py-4">
                    <span className="text-sm text-on-surface-variant">
                      {doctor.license_number ?? "—"}
                    </span>
                  </td>

                  {/* Duración */}
                  <td className="px-6 py-4">
                    <span className="text-sm text-on-surface-variant">
                      {doctor.consultation_duration_minutes} min
                    </span>
                  </td>

                  {/* Estado */}
                  <td className="px-6 py-4">
                    <button
                      onClick={() => handleTogglePublic(doctor)}
                      className={cn(
                        "px-3 py-1 text-xs font-bold rounded-full cursor-pointer transition-colors",
                        doctor.is_public
                          ? "bg-green-100 text-green-700 hover:bg-green-200"
                          : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                      )}
                    >
                      {doctor.is_public ? "Público" : "Oculto"}
                    </button>
                  </td>

                  {/* Acciones */}
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditingDoctor(doctor)}
                        className="p-2 hover:bg-surface-container-high rounded-lg cursor-pointer text-on-surface-variant hover:text-primary transition-colors"
                        title="Editar"
                      >
                        <Icon name="edit" size="sm" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedDoctor(doctor);
                          setActiveTab(0);
                        }}
                        className="p-2 hover:bg-surface-container-high rounded-lg cursor-pointer text-on-surface-variant hover:text-primary transition-colors"
                        title="Ver detalles"
                      >
                        <Icon name="visibility" size="sm" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Slide-over: Doctor Details + Schedule Editor */}
      <SlideOverPanel
        isOpen={!!selectedDoctor}
        onClose={() => setSelectedDoctor(null)}
      >
        {selectedDoctor && (
          <>
            <SlideOverHeader onClose={() => setSelectedDoctor(null)}>
              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-2xl border-4 border-surface-container-lowest shadow-lg mb-4">
                  {selectedDoctor.profile.first_name.charAt(0)}
                  {selectedDoctor.profile.last_name.charAt(0)}
                </div>
                <h3 className="text-xl font-extrabold text-on-surface">
                  Dr(a). {selectedDoctor.profile.first_name}{" "}
                  {selectedDoctor.profile.last_name}
                </h3>
                <p className="text-sm text-on-surface-variant">
                  {selectedDoctor.specialties
                    .map((s) => SPECIALTY_LABELS[s] ?? s)
                    .join(" · ")}
                  {" • "}
                  {selectedDoctor.license_number ?? "Sin colegiatura"}
                </p>
                <span
                  className={cn(
                    "mt-2 px-3 py-1 text-xs font-bold rounded-full",
                    selectedDoctor.is_public
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-100 text-slate-500"
                  )}
                >
                  {selectedDoctor.is_public ? "Público" : "Oculto"}
                </span>
              </div>
            </SlideOverHeader>

            <SlideOverTabs
              tabs={["Información", "Horarios"]}
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />

            <div className="flex-1 overflow-y-auto p-8">
              {/* Tab: Info */}
              {activeTab === 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-extrabold text-on-surface-variant uppercase tracking-widest">
                      Datos del Doctor
                    </h4>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleEditFromSlideOver}
                    >
                      <Icon name="edit" size="sm" />
                      Editar
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <InfoRow
                      icon="mail"
                      label="Email"
                      value={selectedDoctor.profile.email}
                    />
                    <InfoRow
                      icon="badge"
                      label="Colegiatura"
                      value={selectedDoctor.license_number ?? "No registrada"}
                    />
                    <InfoRow
                      icon="schedule"
                      label="Duración consulta"
                      value={`${selectedDoctor.consultation_duration_minutes} minutos`}
                    />
                    <InfoRow
                      icon="calendar_today"
                      label="Registrado"
                      value={new Date(
                        selectedDoctor.created_at
                      ).toLocaleDateString("es-PE")}
                    />
                  </div>
                  {selectedDoctor.specialties.length > 0 && (
                    <div className="mt-6 p-4 bg-primary/5 rounded-xl">
                      <p className="text-xs font-bold text-primary uppercase mb-2">
                        Especialidades
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedDoctor.specialties.map((s) => (
                          <span
                            key={s}
                            className="text-xs px-3 py-1 bg-primary/10 text-primary rounded-full font-semibold"
                          >
                            {SPECIALTY_LABELS[s] ?? s}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectedDoctor.bio && (
                    <div className="mt-4 p-4 bg-primary/5 rounded-xl">
                      <p className="text-xs font-bold text-primary uppercase mb-1">
                        Biografía
                      </p>
                      <p className="text-sm text-on-surface leading-relaxed">
                        {selectedDoctor.bio}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Tab: Horarios */}
              {activeTab === 1 && (
                <ScheduleEditor doctorId={selectedDoctor.id} />
              )}
            </div>
          </>
        )}
      </SlideOverPanel>

      {/* Create/Edit Modal */}
      <DoctorFormModal
        isOpen={showCreateModal || !!editingDoctor}
        onClose={() => {
          setShowCreateModal(false);
          setEditingDoctor(null);
        }}
        doctor={editingDoctor ?? undefined}
      />
    </>
  );
}

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
      <Icon name={icon} size="sm" className="text-on-surface-variant" />
      <div>
        <p className="text-[10px] font-bold text-on-surface-variant uppercase">
          {label}
        </p>
        <p className="text-sm text-on-surface">{value}</p>
      </div>
    </div>
  );
}
