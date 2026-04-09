"use client";

import { useMemo, useCallback, useTransition } from "react";
import {
  useQuery,
  useQueryClient,
  keepPreviousData,
} from "@tanstack/react-query";
import {
  addDays,
  subDays,
  addMonths,
  subMonths,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  endOfWeek,
  format,
} from "date-fns";
import { es } from "date-fns/locale";
import { Icon } from "@/components/ui/icon";
import { CalendarGrid } from "@/components/shared/calendar-grid";
import { CalendarDayView } from "@/components/shared/calendar-day-view";
import { CalendarMonthView } from "@/components/shared/calendar-month-view";
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

async function getAppointments(
  startDate: string,
  endDate: string,
  doctorId: string | null
): Promise<AppointmentWithDetails[]> {
  const supabase = createClient();

  let query = supabase
    .from("appointments")
    .select(
      `id, scheduled_date, start_time, end_time, status, priority, notes, room,
       patient:patients(first_name, last_name, dni, phone),
       doctor:doctors(specialties, profile:profiles(first_name, last_name)),
       procedure:procedures(name, category)`
    )
    .gte("scheduled_date", startDate)
    .lte("scheduled_date", endDate)
    .order("start_time", { ascending: true });

  if (doctorId) {
    query = query.eq("doctor_id", doctorId);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data as unknown as AppointmentWithDetails[]) ?? [];
}

