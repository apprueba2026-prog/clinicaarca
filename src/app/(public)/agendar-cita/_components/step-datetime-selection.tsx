"use client";

import { cn } from "@/lib/utils/cn";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { useBookingStore } from "@/stores/booking.store";
import { useAvailableSlots } from "@/hooks/use-available-slots";
import { usePublicDoctors } from "@/hooks/use-public-doctors";
import { CalendarPicker } from "./calendar-picker";
import { TimeSlotGrid } from "./time-slot-grid";

export function StepDatetimeSelection() {
  const {
    selectedDoctorId,
    selectedDate,
    selectedSlot,
    selectDate,
    selectSlot,
    setStep,
    goBack,
  } = useBookingStore();

  const { data: doctors } = usePublicDoctors();
  const { data: slots, isLoading: loadingSlots } = useAvailableSlots(
    selectedDoctorId,
    selectedDate
  );

  const doctor = doctors?.find((d) => d.id === selectedDoctorId);
  const doctorName = doctor
    ? `Dr(a). ${doctor.profile?.first_name} ${doctor.profile?.last_name}`
    : "";

  const handleContinue = () => {
    if (selectedSlot) {
      setStep(4);
    }
  };

  const canContinue = selectedDate !== null && selectedSlot !== null;

  return (
    <div className="space-y-6">
      {/* Título */}
      <div className="text-center">
        <h2 className="font-headline text-xl font-extrabold text-on-surface">
          Selecciona fecha y hora
        </h2>
        {doctorName && (
          <p className="text-sm text-on-surface-variant mt-1">
            Agenda con{" "}
            <span className="font-semibold text-primary">{doctorName}</span>
            {" · "}
            <span className="text-on-surface-variant">
              Consulta de {doctor?.consultation_duration_minutes ?? 30} min
            </span>
          </p>
        )}
      </div>

      {/* Calendario + Slots */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Calendario */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Icon name="calendar_month" size="sm" className="text-primary" />
            <span className="text-sm font-semibold text-on-surface">
              Fecha
            </span>
          </div>
          <CalendarPicker
            selectedDate={selectedDate}
            onSelectDate={selectDate}
          />
        </div>

        {/* Slots de hora */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <Icon name="schedule" size="sm" className="text-primary" />
            <span className="text-sm font-semibold text-on-surface">
              Horario disponible
            </span>
          </div>

          {!selectedDate ? (
            <div className="flex flex-col items-center justify-center py-10 bg-surface-container-lowest rounded-2xl border border-outline-variant/30">
              <Icon
                name="event"
                size="xl"
                className="text-on-surface-variant/30 mb-2"
              />
              <p className="text-sm text-on-surface-variant">
                Selecciona una fecha para ver horarios
              </p>
            </div>
          ) : (
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-4">
              <TimeSlotGrid
                slots={slots ?? []}
                selectedSlot={selectedSlot}
                onSelectSlot={selectSlot}
                isLoading={loadingSlots}
              />
            </div>
          )}
        </div>
      </div>

      {/* Botones */}
      <div className="flex justify-between pt-2">
        <Button type="button" variant="ghost" onClick={goBack}>
          <Icon name="arrow_back" size="sm" />
          Atrás
        </Button>
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
