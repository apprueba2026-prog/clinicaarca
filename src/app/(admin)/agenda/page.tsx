"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { addDays, subDays, startOfWeek, format } from "date-fns";
import { es } from "date-fns/locale";
import { Icon } from "@/components/ui/icon";
import { CalendarGrid } from "@/components/shared/calendar-grid";
import { NewAppointmentModal } from "@/components/shared/new-appointment-modal";
import { useFiltersStore } from "@/stores/filters.store";
import { useModalStore } from "@/stores/modal.store";
import { useRealtime } from "@/hooks/use-realtime";
import { doctorsService } from "@/lib/services/doctors.service";
import { cn } from "@/lib/utils/cn";
import type { AppointmentWithDetails } from "@/lib/types/appointment";
import { createClient } from "@/lib/supabase/client";

type CalendarView = "day" | "week" | "month";

const VIEW_LABELS: Record<CalendarView, string> = {
  day: "Día",
  week: "Semana",
  month: "Mes",
};

async function getWeekAppointments(
  weekStart: Date,
  doctorId: string | null
): Promise<AppointmentWithDetails[]> {
  const supabase = createClient();
  const monday = startOfWeek(weekStart, { weekStartsOn: 1 });
  const saturday = addDays(monday, 5);
  const start = format(monday, "yyyy-MM-dd");
  const end = format(saturday, "yyyy-MM-dd");

  let query = supabase
    .from("appointments")
    .select(
      `id, scheduled_date, start_time, end_time, status, priority, notes, room,
       patient:patients(first_name, last_name, dni, phone),
       doctor:doctors(specialty, profile:profiles(first_name, last_name)),
       procedure:procedures(name, category)`
    )
    .gte("scheduled_date", start)
    .lte("scheduled_date", end)
    .order("start_time", { ascending: true });

  if (doctorId) {
    query = query.eq("doctor_id", doctorId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as unknown as AppointmentWithDetails[]) ?? [];
}

export default function AgendaPage() {
  const {
    calendarView,
    setCalendarView,
    selectedDate,
    setSelectedDate,
    selectedDoctorId,
    setSelectedDoctorId,
  } = useFiltersStore();
  const openModal = useModalStore((s) => s.openModal);

  const currentDate = useMemo(() => new Date(selectedDate + "T00:00:00"), [selectedDate]);
  const weekStart = useMemo(
    () => startOfWeek(currentDate, { weekStartsOn: 1 }),
    [currentDate]
  );

  const weekLabel = useMemo(() => {
    const monday = weekStart;
    const saturday = addDays(monday, 5);
    const monthStart = format(monday, "MMMM", { locale: es });
    return `${monthStart.charAt(0).toUpperCase() + monthStart.slice(1)} ${format(monday, "dd")} - ${format(saturday, "dd")}, ${format(saturday, "yyyy")}`;
  }, [weekStart]);

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: [
      "appointments",
      "week",
      weekStart.toISOString(),
      selectedDoctorId,
    ],
    queryFn: () => getWeekAppointments(weekStart, selectedDoctorId),
  });

  const { data: doctors } = useQuery({
    queryKey: ["doctors"],
    queryFn: () => doctorsService.getAll(),
  });

  // Realtime subscription
  useRealtime("appointments", ["appointments"]);

  function goToToday() {
    setSelectedDate(new Date().toISOString().split("T")[0]);
  }

  function navigateWeek(direction: number) {
    const newDate =
      direction > 0
        ? addDays(currentDate, 7)
        : subDays(currentDate, 7);
    setSelectedDate(newDate.toISOString().split("T")[0]);
  }

  return (
    <>
      {/* Content Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
        <div className="space-y-4">
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Agenda General
          </h2>
          <div className="flex items-center gap-4">
            {/* Today + Navigation */}
            <div className="flex items-center bg-surface-container-low p-1 rounded-lg">
              <button
                onClick={goToToday}
                className="px-4 py-1.5 text-xs font-bold bg-white dark:bg-slate-800 rounded shadow-sm text-primary cursor-pointer"
              >
                Hoy
              </button>
              <div className="flex items-center gap-1 px-2 border-l border-slate-300 ml-2">
                <button
                  onClick={() => navigateWeek(-1)}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded cursor-pointer"
                >
                  <Icon name="chevron_left" size="sm" />
                </button>
                <span className="text-xs font-semibold px-2">{weekLabel}</span>
                <button
                  onClick={() => navigateWeek(1)}
                  className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded cursor-pointer"
                >
                  <Icon name="chevron_right" size="sm" />
                </button>
              </div>
            </div>

            {/* View Toggle */}
            <div className="flex items-center bg-surface-container-low p-1 rounded-lg">
              {(["day", "week", "month"] as CalendarView[]).map((view) => (
                <button
                  key={view}
                  onClick={() => setCalendarView(view)}
                  className={cn(
                    "px-4 py-1.5 text-xs font-medium cursor-pointer transition-all",
                    calendarView === view
                      ? "font-bold bg-white dark:bg-slate-800 rounded shadow-sm text-primary"
                      : "text-slate-500"
                  )}
                >
                  {VIEW_LABELS[view]}
                </button>
              ))}
            </div>

            {/* Doctor Filter */}
            <div className="relative">
              <select
                value={selectedDoctorId ?? ""}
                onChange={(e) =>
                  setSelectedDoctorId(e.target.value || null)
                }
                className="pl-3 pr-8 py-2 text-xs font-semibold bg-surface-container-low border-none rounded-lg focus:ring-primary appearance-none cursor-pointer"
              >
                <option value="">Todos los Doctores</option>
                {doctors?.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.profile.first_name} {d.profile.last_name}
                  </option>
                ))}
              </select>
              <Icon
                name="expand_more"
                size="sm"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-5 py-2.5 bg-error/10 text-error hover:bg-error/20 transition-colors rounded-xl text-xs font-bold border border-error/20 cursor-pointer">
            <Icon name="bolt" size="sm" />
            IA: Reprogramar Día
          </button>
          <button
            onClick={() => openModal("new-appointment")}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary hover:bg-primary-container transition-colors rounded-xl text-xs font-bold shadow-lg shadow-primary/20 cursor-pointer"
          >
            <Icon name="add" size="sm" />
            + Nueva Cita
          </button>
        </div>
      </div>

      {/* Calendar */}
      {isLoading ? (
        <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-20 flex items-center justify-center">
          <div className="flex items-center gap-3 text-slate-400">
            <Icon name="progress_activity" className="animate-spin" />
            <span className="text-sm font-medium">Cargando agenda...</span>
          </div>
        </div>
      ) : (
        <CalendarGrid
          weekStart={weekStart}
          appointments={appointments}
        />
      )}

      {/* New Appointment Modal */}
      <NewAppointmentModal />
    </>
  );
}
