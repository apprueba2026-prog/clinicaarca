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

const SERVICE_CATEGORIES: ServiceCategory[] = [
  {
    category: "general",
    label: "Odontología General",
    icon: "dentistry",
    description: "Consultas, limpiezas, curaciones y revisiones generales",
  },
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

type TabMode = "service" | "doctor";

export function StepServiceSelection() {
  const [activeTab, setActiveTab] = useState<TabMode>("service");
  const { selectedCategory, selectedDoctorId, selectCategory, selectDoctor, setSelectionMode, setStep } =
    useBookingStore();
  const { data: doctors, isLoading: loadingDoctors } = usePublicDoctors();

  const handleSelectCategory = (category: ProcedureCategory) => {
    selectCategory(category);
    setSelectionMode("service");
  };

  const handleSelectDoctor = (doctorId: string) => {
    selectDoctor(doctorId);
    setSelectionMode("doctor");
  };

  const handleContinue = () => {
    if (activeTab === "doctor" && selectedDoctorId) {
      // Ir directo al paso 3 (fecha/hora)
      setStep(3);
    } else if (activeTab === "service" && selectedCategory) {
      // Ir al paso 2 (selección de doctor)
      setStep(2);
    }
  };

  const canContinue =
    (activeTab === "service" && selectedCategory !== null) ||
    (activeTab === "doctor" && selectedDoctorId !== null);

  return (
    <div className="space-y-6">
      {/* Título */}
      <div className="text-center">
        <h2 className="font-headline text-xl font-extrabold text-on-surface">
          ¿Cómo deseas buscar?
        </h2>
        <p className="text-sm text-on-surface-variant mt-1">
          Selecciona por servicio o elige directamente a tu especialista
        </p>
      </div>

      {/* Tabs */}
      <div className="flex bg-surface-container-high rounded-xl p-1 gap-1">
        {[
          { id: "service" as TabMode, label: "Por Servicio", icon: "medical_services" },
          { id: "doctor" as TabMode, label: "Por Doctor", icon: "person" },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 cursor-pointer",
              activeTab === tab.id
                ? "bg-surface-container-lowest text-primary shadow-sm"
                : "text-on-surface-variant hover:text-on-surface"
            )}
          >
            <Icon name={tab.icon} size="sm" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Contenido */}
      {activeTab === "service" ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {SERVICE_CATEGORIES.map((service) => (
            <ServiceCard
              key={service.category}
              icon={service.icon}
              label={service.label}
              description={service.description}
              isSelected={selectedCategory === service.category}
              onClick={() => handleSelectCategory(service.category)}
            />
          ))}
        </div>
      ) : (
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
                onClick={() => handleSelectDoctor(doctor.id)}
              />
            ))
          ) : (
            <div className="text-center py-10 text-on-surface-variant">
              <Icon name="person_off" size="xl" className="text-on-surface-variant/30 mb-2" />
              <p className="text-sm">No hay especialistas disponibles</p>
            </div>
          )}
        </div>
      )}

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
