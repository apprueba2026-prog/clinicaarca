"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminDoctorsService,
  type CreateDoctorData,
  type UpdateDoctorData,
  type UpsertScheduleData,
} from "@/lib/services/admin-doctors.service";

export function useAdminDoctors() {
  return useQuery({
    queryKey: ["admin-doctors"],
    queryFn: () => adminDoctorsService.getAll(),
    staleTime: 60 * 1000,
  });
}

export function useDoctorSchedules(doctorId: string | null) {
  return useQuery({
    queryKey: ["doctor-schedules", doctorId],
    queryFn: () => adminDoctorsService.getSchedules(doctorId!),
    enabled: !!doctorId,
    staleTime: 60 * 1000,
  });
}

export function useCreateDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDoctorData) => adminDoctorsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-doctors"] });
    },
  });
}

export function useUpdateDoctor() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateDoctorData }) =>
      adminDoctorsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-doctors"] });
    },
  });
}

export function useToggleDoctorPublic() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isPublic }: { id: string; isPublic: boolean }) =>
      adminDoctorsService.togglePublic(id, isPublic),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-doctors"] });
    },
  });
}

export function useUpsertSchedules() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (schedules: UpsertScheduleData[]) =>
      adminDoctorsService.upsertSchedules(schedules),
    onSuccess: (_data, variables) => {
      const doctorId = variables[0]?.doctor_id;
      if (doctorId) {
        queryClient.invalidateQueries({
          queryKey: ["doctor-schedules", doctorId],
        });
      }
    },
  });
}
