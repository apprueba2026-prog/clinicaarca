import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils/cn";

interface AppointmentRowProps {
  time: string;
  patientName: string;
  patientInitials: string;
  initialsColorClass: string;
  doctorName: string;
  specialty: string;
  status: "confirmed" | "pending" | "in_progress" | "cancelled" | "completed" | "no_show";
}

const statusConfig = {
  confirmed: {
    label: "Confirmado",
    dotClass: "bg-green-500",
    bgClass: "bg-green-50 dark:bg-green-900/20",
    textClass: "text-green-700 dark:text-green-400",
  },
  pending: {
    label: "Pendiente",
    dotClass: "bg-amber-500",
    bgClass: "bg-amber-50 dark:bg-amber-900/20",
    textClass: "text-amber-700 dark:text-amber-400",
  },
  in_progress: {
    label: "En curso",
    dotClass: "bg-sky-500",
    bgClass: "bg-sky-50 dark:bg-sky-900/20",
    textClass: "text-sky-700 dark:text-sky-400",
  },
  completed: {
    label: "Completado",
    dotClass: "bg-slate-400",
    bgClass: "bg-slate-50 dark:bg-slate-900/20",
    textClass: "text-slate-600 dark:text-slate-400",
  },
  cancelled: {
    label: "Cancelado",
    dotClass: "bg-red-500",
    bgClass: "bg-red-50 dark:bg-red-900/20",
    textClass: "text-red-700 dark:text-red-400",
  },
  no_show: {
    label: "No asistió",
    dotClass: "bg-slate-400",
    bgClass: "bg-slate-50 dark:bg-slate-900/20",
    textClass: "text-slate-600 dark:text-slate-400",
  },
};

export function AppointmentRow({
  time,
  patientName,
  patientInitials,
  initialsColorClass,
  doctorName,
  specialty,
  status,
}: AppointmentRowProps) {
  const s = statusConfig[status];

  return (
    <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-900/20 transition-colors">
      <td className="px-8 py-5 text-sm font-bold text-slate-900 dark:text-white">
        {time}
      </td>
      <td className="px-8 py-5">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
              initialsColorClass
            )}
          >
            {patientInitials}
          </div>
          <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {patientName}
          </span>
        </div>
      </td>
      <td className="px-8 py-5 text-sm text-slate-600 dark:text-slate-400">
        {doctorName}
      </td>
      <td className="px-8 py-5">
        <span className="px-3 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-full text-[10px] font-bold uppercase tracking-tight">
          {specialty}
        </span>
      </td>
      <td className="px-8 py-5">
        <span
          className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase",
            s.bgClass,
            s.textClass
          )}
        >
          <span className={cn("w-1.5 h-1.5 rounded-full", s.dotClass)} />
          {s.label}
        </span>
      </td>
      <td className="px-8 py-5 text-right">
        <button className="p-2 text-slate-400 hover:text-sky-600 transition-colors cursor-pointer">
          <Icon name="more_vert" />
        </button>
      </td>
    </tr>
  );
}
