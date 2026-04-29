"use client";

import { AppointmentCard } from "@/components/shared/appointment-card";
import { CalendarBlockBand } from "@/components/shared/calendar-block-overlay";
import { cn } from "@/lib/utils/cn";
import { CALENDAR_START_HOUR, CALENDAR_END_HOUR } from "@/lib/utils/constants";
import type { AppointmentWithDetails } from "@/lib/types/appointment";
import type { AppointmentBlock } from "@/lib/types/scheduling";
import { isToday, isSameDay } from "date-fns";

interface CalendarDayViewProps {
  date: Date;
  appointments: AppointmentWithDetails[];
  blocks?: AppointmentBlock[];
  onAppointmentClick?: (appointment: AppointmentWithDetails) => void;
}

const HOUR_HEIGHT = 96;
const TOTAL_HOURS = CALENDAR_END_HOUR - CALENDAR_START_HOUR;

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

function getPosition(startTime: string, endTime: string) {
  const startMin = timeToMinutes(startTime);
  const endMin = timeToMinutes(endTime);
  const baseMin = CALENDAR_START_HOUR * 60;
  const topPx = ((startMin - baseMin) / 60) * HOUR_HEIGHT;
  const heightPx = ((endMin - startMin) / 60) * HOUR_HEIGHT;
  return { topPx, heightPx: Math.max(heightPx, 32) };
}

export function CalendarDayView({
  date,
  appointments,
  blocks = [],
  onAppointmentClick,
}: CalendarDayViewProps) {
  const today = isToday(date);
  const hours = Array.from(
    { length: TOTAL_HOURS },
    (_, i) => CALENDAR_START_HOUR + i
  );

  const dayBlocks = blocks.filter((b) =>
    isSameDay(new Date(b.block_date + "T00:00:00"), date)
  );
  const baseMin = CALENDAR_START_HOUR * 60;
  const totalRangePx = TOTAL_HOURS * HOUR_HEIGHT;

  return (
    <div className="bg-surface-container-lowest rounded-2xl shadow-sm overflow-hidden border border-slate-200 dark:border-slate-800">
      <div className="relative flex">
        {/* Time Labels Column */}
        <div className="w-20 flex-shrink-0 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/20">
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

        {/* Day Column */}
        <div className={cn("flex-1 relative", today && "bg-primary/5")}>
          {/* Horizontal hour lines */}
          {hours.map((hour) => (
            <div
              key={hour}
              className="h-24 border-b border-slate-100 dark:border-slate-800/30"
            />
          ))}

          {/* Block overlays */}
          {dayBlocks.map((b) => {
            if (!b.start_time || !b.end_time) {
              return (
                <CalendarBlockBand
                  key={b.id}
                  block={b}
                  topPx={0}
                  heightPx={totalRangePx}
                />
              );
            }
            const startMin = timeToMinutes(b.start_time);
            const endMin = timeToMinutes(b.end_time);
            const topPx = ((startMin - baseMin) / 60) * HOUR_HEIGHT;
            const heightPx = ((endMin - startMin) / 60) * HOUR_HEIGHT;
            return (
              <CalendarBlockBand
                key={b.id}
                block={b}
                topPx={topPx}
                heightPx={Math.max(heightPx, 24)}
              />
            );
          })}

          {/* Appointment cards */}
          {appointments.map((appt) => {
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
                procedureName={appt.procedure?.name ?? "Consulta General"}
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
      </div>
    </div>
  );
}
