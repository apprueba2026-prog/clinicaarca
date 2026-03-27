import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Panel de control con indicadores clave, citas del día y rendimiento de la clínica.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
