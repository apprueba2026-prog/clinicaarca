"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useBookingStore } from "@/stores/booking.store";
import { StepIndicator } from "./step-indicator";
import { StepServiceSelection } from "./step-service-selection";
import { StepDoctorSelection } from "./step-doctor-selection";
import { StepDatetimeSelection } from "./step-datetime-selection";
import { StepConfirmation } from "./step-confirmation";

const WIZARD_STEPS = [
  { label: "Servicio", icon: "medical_services" },
  { label: "Especialista", icon: "person" },
  { label: "Fecha y hora", icon: "calendar_month" },
  { label: "Confirmar", icon: "check_circle" },
];

export function BookingWizard() {
  const searchParams = useSearchParams();
  const { currentStep, restoreDraft } = useBookingStore();

  // Restaurar draft si viene de login/registro
  useEffect(() => {
    const restore = searchParams.get("restore");
    if (restore === "1") {
      restoreDraft();
    }
  }, [searchParams, restoreDraft]);

  return (
    <div className="max-w-3xl mx-auto">
      {/* Indicador de pasos */}
      <div className="mb-8">
        <StepIndicator currentStep={currentStep} steps={WIZARD_STEPS} />
      </div>

      {/* Contenido del paso actual */}
      <div className="bg-surface-container-low/50 backdrop-blur-sm rounded-3xl p-6 sm:p-8 border border-outline-variant/20 shadow-sm">
        {currentStep === 1 && <StepServiceSelection />}
        {currentStep === 2 && <StepDoctorSelection />}
        {currentStep === 3 && <StepDatetimeSelection />}
        {currentStep === 4 && <StepConfirmation />}
      </div>
    </div>
  );
}
