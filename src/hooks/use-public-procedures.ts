"use client";

import { useQuery } from "@tanstack/react-query";
import { proceduresService } from "@/lib/services/procedures.service";

export function usePublicProcedures() {
  return useQuery({
    queryKey: ["public-procedures"],
    queryFn: () => proceduresService.getActive(),
    staleTime: 10 * 60 * 1000, // 10 minutos
  });
}
