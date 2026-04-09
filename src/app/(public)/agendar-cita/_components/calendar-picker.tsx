"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils/cn";
import { Icon } from "@/components/ui/icon";
import { MAX_ADVANCE_DAYS } from "@/lib/utils/constants";

interface CalendarPickerProps {
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
}

const DAY_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getMonthName(month: number): string {
  const names = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ];
  return names[month];
}

export function CalendarPicker({
  selectedDate,
  onSelectDate,
}: CalendarPickerProps) {
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const maxDate = useMemo(() => {
    const d = new Date(today);
    d.setDate(d.getDate() + MAX_ADVANCE_DAYS);
    return d;
  }, [today]);

  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [viewYear, setViewYear] = useState(today.getFullYear());

  // Generar días del mes
  const calendarDays = useMemo(() => {
    const firstDay = new Date(viewYear, viewMonth, 1);
    // getDay() returns 0=Sun, we need 0=Mon
    let startDow = firstDay.getDay() - 1;
    if (startDow < 0) startDow = 6;

    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const days: (Date | null)[] = [];

    // Padding al inicio
    for (let i = 0; i < startDow; i++) {
      days.push(null);
    }

    // Días del mes
    for (let d = 1; d <= daysInMonth; d++) {
      days.push(new Date(viewYear, viewMonth, d));
    }

    return days;
  }, [viewMonth, viewYear]);

  const canGoPrev = viewYear > today.getFullYear() || viewMonth > today.getMonth();
  const canGoNext =
    viewYear < maxDate.getFullYear() ||
    (viewYear === maxDate.getFullYear() && viewMonth < maxDate.getMonth());

  const goToPrev = () => {
    if (!canGoPrev) return;
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const goToNext = () => {
    if (!canGoNext) return;
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const isDayDisabled = (date: Date): boolean => {
    // Domingo
    if (date.getDay() === 0) return true;
    // Pasado
    if (date < today) return true;
    // Más allá del máximo
    if (date > maxDate) return true;
    return false;
  };

  const isToday = (date: Date): boolean => formatDateKey(date) === formatDateKey(today);

  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-4">
      {/* Header con navegación */}
      <div className="flex items-center justify-between mb-4">
        <button
          type="button"
          onClick={goToPrev}
          disabled={!canGoPrev}
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
            canGoPrev
              ? "hover:bg-surface-container-high text-on-surface cursor-pointer"
              : "text-outline-variant/40 cursor-not-allowed"
          )}
        >
          <Icon name="chevron_left" size="sm" />
        </button>

        <h3 className="font-headline font-bold text-on-surface text-sm">
          {getMonthName(viewMonth)} {viewYear}
        </h3>

        <button
          type="button"
          onClick={goToNext}
          disabled={!canGoNext}
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
            canGoNext
              ? "hover:bg-surface-container-high text-on-surface cursor-pointer"
              : "text-outline-variant/40 cursor-not-allowed"
          )}
        >
          <Icon name="chevron_right" size="sm" />
        </button>
      </div>

      {/* Días de la semana */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {DAY_LABELS.map((day) => (
          <div
            key={day}
            className="text-center text-[10px] font-semibold text-on-surface-variant uppercase"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Días del mes */}
      <div className="grid grid-cols-7 gap-1">
        {calendarDays.map((date, index) => {
          if (!date) {
            return <div key={`empty-${index}`} className="h-9" />;
          }

          const dateKey = formatDateKey(date);
          const disabled = isDayDisabled(date);
          const selected = selectedDate === dateKey;
          const isSunday = date.getDay() === 0;

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => !disabled && onSelectDate(dateKey)}
              disabled={disabled}
              className={cn(
                "h-9 rounded-lg text-xs font-medium transition-all duration-150",
                disabled && "cursor-not-allowed",
                disabled && isSunday && "text-error/30",
                disabled && !isSunday && "text-on-surface-variant/30",
                !disabled &&
                  !selected &&
                  "text-on-surface hover:bg-primary-fixed/50 cursor-pointer",
                selected &&
                  "bg-primary text-on-primary font-bold shadow-md",
                isToday(date) && !selected && "ring-1 ring-primary/50 font-bold"
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
