"use client";

import { cn } from "@/lib/utils/cn";
import type { AppointmentWithDetails } from "@/lib/types/appointment";
import type { AppointmentStatus } from "@/lib/types/enums";
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  isToday,
  format,
} from "date-fns";
import { es } from "date-fns/locale";

interface CalendarMonthViewProps {
  currentDate: Date;
  appointments: AppointmentWithDetails[];
  onAppointmentClick?: (appointment: AppointmentWithDetails) => void;
  onDayClick?: (date: Date) => void;
}

const statusDot: Record<string, string> = {
  confirmed: "bg-sky-500",
  pending: "bg-amber-400",
  in_progress: "bg-emerald-500",
  completed: "bg-slate-400",
  cancelled: "bg-slate-300",
  no_show: "bg-slate-300",
};

const DAY_LABELS = ["Lun", "Mar", "Mie", "Jue", "Vie", "Sab"];

function formatTime12Short(time: string): string {
  const [h, m] = time.split(":");
  const hour = parseInt(h);
  const h12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  const ampm = hour >= 12 ? "p" : "a";
  return `${h12}:${m}${ampm}`;
}

export function CalendarMonthView({
  currentDate,
  appointments,
  onAppointmentClick,
  onDayClick,
}: CalendarMonthViewProps) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  // Build weeks (rows) excluding Sundays
  const weeks: Date[][] = [];
  let day = calStart;
  while (day <= calEnd) {
    const week: Date[] = [];
    for (let i = 0; i < 7; i++) {
      const current = addDays(day, i);
      if (current.getDay() !== 0) {
        week.push(current);
      }
    }
    weeks.push(week);
    day = addDays(day, 7);
  }

  function getAppointmentsForDay(d: Date) {
    return appointments.filter((appt) =>
      isSameDay(new Date(appt.scheduled_date + "T00:00:00"), d)
    );
  }

  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden border border-slate-200 dark:border-slate-800">
      {/* Day Headers */}
      <div className="grid grid-cols-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
        {DAY_LABELS.map((label) => (
          <div
            key={label}
            className="p-3 text-center border-r border-slate-200 dark:border-slate-800 last:border-r-0"
          >
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Weeks */}
      {weeks.map((week, wi) => (
        <div
          key={wi}
          className="grid grid-cols-6 border-b border-slate-200 dark:border-slate-800 last:border-b-0"
        >
          {week.map((d) => {
            const dayAppts = getAppointmentsForDay(d);
            const inMonth = isSameMonth(d, currentDate);
            const today = isToday(d);
            return (
              <div
                key={d.toISOString()}
                className={cn(
                  "min-h-28 p-2 border-r border-slate-200 dark:border-slate-800 last:border-r-0 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors",
                  !inMonth && "bg-slate-50/50 dark:bg-slate-900/30",
                  today && "bg-primary/5"
                )}
                onClick={() => onDayClick?.(d)}
              >
                {/* Day Number */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={cn(
                      "text-xs font-bold",
                      today
                        ? "text-white bg-primary rounded-full w-6 h-6 flex items-center justify-center"
                        : inMonth
                          ? "text-slate-900 dark:text-white"
                          : "text-slate-400"
                    )}
                  >
                    {format(d, "d")}
                  </span>
                  {dayAppts.length > 0 && (
                    <span className="text-[9px] font-semibold text-slate-400">
                      {dayAppts.length}
                    </span>
                  )}
                </div>

                {/* Appointments (max 3 visible) */}
                <div className="space-y-0.5">
                  {dayAppts.slice(0, 3).map((appt) => (
                    <button
                      key={appt.id}
                      className={cn(
                        "w-full text-left px-1.5 py-0.5 rounded text-[10px] font-medium truncate flex items-center gap-1 hover:opacity-80 transition-opacity",
                        appt.priority === "emergency"
                          ? "bg-red-50 dark:bg-red-900/40 text-red-700 dark:text-red-300"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                      )}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAppointmentClick?.(appt);
                      }}
                    >
                      <span
                        className={cn(
                          "w-1.5 h-1.5 rounded-full flex-shrink-0",
                          appt.priority === "emergency"
                            ? "bg-red-500"
                            : statusDot[appt.status as AppointmentStatus] ?? "bg-slate-400"
                        )}
                      />
                      <span className="truncate">
                        {formatTime12Short(appt.start_time)}{" "}
                        {appt.patient.first_name} {appt.patient.last_name.charAt(0)}.
                      </span>
                    </button>
                  ))}
                  {dayAppts.length > 3 && (
                    <p className="text-[9px] font-semibold text-primary pl-1">
                      +{dayAppts.length - 3} mas
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}
