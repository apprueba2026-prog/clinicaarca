"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { Icon } from "@/components/ui/icon";
import { useBookingStore } from "@/stores/booking.store";
import { usePublicDoctors } from "@/hooks/use-public-doctors";
import { ServiceCard } from "./service-card";
import { DoctorCard } from "./doctor-card";
import { Button } from "@/components/ui/button";
import type { ProcedureCategory } from "@/lib/types/enums";
import type { ServiceCategory } from "@/lib/types/scheduling";

/**
 * Especialidades que se muestran al seleccionar "Especialidades"
 * (Odontología General se extrae al botón principal)
 */
const SPECIALTY_CATEGORIES: ServiceCategory[] = [
  {
    category: "implantes",
    label: "Implantes Dentales",
    icon: "hardware",
    description: "Recupera piezas dentales con tecnología de vanguardia",
  },
  {
    category: "odontopediatria",
    label: "Odontopediatría",
    icon: "child_care",
    description: "Atención especializada para niños y adolescentes",
  },
  {
    category: "ortodoncia",
    label: "Ortodoncia",
    icon: "sentiment_satisfied",
    description: "Alineación dental con brackets y alineadores",
  },
  {
    category: "estetica",
    label: "Estética Dental",
    icon: "auto_awesome",
    description: "Blanqueamiento, carillas y diseño de sonrisa",
  },
  {
    category: "endodoncia",
    label: "Endodoncia",
    icon: "healing",
    description: "Tratamiento de conductos y nervios dentales",
  },
  {
    category: "cirugia",
    label: "Cirugía Oral",
    icon: "medical_services",
    description: "Extracciones complejas y cirugías maxilofaciales",
  },
  {
    category: "periodoncia",
    label: "Periodoncia",
    icon: "ecg_heart",
    description: "Tratamiento de encías y tejidos periodontales",
  },
  {
    category: "sedacion",
    label: "Sedación Consciente",
    icon: "airline_seat_flat",
    description: "Procedimientos sin ansiedad ni dolor",
  },
];

/** Todas las categorías de servicio (incluyendo general) — para uso externo */
export const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    category: "general",
    label: "Odontología General",
    icon: "dentistry",
    description: "Consultas, limpiezas, curaciones y revisiones generales",
  },
  ...SPECIALTY_CATEGORIES,
];

type ViewMode = "main" | "specialties";

// Pestaña "Por Doctor" oculta para versión futura
// type TabMode = "service" | "doctor";

