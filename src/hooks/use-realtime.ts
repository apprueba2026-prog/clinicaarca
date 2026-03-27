"use client";

import { useEffect } from "react";
import { useSupabase } from "./use-supabase";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Hook para suscribirse a cambios en tiempo real de una tabla
 * e invalidar las queries de TanStack Query automáticamente.
 */
export function useRealtime(table: string, queryKey: string[]) {
  const supabase = useSupabase();
  const queryClient = useQueryClient();

  useEffect(() => {
    const channel = supabase
      .channel(`realtime-${table}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => {
          queryClient.invalidateQueries({ queryKey });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [supabase, queryClient, table, queryKey]);
}
