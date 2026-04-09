import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils/cn";
import type { AppointmentStatus, AppointmentPriority } from "@/lib/types/enums";

interface AppointmentCardProps {
  status: AppointmentStatus;
  priority: AppointmentPriority;
  patientName: string;
  doctorName: string;
  procedureName: string;
  startTime: string;
  endTime: string;
  room?: string | null;
  topPx: number;
  heightPx: number;
  onClick?: () => void;
}

const statusStyles: Record<
  string,
  { bg: string; border: string; statusText: string; statusColor: string }
> = {
  confirmed: {
    bg: "bg-sky-50 dark:bg-sky-900/40",
    border: "border-sky-600",
    statusText: "Confirmado",
    statusColor: "text-sky-700 dark:text-sky-300",
  },
  pending: {
    bg: "bg-amber-50 dark:bg-amber-900/40",
    border: "border-amber-400",
    statusText: "Pendiente",
    statusColor: "text-amber-700 dark:text-amber-300",
  },
  in_progress: {
    bg: "bg-emerald-50 dark:bg-emerald-900/40",
    border: "border-emerald-500",
    statusText: "En curso",
    statusColor: "text-emerald-700 dark:text-emerald-300",
  },
  completed: {
    bg: "bg-slate-50 dark:bg-slate-800/40",
    border: "border-slate-400",
    statusText: "Completado",
    statusColor: "text-slate-500",
  },
  cancelled: {
    bg: "bg-slate-50 dark:bg-slate-800/40",
    border: "border-slate-300",
    statusText: "Cancelado",
    statusColor: "text-slate-400 line-through",
  },
  no_show: {
    bg: "bg-slate-50 dark:bg-slate-800/40",
    border: "border-slate-300",
    statusText: "No asistió",
    statusColor: "text-slate-400",
  },
};

export function AppointmentCard({
  status,
  priority,
  patientName,
  doctorName,
  procedureName,
  startTime,
  endTime,
  room,
  topPx,
  heightPx,
  onClick,
}: AppointmentCardProps) {
  const isEmergency = priority === "emergency";
  const s = isEmergency
    ? {
        bg: "bg-red-50 dark:bg-red-900/40",
        border: "border-red-500",
        statusText: "Emergencia",
        statusColor: "text-red-600 dark:text-red-400",
      }
    : statusStyles[status] ?? statusStyles.pending;

  const isCompact = heightPx < 72;

  return (
    <div
      className={cn(
        "absolute left-1 right-1 border-l-4 rounded shadow-sm z-10 cursor-pointer hover:shadow-md transition-shadow group",
        s.bg,
        s.border,
        isCompact ? "p-2" : "p-3"
      )}
      style={{ top: `${topPx}px`, height: `${heightPx}px` }}
      onClick={onClick}
    >
      {!isCompact && (
        <div className="flex justify-between items-start">
          {isEmergency ? (
            <div className="flex items-center gap-1.5">
              <Icon
                name="error"
                filled
                size="sm"
                className={s.statusColor}
              />
              <span
                className={cn(
                  "text-[10px] font-bold uppercase tracking-wider",
                  s.statusColor
                )}
              >
                {s.statusText}
              </span>
            </div>
          ) : (
            <span
              className={cn(
                "text-[9px] font-bold uppercase",
                s.statusColor
              )}
            >
              {s.statusText}
            </span>
          )}
          <Icon name="open_in_new" size="xs" className="text-sky-400 opacity-0 group-hover:opacity-100" />
        </div>
      )}
      <h4
        className={cn(
          "font-bold text-slate-900 dark:text-white leading-tight",
          isCompact ? "text-[10px]" : "text-xs mt-1"
        )}
      >
        {patientName} | {doctorName}
      </h4>
      {!isCompact && (
        <>
          <p className="text-[10px] text-slate-500 font-medium">
            {procedureName}
            {room ? ` • ${room}` : ""}
          </p>
          <div className="mt-2 flex items-center gap-1.5 text-[9px]">
            <Icon name="schedule" size="xs" className={s.statusColor} />
            <span className={s.statusColor}>
              {startTime} - {endTime}
            </span>
          </div>
        </>
      )}
      {isCompact && (
        <p className="text-[9px] text-slate-500 font-medium truncate mt-0.5">
          {procedureName} ({s.statusText})
        </p>
      )}
    </div>
  );
}
