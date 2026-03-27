"use client";

import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/lib/services/dashboard.service";

export function useTodayAppointments() {
  return useQuery({
    queryKey: ["appointments", "today"],
    queryFn: () => dashboardService.getTodayAppointments(),
    refetchInterval: 30_000,
  });
}

export function useDashboardKPIs() {
  const appointmentCount = useQuery({
    queryKey: ["kpi", "appointments-count"],
    queryFn: () => dashboardService.getTodayAppointmentCount(),
    refetchInterval: 60_000,
  });

  const newPatients = useQuery({
    queryKey: ["kpi", "new-patients-month"],
    queryFn: () => dashboardService.getNewPatientsThisMonth(),
    refetchInterval: 60_000,
  });

  const revenue = useQuery({
    queryKey: ["kpi", "estimated-revenue"],
    queryFn: () => dashboardService.getEstimatedRevenue(),
    refetchInterval: 60_000,
  });

  return { appointmentCount, newPatients, revenue };
}
