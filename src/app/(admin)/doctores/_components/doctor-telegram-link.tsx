"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";

interface Props {
  doctorId: string;
}

interface StatusResponse {
  linked: boolean;
  telegram_username?: string | null;
  telegram_first_name?: string | null;
  linked_at?: string;
}

export function DoctorTelegramLink({ doctorId }: Props) {
  const queryClient = useQueryClient();
  const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);
  const [copyState, setCopyState] = useState<"idle" | "copied">("idle");

  const { data: status, isLoading, isFetching, refetch } = useQuery<StatusResponse>({
    queryKey: ["telegram-doctor-status", doctorId],
    queryFn: async () => {
      const res = await fetch(
        `/api/telegram/doctor-status?doctorId=${doctorId}`
      );
      if (!res.ok) throw new Error("Error consultando estado");
      return res.json();
    },
    // Auto-refresh cada 5s solo si hay enlace pendiente y aún no vinculado
    refetchInterval: (query) => {
      const data = query.state.data as StatusResponse | undefined;
      return generatedUrl && !data?.linked ? 5000 : false;
    },
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/telegram/link-doctor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "No se pudo generar el enlace");
      return json.url as string;
    },
    onSuccess: (url) => {
      setGeneratedUrl(url);
      setCopyState("idle");
    },
  });

  const unlinkMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/telegram/unlink-doctor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ doctorId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "No se pudo desvincular");
    },
    onSuccess: () => {
      setGeneratedUrl(null);
      queryClient.invalidateQueries({
        queryKey: ["telegram-doctor-status", doctorId],
      });
    },
  });

  function handleCopy() {
    if (!generatedUrl) return;
    navigator.clipboard.writeText(generatedUrl).then(() => {
      setCopyState("copied");
      setTimeout(() => setCopyState("idle"), 1800);
    });
  }

  function handleUnlink() {
    if (
      window.confirm(
        "¿Desvincular Telegram de este doctor? Dejará de recibir notificaciones."
      )
    ) {
      unlinkMutation.mutate();
    }
  }

  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-low p-4 space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon name="send" size="sm" className="text-primary" />
          <h4 className="text-sm font-bold text-on-surface">
            Notificaciones por Telegram
          </h4>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          title="Actualizar estado"
          className="text-on-surface-variant hover:text-primary cursor-pointer disabled:opacity-50"
        >
          <Icon
            name="refresh"
            size="sm"
            className={isFetching ? "animate-spin" : ""}
          />
        </button>
      </div>

      {isLoading ? (
        <p className="text-xs text-on-surface-variant">Consultando estado...</p>
      ) : status?.linked ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-bold">
              <Icon name="check_circle" size="sm" />
              Vinculado
            </span>
            {status.telegram_username && (
              <span className="text-on-surface-variant">
                @{status.telegram_username}
              </span>
            )}
            {status.telegram_first_name && !status.telegram_username && (
              <span className="text-on-surface-variant">
                {status.telegram_first_name}
              </span>
            )}
          </div>
          <p className="text-[11px] text-on-surface-variant leading-relaxed">
            Recibirá Telegram al crear nuevas citas y el reporte diario.
          </p>
          <button
            type="button"
            onClick={handleUnlink}
            disabled={unlinkMutation.isPending}
            className="text-xs font-bold text-error hover:underline cursor-pointer disabled:opacity-60"
          >
            {unlinkMutation.isPending ? "Desvinculando..." : "Desvincular Telegram"}
          </button>
        </div>
      ) : generatedUrl ? (
        <div className="space-y-3">
          <p className="text-[11px] text-on-surface-variant leading-relaxed">
            Comparte este enlace con la doctora. Debe abrirlo en su Telegram y
            presionar <strong>Iniciar / Start</strong>. Vence en 15 minutos.
          </p>
          <div className="flex items-center gap-2 text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-2 py-1.5">
            <Icon name="hourglass_top" size="sm" className="animate-pulse" />
            <span>
              Esperando confirmación... el estado se actualiza automáticamente cada 5s.
            </span>
          </div>
          <div className="flex items-center gap-2 p-2 rounded-lg bg-surface-container text-xs font-mono break-all">
            <span className="flex-1">{generatedUrl}</span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleCopy}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-on-primary text-xs font-bold cursor-pointer"
            >
              <Icon
                name={copyState === "copied" ? "check" : "content_copy"}
                size="sm"
              />
              {copyState === "copied" ? "Copiado" : "Copiar enlace"}
            </button>
            <a
              href={generatedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-outline-variant text-xs font-bold cursor-pointer"
            >
              <Icon name="open_in_new" size="sm" />
              Abrir Telegram
            </a>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-[11px] text-on-surface-variant leading-relaxed">
            Genera un enlace de vinculación. La doctora lo abre en su Telegram,
            presiona <strong>Iniciar</strong> y queda registrada para recibir
            notificaciones de citas.
          </p>
          {generateMutation.isError && (
            <p className="text-xs text-error">
              {(generateMutation.error as Error).message}
            </p>
          )}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => generateMutation.mutate()}
            disabled={generateMutation.isPending}
          >
            <Icon name="link" size="sm" />
            {generateMutation.isPending
              ? "Generando..."
              : "Generar enlace de vinculación"}
          </Button>
        </div>
      )}
    </div>
  );
}
