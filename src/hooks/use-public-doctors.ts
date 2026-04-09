"use client";

import { useQuery } from "@tanstack/react-query";
import { schedulingService } from "@/lib/services/scheduling.service";
import type { ProcedureCategory } from "@/lib/types/enums";

export function usePublicDoctors() {
  return useQuery({
    queryKey: ["public-doctors"],
    queryFn: () => schedulingService.getPublicDoctors(),
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

export function useDoctorsByCategory(category: ProcedureCategory | null) {
  return useQuery({
    queryKey: ["public-doctors", category],
    queryFn: () => schedulingService.getDoctorsByCategory(category!),
    enabled: !!category,
    staleTime: 5 * 60 * 1000,
  });
}
