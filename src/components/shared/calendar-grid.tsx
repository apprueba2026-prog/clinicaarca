"use client";

import { AppointmentCard } from "@/components/shared/appointment-card";
import { cn } from "@/lib/utils/cn";
import { CALENDAR_START_HOUR, CALENDAR_END_HOUR } from "@/lib/utils/constants";
import type { AppointmentWithDetails } from "@/lib/types/appointment";
import { format, addDays, startOfWeek, isToday, isSameDay } from "date-fns";
import { es } from "date-fns/locale";

interface CalendarGridProps {
  weekStart: Date;
  appointments: AppointmentWithDetails[];
  onAppointmentClick?: (appointment: AppointmentWithDetails) => void;
}

const HOUR_HEIGHT = 96; // h-24 = 6rem = 96px
const TOTAL_HOURS = CALENDAR_END_HOUR - CALENDAR_START_HOUR; // 11 hours (08-19)

function timeToMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function formatHour(hour: number): string {
  const ampm = hour >= 12 ? "PM" : "AM";
  const h12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${String(h12).padStart(2, "0")}:00 ${ampm}`;
}

function formatTime12(time: string): string {
  const [h, m] = time.split(":");
  const hour = parseInt(h);
  const h12 = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
  return `${String(h12).padStart(2, "0")}:${m}`;
}

export function CalendarGrid({
  weekStart,
  appointments,
  onAppointmentClick,
}: CalendarGridProps) {
  const weekMonday = startOfWeek(weekStart, { weekStartsOn: 1 });
  const days = Array.from({ length: 6 }, (_, i) => addDays(weekMonday, i));
  const hours = Array.from(
    { length: TOTAL_HOURS },
    (_, i) => CALENDAR_START_HOUR + i
  );

  function getAppointmentsForDay(day: Date) {
    return appointments.filter((appt) =>
      isSameDay(new Date(appt.scheduled_date + "T00:00:00"), day)
    );
  }

  function getPosition(startTime: string, endTime: string) {
    const startMin = timeToMinutes(startTime);
    const endMin = timeToMinutes(endTime);
    const baseMin = CALENDAR_START_HOUR * 60;
    const topPx = ((startMin - baseMin) / 60) * HOUR_HEIGHT;
    const heightPx = ((endMin - startMin) / 60) * HOUR_HEIGHT;
    return { topPx, heightPx: Math.max(heightPx, 32) };
  }

  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden border border-slate-200 dark:border-slate-800">
      {/* Day Headers */}
      <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
        <div className="p-4 border-r border-slate-200 dark:border-slate-800 flex items-center justify-center">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Hora
          </span>
        </div>
        {days.map((day) => {
          const today = isToday(day);
          return (
            <div
              key={day.toISOString()}
              className={cn(
                "p-4 border-r border-slate-200 dark:border-slate-800 text-center last:border-r-0",
                today && "bg-primary/5"
              )}
            >
              <p
                className={cn(
                  "text-xs font-bold",
                  today
                    ? "text-primary"
                    : "text-slate-900 dark:text-white"
                )}
              >
                {format(day, "EEE dd", { locale: es })
                  .replace(/^\w/, (c) => c.toUpperCase())}
              </p>
              {today && (
                <div className="w-1.5 h-1.5 bg-primary rounded-full mx-auto mt-1" />
              )}
            </div>
          );
        })}
      </div>

      {/* Grid Body */}
      <div className="relative flex">
        {/* Time Labels Column */}
        <div className="w-[calc(100%/7)] flex flex-col border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
          {hours.map((hour) => (
            <div
              key={hour}
              className="h-24 p-2 text-right border-b border-slate-100 dark:border-slate-800/50"
            >
              <span className="text-[10px] font-medium text-slate-400">
                {formatHour(hour)}
              </span>
            </div>
          ))}
        </div>

        {/* Day Columns */}
        <div className="flex-1 grid grid-cols-6 relative">
          {/* Vertical Grid Lines */}
          <div className="absolute inset-0 grid grid-cols-6 pointer-events-none">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className="border-r border-slate-200 dark:border-slate-800/40"
              />
            ))}
            <div />
          </div>

          {/* Day Columns with appointments */}
          {days.map((day) => {
            const dayAppts = getAppointmentsForDay(day);
            const today = isToday(day);
            return (
              <div
                key={day.toISOString()}
                className={cn("relative", today && "bg-primary/5")}
              >
                {/* Horizontal hour lines */}
                {hours.map((hour) => (
                  <div
                    key={hour}
                    className="h-24 border-b border-slate-100 dark:border-slate-800/30"
                  />
                ))}

                {/* Appointment cards */}
                {dayAppts.map((appt) => {
                  const { topPx, heightPx } = getPosition(
                    appt.start_time,
                    appt.end_time
                  );
                  return (
                    <AppointmentCard
                      key={appt.id}
                      status={appt.status}
                      priority={appt.priority}
                      patientName={`${appt.patient.first_name} ${appt.patient.last_name.charAt(0)}.`}
                      doctorName={`${appt.doctor.profile.first_name.charAt(0)}. ${appt.doctor.profile.last_name}`}
                      procedureName={
                        appt.procedure?.name ?? "Consulta General"
                      }
                      startTime={formatTime12(appt.start_time)}
                      endTime={formatTime12(appt.end_time)}
                      room={null}
                      topPx={topPx}
                      heightPx={heightPx}
                      onClick={() => onAppointmentClick?.(appt)}
                    />
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
