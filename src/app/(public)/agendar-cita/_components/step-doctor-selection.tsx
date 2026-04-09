"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils/cn";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { useBookingStore } from "@/stores/booking.store";
import { useDoctorsByCategory } from "@/hooks/use-public-doctors";
import { DoctorCard } from "./doctor-card";

const CATEGORY_LABELS: Record<string, string> = {
  general: "Odontología General",
  odontopediatria: "Odontopediatría",
  implantes: "Implantes Dentales",
  ortodoncia: "Ortodoncia",
  sedacion: "Sedación Consciente",
  cirugia: "Cirugía Oral",
  estetica: "Estética Dental",
  endodoncia: "Endodoncia",
  periodoncia: "Periodoncia",
};

export function StepDoctorSelection() {
  const { selectedCategory, selectedDoctorId, selectDoctor, setStep, goBack } =
    useBookingStore();
  const { data: doctors, isLoading } = useDoctorsByCategory(selectedCategory);

  // Auto-seleccionar si solo hay 1 doctor y avanzar
  useEffect(() => {
    if (doctors && doctors.length === 1 && !selectedDoctorId) {
      selectDoctor(doctors[0].id);
      setStep(3);
    }
  }, [doctors, selectedDoctorId, selectDoctor, setStep]);

  const categoryLabel = selectedCategory
    ? CATEGORY_LABELS[selectedCategory] ?? selectedCategory
    : "";

  const handleContinue = () => {
    if (selectedDoctorId) {
      setStep(3);
    }
  };

  return (
    <div className="space-y-6">
      {/* Título */}
      <div className="text-center">
        <h2 className="font-headline text-xl font-extrabold text-on-surface">
          Selecciona especialista
        </h2>
        <p className="text-sm text-on-surface-variant mt-1">
          Especialistas disponibles en{" "}
          <span className="font-semibold text-primary">{categoryLabel}</span>
        </p>
      </div>

      {/* Lista de doctores */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-10">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            <span className="ml-3 text-sm text-on-surface-variant">
              Buscando especialistas...
            </span>
          </div>
        ) : doctors && doctors.length > 0 ? (
          doctors.map((doctor) => (
            <DoctorCard
              key={doctor.id}
              doctor={doctor}
              isSelected={selectedDoctorId === doctor.id}
              onClick={() => selectDoctor(doctor.id)}
            />
          ))
        ) : (
          <div className="text-center py-10 text-on-surface-variant">
            <Icon name="person_off" size="xl" className="text-on-surface-variant/30 mb-2" />
            <p className="text-sm">
              No hay especialistas disponibles para esta categoría
            </p>
          </div>
        )}
      </div>

      {/* Botones */}
      <div className="flex justify-between pt-2">
        <Button variant="ghost" onClick={goBack}>
          <Icon name="arrow_back" size="sm" />
          Atrás
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!selectedDoctorId}
          className={cn(!selectedDoctorId && "opacity-50 cursor-not-allowed")}
        >
          Continuar
          <Icon name="arrow_forward" size="sm" />
        </Button>
      </div>
    </div>
  );
}
