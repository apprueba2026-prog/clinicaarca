"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { patientPortalService } from "@/lib/services/patient-portal.service";

export function useMyUpcomingAppointments() {
  return useQuery({
    queryKey: ["my-appointments", "upcoming"],
    queryFn: () => patientPortalService.getMyUpcomingAppointments(),
    staleTime: 60 * 1000,
  });
}

export function useMyPastAppointments(page = 0) {
  return useQuery({
    queryKey: ["my-appointments", "past", page],
    queryFn: () => patientPortalService.getMyPastAppointments(page),
    staleTime: 2 * 60 * 1000,
  });
}

export function useCancelAppointment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (appointmentId: string) =>
      patientPortalService.cancelMyAppointment(appointmentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-appointments"] });
    },
  });
}
