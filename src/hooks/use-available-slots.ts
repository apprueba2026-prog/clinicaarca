"use client";

import { useQuery } from "@tanstack/react-query";
import { schedulingService } from "@/lib/services/scheduling.service";

export function useAvailableSlots(
  doctorId: string | null,
  date: string | null
) {
  return useQuery({
    queryKey: ["available-slots", doctorId, date],
    queryFn: () => schedulingService.getAvailableSlots(doctorId!, date!),
    enabled: !!doctorId && !!date,
    staleTime: 30 * 1000, // 30 segundos (slots cambian frecuentemente)
  });
}
