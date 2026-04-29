import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils/cn";

interface ComingSoonCardProps {
  title?: string;
  description?: string;
  icon?: string;
  variant?: "compact" | "wide";
  className?: string;
}

export function ComingSoonCard({
  title = "Próximamente",
  description,
  icon = "update",
  variant = "compact",
  className,
}: ComingSoonCardProps) {
  return (
    <div
      role="status"
      aria-label={title}
      className={cn(
        "rounded-3xl border-2 border-dashed border-outline-variant bg-surface-container-lowest/60",
        "flex flex-col items-center justify-center text-center gap-4 px-8",
        variant === "wide" ? "py-20 min-h-[280px]" : "py-12 min-h-[180px]",
        className
      )}
    >
      <span className="w-14 h-14 rounded-2xl bg-secondary-container/40 text-secondary flex items-center justify-center">
        <Icon name={icon} size="lg" />
      </span>
      <div className="max-w-md flex flex-col gap-2">
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">
          {title}
        </p>
        {description ? (
          <p className="text-on-surface-variant leading-relaxed">{description}</p>
        ) : null}
      </div>
    </div>
  );
}
