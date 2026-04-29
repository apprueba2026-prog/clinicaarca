"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Icon } from "@/components/ui/icon";
import type { AppointmentBlock } from "@/lib/types/scheduling";
import { cn } from "@/lib/utils/cn";

interface BlockBandProps {
  block: AppointmentBlock;
  topPx: number;
  heightPx: number;
}

const BLOCK_THEME: Record<
  AppointmentBlock["block_type"],
  { bg: string; border: string; text: string; icon: string; label: string }
> = {
  fixed_patients: {
    bg: "bg-amber-100/60 dark:bg-amber-900/25",
    border: "border-l-2 border-amber-400 dark:border-amber-500",
    text: "text-amber-900 dark:text-amber-200",
    icon: "people",
    label: "Pacientes fijos",
  },
  unavailable: {
    bg: "bg-rose-100/60 dark:bg-rose-900/25",
    border: "border-l-2 border-rose-400 dark:border-rose-500",
    text: "text-rose-900 dark:text-rose-200",
    icon: "block",
    label: "No disponible",
  },
};

export function CalendarBlockBand({ block, topPx, heightPx }: BlockBandProps) {
  const queryClient = useQueryClient();
  const theme = BLOCK_THEME[block.block_type];

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/appointment-blocks/${block.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Error al eliminar bloque");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointment-blocks"] });
    },
  });

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (
      window.confirm(
        `¿Eliminar pre-reserva "${block.title ?? theme.label}"? El horario quedará disponible.`
      )
    ) {
      deleteMutation.mutate();
    }
  }

  return (
    <div
      className={cn(
        "absolute inset-x-0.5 rounded-r-md px-1.5 py-1 z-0 group",
        theme.bg,
        theme.border
      )}
      style={{ top: `${topPx}px`, height: `${heightPx}px` }}
      title={
        block.title ??
        `${theme.label}${block.notes ? ` — ${block.notes}` : ""}`
      }
    >
      <div className={cn("flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider", theme.text)}>
        <Icon name={theme.icon} size="sm" />
        <span className="truncate">{block.title ?? theme.label}</span>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleteMutation.isPending}
          className="ml-auto opacity-0 group-hover:opacity-100 hover:bg-white/40 dark:hover:bg-black/20 rounded p-0.5 cursor-pointer transition-opacity"
          aria-label="Eliminar pre-reserva"
        >
          <Icon name="close" size="sm" />
        </button>
      </div>
    </div>
  );
}

interface AllDayChipProps {
  block: AppointmentBlock;
}

export function CalendarBlockAllDayChip({ block }: AllDayChipProps) {
  const queryClient = useQueryClient();
  const theme = BLOCK_THEME[block.block_type];

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/appointment-blocks/${block.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json.error ?? "Error al eliminar bloque");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["appointment-blocks"] });
    },
  });

  return (
    <div
      className={cn(
        "flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider group",
        theme.bg,
        theme.text
      )}
      title={block.title ?? theme.label}
    >
      <Icon name={theme.icon} size="sm" />
      <span className="truncate">{block.title ?? theme.label}</span>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          if (window.confirm(`¿Eliminar pre-reserva?`)) deleteMutation.mutate();
        }}
        disabled={deleteMutation.isPending}
        className="opacity-0 group-hover:opacity-100 hover:bg-white/40 dark:hover:bg-black/20 rounded p-0.5 cursor-pointer transition-opacity"
        aria-label="Eliminar pre-reserva"
      >
        <Icon name="close" size="sm" />
      </button>
    </div>
  );
}