/** Skip Sundays: returns the next/prev valid date */
function skipSunday(date: Date, direction: number): Date {
  if (date.getDay() === 0) {
    return direction > 0 ? addDays(date, 1) : subDays(date, 1);
  }
  return date;
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
  const queryClient = useQueryClient();
  const [isPending, startTransition] = useTransition();

  const currentDate = useMemo(
    () => new Date(selectedDate + "T00:00:00"),
    [selectedDate]
  );

  // Calculate date range based on current view
  const dateRange = useMemo(() => {
    if (calendarView === "day") {
      const dateStr = format(currentDate, "yyyy-MM-dd");
      return { start: dateStr, end: dateStr };
    }
    if (calendarView === "week") {
      const monday = startOfWeek(currentDate, { weekStartsOn: 1 });
      const saturday = addDays(monday, 5);
      return {
        start: format(monday, "yyyy-MM-dd"),
        end: format(saturday, "yyyy-MM-dd"),
      };
    }
    // month
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return {
      start: format(calStart, "yyyy-MM-dd"),
      end: format(calEnd, "yyyy-MM-dd"),
    };
  }, [calendarView, currentDate]);

  const weekStart = useMemo(
    () => startOfWeek(currentDate, { weekStartsOn: 1 }),
    [currentDate]
  );

  // Dynamic label based on view
  const dateLabel = useMemo(() => {
    if (calendarView === "day") {
      const label = format(currentDate, "EEEE d 'de' MMMM, yyyy", {
        locale: es,
      });
      return label.charAt(0).toUpperCase() + label.slice(1);
    }
    if (calendarView === "week") {
      const monday = weekStart;
      const saturday = addDays(monday, 5);
      const monthName = format(monday, "MMMM", { locale: es });
      return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} ${format(monday, "dd")} - ${format(saturday, "dd")}, ${format(saturday, "yyyy")}`;
    }
    // month
    const label = format(currentDate, "MMMM yyyy", { locale: es });
    return label.charAt(0).toUpperCase() + label.slice(1);
  }, [calendarView, currentDate, weekStart]);

  const { data: appointments = [], isLoading, isFetching } = useQuery({
    queryKey: [
      "appointments",
      calendarView,
      dateRange.start,
      dateRange.end,
      selectedDoctorId,
    ],
    queryFn: () =>
      getAppointments(dateRange.start, dateRange.end, selectedDoctorId),
    placeholderData: keepPreviousData,
  });

  const { data: doctors } = useQuery({
    queryKey: ["doctors"],
    queryFn: () => doctorsService.getAll(),
  });

  // Realtime subscription
  useRealtime("appointments", ["appointments"]);

  // Prefetch adjacent dates for instant day navigation
  const prefetchAdjacent = useCallback(
    (date: Date, view: CalendarView, doctorId: string | null) => {
      if (view === "day") {
        const prev = skipSunday(subDays(date, 1), -1);
        const next = skipSunday(addDays(date, 1), 1);
        const prevStr = format(prev, "yyyy-MM-dd");
        const nextStr = format(next, "yyyy-MM-dd");
        queryClient.prefetchQuery({
          queryKey: ["appointments", "day", prevStr, prevStr, doctorId],
          queryFn: () => getAppointments(prevStr, prevStr, doctorId),
          staleTime: 60_000,
        });
        queryClient.prefetchQuery({
          queryKey: ["appointments", "day", nextStr, nextStr, doctorId],
          queryFn: () => getAppointments(nextStr, nextStr, doctorId),
          staleTime: 60_000,
        });
      }
    },
    [queryClient]
  );

  // Prefetch neighbors when current data loads
  useMemo(() => {
    if (!isLoading && calendarView === "day") {
      prefetchAdjacent(currentDate, calendarView, selectedDoctorId);
    }
  }, [isLoading, currentDate, calendarView, selectedDoctorId, prefetchAdjacent]);

  function goToToday() {
    setSelectedDate(new Date().toISOString().split("T")[0]);
  }

  function navigate(direction: number) {
    startTransition(() => {
      let newDate: Date;
      if (calendarView === "day") {
        newDate = direction > 0 ? addDays(currentDate, 1) : subDays(currentDate, 1);
        newDate = skipSunday(newDate, direction);
      } else if (calendarView === "week") {
        newDate = direction > 0 ? addDays(currentDate, 7) : subDays(currentDate, 7);
      } else {
        newDate =
          direction > 0
            ? addMonths(currentDate, 1)
            : subMonths(currentDate, 1);
      }
      setSelectedDate(newDate.toISOString().split("T")[0]);
    });
  }

  function handleDayClickFromMonth(date: Date) {
    setSelectedDate(date.toISOString().split("T")[0]);
    setCalendarView("day");
  }

  // Only show full loading spinner on the very first load (no data at all)
  const showSkeleton = isLoading && appointments.length === 0;

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
                  onClick={() => navigate(-1)}
                  className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded cursor-pointer active:scale-95 transition-transform"
                >
                  <Icon name="chevron_left" size="sm" />
                </button>
                <span className="text-xs font-semibold px-2 min-w-[180px] text-center">
                  {dateLabel}
                </span>
                <button
                  onClick={() => navigate(1)}
                  className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded cursor-pointer active:scale-95 transition-transform"
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
      <div className="relative">
        {/* Subtle fetch indicator - thin bar at top */}
        {(isFetching || isPending) && !showSkeleton && (
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary/30 rounded-full overflow-hidden z-20">
            <div className="h-full w-1/3 bg-primary rounded-full animate-[shimmer_1s_ease-in-out_infinite]" />
          </div>
        )}

        {showSkeleton ? (
          <div className="bg-surface-container-lowest rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-20 flex items-center justify-center">
            <div className="flex items-center gap-3 text-slate-400">
              <Icon name="progress_activity" className="animate-spin" />
              <span className="text-sm font-medium">Cargando agenda...</span>
            </div>
          </div>
        ) : (
          <>
            {calendarView === "day" && (
              <CalendarDayView
                date={currentDate}
                appointments={appointments}
              />
            )}
            {calendarView === "week" && (
              <CalendarGrid
                weekStart={weekStart}
                appointments={appointments}
              />
            )}
            {calendarView === "month" && (
              <CalendarMonthView
                currentDate={currentDate}
                appointments={appointments}
                onDayClick={handleDayClickFromMonth}
              />
            )}
          </>
        )}
      </div>

      {/* New Appointment Modal */}
      <NewAppointmentModal />
    </>
  );
}
