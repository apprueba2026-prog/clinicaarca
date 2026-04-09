"use client";

import { cn } from "@/lib/utils/cn";
import { Icon } from "@/components/ui/icon";

interface ServiceCardProps {
  icon: string;
  label: string;
  description: string;
  isSelected?: boolean;
  onClick: () => void;
}

export function ServiceCard({
  icon,
  label,
  description,
  isSelected,
  onClick,
}: ServiceCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all duration-200 cursor-pointer text-center",
        "hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]",
        isSelected
          ? "border-primary bg-primary-fixed/30 shadow-md"
          : "border-outline-variant/40 bg-surface-container-lowest hover:border-primary/50"
      )}
    >
      <div
        className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center transition-colors",
          isSelected
            ? "bg-primary text-on-primary"
            : "bg-primary-fixed text-on-primary-fixed-variant"
        )}
      >
        <Icon name={icon} size="lg" />
      </div>
      <div>
        <h3 className="font-headline font-bold text-on-surface text-sm">
          {label}
        </h3>
        <p className="text-xs text-on-surface-variant mt-1 leading-relaxed">
          {description}
        </p>
      </div>
    </button>
  );
}
