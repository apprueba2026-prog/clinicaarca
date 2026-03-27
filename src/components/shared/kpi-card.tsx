import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils/cn";

interface KPICardProps {
  icon: string;
  iconColorClass: string;
  iconBgClass: string;
  label: string;
  value: string | number;
  badge?: {
    text: string;
    colorClass: string;
  };
  pulse?: boolean;
  warningBorder?: boolean;
  valueClassName?: string;
}

export function KPICard({
  icon,
  iconColorClass,
  iconBgClass,
  label,
  value,
  badge,
  pulse,
  warningBorder,
  valueClassName,
}: KPICardProps) {
  return (
    <div
      className={cn(
        "bg-surface-container-lowest dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-transparent hover:border-sky-200 dark:hover:border-sky-900 transition-all duration-300",
        warningBorder && "border-l-4 border-l-amber-500"
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <div className={cn("p-2 rounded-lg", iconBgClass)}>
          <Icon name={icon} className={iconColorClass} />
        </div>
        {badge && (
          <span
            className={cn(
              "text-xs font-bold px-2 py-0.5 rounded",
              badge.colorClass
            )}
          >
            {badge.text}
          </span>
        )}
        {pulse && (
          <span className="animate-pulse flex h-2 w-2 rounded-full bg-amber-400" />
        )}
      </div>
      <h3 className="text-slate-500 text-sm font-medium mb-1">{label}</h3>
      <p
        className={cn(
          "text-3xl font-extrabold text-slate-900 dark:text-white",
          valueClassName
        )}
      >
        {value}
      </p>
    </div>
  );
}
