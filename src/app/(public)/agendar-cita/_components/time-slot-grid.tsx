"use client";

import { cn } from "@/lib/utils/cn";
import { Icon } from "@/components/ui/icon";
import type { TimeSlot } from "@/lib/types/scheduling";

interface TimeSlotGridProps {
  slots: TimeSlot[];
  selectedSlot: { start: string; end: string } | null;
  onSelectSlot: (slot: { start: string; end: string }) => void;
  isLoading?: boolean;
}

function formatTime(time: string): string {
  // 'HH:MM:SS' or 'HH:MM' → 'HH:MM'
  return time.slice(0, 5);
}

function getHour(time: string): number {
  return parseInt(time.slice(0, 2), 10);
}

export function TimeSlotGrid({
  slots,
  selectedSlot,
  onSelectSlot,
  isLoading,
}: TimeSlotGridProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-10">
        <div className="flex items-center gap-3 text-on-surface-variant">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-sm">Cargando horarios...</span>
        </div>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-center">
        <Icon
          name="event_busy"
          size="xl"
          className="text-on-surface-variant/30 mb-2"
        />
        <p className="text-sm text-on-surface-variant font-medium">
          No hay horarios disponibles
        </p>
        <p className="text-xs text-on-surface-variant/70 mt-1">
          Intenta seleccionar otra fecha
        </p>
      </div>
    );
  }

  // Separar en mañana (< 12) y tarde (>= 12)
  const morningSlots = slots.filter((s) => getHour(s.slot_start) < 12);
  const afternoonSlots = slots.filter((s) => getHour(s.slot_start) >= 12);

  const renderSlotGroup = (label: string, icon: string, groupSlots: TimeSlot[]) => {
    if (groupSlots.length === 0) return null;

    return (
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Icon name={icon} size="sm" className="text-on-surface-variant" />
          <span className="text-xs font-semibold text-on-surface-variant uppercase tracking-wider">
            {label}
          </span>
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {groupSlots.map((slot) => {
            const startFormatted = formatTime(slot.slot_start);
            const isSelected =
              selectedSlot?.start === slot.slot_start &&
              selectedSlot?.end === slot.slot_end;

            return (
              <button
                key={slot.slot_start}
                type="button"
                onClick={() =>
                  onSelectSlot({ start: slot.slot_start, end: slot.slot_end })
                }
                className={cn(
                  "py-2.5 px-3 rounded-xl text-sm font-medium transition-all duration-150 cursor-pointer",
                  isSelected
                    ? "bg-primary text-on-primary shadow-md font-bold"
                    : "bg-surface-container-low text-on-surface hover:bg-primary-fixed/50 hover:text-primary border border-outline-variant/20"
                )}
              >
                {startFormatted}
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {renderSlotGroup("Mañana", "wb_sunny", morningSlots)}
      {renderSlotGroup("Tarde", "wb_twilight", afternoonSlots)}
    </div>
  );
}
