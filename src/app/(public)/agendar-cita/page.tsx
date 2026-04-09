import type { Metadata } from "next";
import { Suspense } from "react";
import { BookingWizard } from "./_components/booking-wizard";

export const metadata: Metadata = {
  title: "Agendar Cita — Clínica Arca",
  description:
    "Agenda tu cita dental en Clínica Arca. Consulta gratuita con nuestros especialistas. Selecciona horario y confirma en minutos.",
};

export default function AgendarCitaPage() {
  return (
    <section className="min-h-[calc(100vh-80px)] py-10 px-4 sm:px-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="font-headline text-3xl sm:text-4xl font-extrabold text-on-surface">
          Agenda tu Cita
        </h1>
        <p className="text-base text-on-surface-variant mt-2 max-w-lg mx-auto">
          Reserva tu consulta en pocos pasos. Sin complicaciones, sin esperas.
        </p>
      </div>

      {/* Wizard */}
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        }
      >
        <BookingWizard />
      </Suspense>
    </section>
  );
}
