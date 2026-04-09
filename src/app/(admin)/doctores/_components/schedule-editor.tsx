"use client";

import { useState, useEffect } from "react";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import {
  useDoctorSchedules,
  useUpsertSchedules,
} from "@/hooks/use-admin-doctors";
import type { ScheduleDay } from "@/lib/types/enums";

const DAYS: { key: ScheduleDay; label: string }[] = [
  { key: "lunes", label: "Lunes" },
  { key: "martes", label: "Martes" },
  { key: "miercoles", label: "Miércoles" },
  { key: "jueves", label: "Jueves" },
  { key: "viernes", label: "Viernes" },
  { key: "sabado", label: "Sábado" },
];

interface DaySchedule {
  day_of_week: ScheduleDay;
  start_time: string;
  end_time: string;
  is_active: boolean;
}

const DEFAULT_SCHEDULE: DaySchedule[] = DAYS.map((d) => ({
  day_of_week: d.key,
  start_time: "08:00",
  end_time: "20:00",
  is_active: false,
}));

interface ScheduleEditorProps {
  doctorId: string;
}

export function ScheduleEditor({ doctorId }: ScheduleEditorProps) {
  const { data: existingSchedules, isLoading } = useDoctorSchedules(doctorId);
  const upsertMutation = useUpsertSchedules();
  const [schedules, setSchedules] = useState<DaySchedule[]>(DEFAULT_SCHEDULE);

  useEffect(() => {
    if (existingSchedules && existingSchedules.length > 0) {
      const merged = DAYS.map((d) => {
        const existing = existingSchedules.find(
          (s) => s.day_of_week === d.key
        );
        return existing
          ? {
              day_of_week: d.key,
              start_time: existing.start_time.slice(0, 5),
              end_time: existing.end_time.slice(0, 5),
              is_active: existing.is_active,
            }
          : {
              day_of_week: d.key,
              start_time: "08:00",
              end_time: "20:00",
              is_active: false,
            };
      });
      setSchedules(merged);
    }
  }, [existingSchedules]);

  const handleToggle = (dayKey: ScheduleDay) => {
    setSchedules((prev) =>
      prev.map((s) =>
        s.day_of_week === dayKey ? { ...s, is_active: !s.is_active } : s
      )
    );
  };

  const handleTimeChange = (
    dayKey: ScheduleDay,
    field: "start_time" | "end_time",
    value: string
  ) => {
    setSchedules((prev) =>
      prev.map((s) =>
        s.day_of_week === dayKey ? { ...s, [field]: value } : s
      )
    );
  };

  const handleSave = () => {
    upsertMutation.mutate(
      schedules.map((s) => ({
        doctor_id: doctorId,
        day_of_week: s.day_of_week,
        start_time: s.start_time + ":00",
        end_time: s.end_time + ":00",
        is_active: s.is_active,
      }))
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Icon name="progress_activity" className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <h4 className="text-sm font-extrabold text-on-surface-variant uppercase tracking-widest mb-4">
        Horarios de Atención
      </h4>

      {upsertMutation.isSuccess && (
        <div className="mb-4 p-3 rounded-xl bg-primary/10 text-primary text-sm flex items-center gap-2 border border-primary/20">
          <Icon name="check_circle" size="sm" />
          Horarios guardados correctamente
        </div>
      )}

      <div className="space-y-2">
        {schedules.map((schedule) => {
          const dayLabel =
            DAYS.find((d) => d.key === schedule.day_of_week)?.label ??
            schedule.day_of_week;

          return (
            <div
              key={schedule.day_of_week}
              className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low"
            >
              {/* Toggle */}
              <button
                type="button"
                onClick={() => handleToggle(schedule.day_of_week)}
                className={`w-10 h-6 rounded-full flex items-center transition-colors cursor-pointer ${
                  schedule.is_active
                    ? "bg-primary justify-end"
                    : "bg-outline-variant/40 justify-start"
                }`}
              >
                <span className="w-5 h-5 rounded-full bg-white shadow-sm mx-0.5" />
              </button>

              {/* Day label */}
              <span
                className={`w-24 text-sm font-medium ${
                  schedule.is_active
                    ? "text-on-surface"
                    : "text-on-surface-variant/50"
                }`}
              >
                {dayLabel}
              </span>

              {/* Time inputs */}
              {schedule.is_active ? (
                <div className="flex items-center gap-2 flex-1">
                  <input
                    type="time"
                    value={schedule.start_time}
                    onChange={(e) =>
                      handleTimeChange(
                        schedule.day_of_week,
                        "start_time",
                        e.target.value
                      )
                    }
                    className="px-3 py-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-sm text-on-surface"
                  />
                  <span className="text-on-surface-variant text-xs">a</span>
                  <input
                    type="time"
                    value={schedule.end_time}
                    onChange={(e) =>
                      handleTimeChange(
                        schedule.day_of_week,
                        "end_time",
                        e.target.value
                      )
                    }
                    className="px-3 py-1.5 rounded-lg border border-outline-variant bg-surface-container-lowest text-sm text-on-surface"
                  />
                </div>
              ) : (
                <span className="flex-1 text-xs text-on-surface-variant/50 italic">
                  No atiende
                </span>
              )}
            </div>
          );
        })}
      </div>

      <Button
        variant="primary"
        size="md"
        className="mt-4 w-full"
        onClick={handleSave}
        disabled={upsertMutation.isPending}
      >
        {upsertMutation.isPending ? (
          <>
            <Icon name="progress_activity" size="sm" className="animate-spin" />
            Guardando...
          </>
        ) : (
          <>
            <Icon name="save" size="sm" />
            Guardar Horarios
          </>
        )}
      </Button>
    </div>
  );
}
