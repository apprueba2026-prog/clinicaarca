"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { patientPortalService } from "@/lib/services/patient-portal.service";
import type { Patient } from "@/lib/types/patient";

export function useMyProfile() {
  return useQuery({
    queryKey: ["my-profile"],
    queryFn: () => patientPortalService.getMyProfile(),
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateMyProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (
      data: Partial<
        Pick<Patient, "first_name" | "last_name" | "phone" | "birth_date" | "address">
      >
    ) => patientPortalService.updateMyProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-profile"] });
    },
  });
}