export function StepServiceSelection() {
  const [viewMode, setViewMode] = useState<ViewMode>("main");
  const { selectedCategory, selectedDoctorId, selectCategory, selectDoctor, setSelectionMode, setStep } =
    useBookingStore();
  const { data: doctors, isLoading: loadingDoctors } = usePublicDoctors();

  const handleSelectGeneral = () => {
    selectCategory("general" as ProcedureCategory);
    setSelectionMode("service");
  };

  const handleSelectSpecialty = (category: ProcedureCategory) => {
    selectCategory(category);
    setSelectionMode("service");
  };

  // --- Oculto: selección por doctor (para versión futura con más especialistas) ---
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _handleSelectDoctor = (doctorId: string) => {
    selectDoctor(doctorId);
    setSelectionMode("doctor");
  };

  const handleContinue = () => {
    if (selectedCategory) {
      setStep(2);
    }
  };

  const canContinue = selectedCategory !== null;

  return (
    <div className="space-y-6">
      {/* Título */}
      <div className="text-center">
        <h2 className="font-headline text-xl font-extrabold text-on-surface">
          ¿Qué tipo de atención necesitas?
        </h2>
        <p className="text-sm text-on-surface-variant mt-1">
          Selecciona el tipo de consulta que deseas agendar
        </p>
      </div>

      {/* Vista principal: dos botones grandes */}
      {viewMode === "main" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Botón Odontología General */}
          <button
            type="button"
            onClick={handleSelectGeneral}
            className={cn(
              "group relative flex flex-col items-center gap-4 p-8 rounded-2xl border-2 transition-all duration-300 cursor-pointer text-center",
              "hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]",
              selectedCategory === "general"
                ? "border-primary bg-primary-fixed/30 shadow-lg ring-2 ring-primary/20"
                : "border-outline-variant/40 bg-surface-container-lowest hover:border-primary/50"
            )}
          >
            <div
              className={cn(
                "w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300",
                selectedCategory === "general"
                  ? "bg-primary text-on-primary scale-110"
                  : "bg-primary-fixed text-on-primary-fixed-variant group-hover:scale-105"
              )}
            >
              <Icon name="dentistry" size="xl" />
            </div>
            <div>
              <h3 className="font-headline font-extrabold text-on-surface text-lg">
                Odontología General
              </h3>
              <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">
                Consultas, limpiezas, curaciones y revisiones generales
              </p>
            </div>
            {selectedCategory === "general" && (
              <div className="absolute top-3 right-3">
                <Icon name="check_circle" size="sm" className="text-primary" filled />
              </div>
            )}
          </button>

          {/* Botón Especialidades */}
          <button
            type="button"
            onClick={() => setViewMode("specialties")}
            className={cn(
              "group relative flex flex-col items-center gap-4 p-8 rounded-2xl border-2 transition-all duration-300 cursor-pointer text-center",
              "hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]",
              selectedCategory && selectedCategory !== "general"
                ? "border-primary bg-primary-fixed/30 shadow-lg ring-2 ring-primary/20"
                : "border-outline-variant/40 bg-surface-container-lowest hover:border-primary/50"
            )}
          >
            <div
              className={cn(
                "w-20 h-20 rounded-2xl flex items-center justify-center transition-all duration-300",
                selectedCategory && selectedCategory !== "general"
                  ? "bg-primary text-on-primary scale-110"
                  : "bg-primary-fixed text-on-primary-fixed-variant group-hover:scale-105"
              )}
            >
              <Icon name="local_hospital" size="xl" />
            </div>
            <div>
              <h3 className="font-headline font-extrabold text-on-surface text-lg">
                Especialidades
              </h3>
              <p className="text-sm text-on-surface-variant mt-1 leading-relaxed">
                Ortodoncia, implantes, estética y más
              </p>
            </div>
            {selectedCategory && selectedCategory !== "general" && (
              <div className="absolute top-3 right-3">
                <Icon name="check_circle" size="sm" className="text-primary" filled />
              </div>
            )}
            <div className="flex items-center gap-1 text-xs text-primary font-semibold">
              <span>Ver especialidades</span>
              <Icon name="arrow_forward" size="sm" />
            </div>
          </button>
        </div>
      )}

      {/* Mensaje de recomendación para primera cita */}
      {viewMode === "main" && (
        <div className="flex items-start gap-3 p-4 rounded-xl bg-primary-fixed/20 border border-primary/10">
          <Icon name="lightbulb" size="sm" className="text-primary mt-0.5 flex-shrink-0" filled />
          <p className="text-xs text-on-surface-variant leading-relaxed">
            <strong className="text-on-surface">¿Es tu primera cita?</strong>{" "}
            Recomendamos hacerte una revisión inicial con el odontólogo general para que
            analice en detalle tu caso y te derive al especialista adecuado si es necesario.
          </p>
        </div>
      )}

      {/* Vista de especialidades */}
      {viewMode === "specialties" && (
        <div className="space-y-4">
          {/* Botón volver */}
          <button
            type="button"
            onClick={() => setViewMode("main")}
            className="flex items-center gap-1 text-sm text-primary font-semibold hover:underline cursor-pointer transition-colors"
          >
            <Icon name="arrow_back" size="sm" />
            Volver
          </button>

          <h3 className="font-headline text-base font-bold text-on-surface text-center">
            Selecciona tu especialidad
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {SPECIALTY_CATEGORIES.map((service) => (
              <ServiceCard
                key={service.category}
                icon={service.icon}
                label={service.label}
                description={service.description}
                isSelected={selectedCategory === service.category}
                onClick={() => handleSelectSpecialty(service.category)}
              />
            ))}
          </div>
        </div>
      )}

      {/* --- Oculto: Tab "Por Doctor" (activar cuando haya más especialistas) ---
      <div className="space-y-3">
        {loadingDoctors ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="ml-3 text-sm text-on-surface-variant">
              Cargando especialistas...
            </span>
          </div>
        ) : doctors && doctors.length > 0 ? (
          doctors.map((doctor) => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
              isSelected={selectedDoctorId === doctor.id}
              onClick={() => _handleSelectDoctor(doctor.id)}
            />
          ))
        ) : (
          <div className="text-center py-10 text-on-surface-variant">
            <Icon name="person_off" size="xl" className="text-on-surface-variant/30 mb-2" />
            <p className="text-sm">No hay especialistas disponibles</p>
          </div>
        )}
      </div>
      --- */}

      {/* Botón continuar */}
      <div className="flex justify-end pt-2">
        <Button
          onClick={handleContinue}
          disabled={!canContinue}
          className={cn(!canContinue && "opacity-50 cursor-not-allowed")}
        >
          Continuar
          <Icon name="arrow_forward" size="sm" />
        </Button>
      </div>
    </div>
  );
}
