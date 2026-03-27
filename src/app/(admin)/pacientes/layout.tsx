import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pacientes",
  description: "Directorio de pacientes con expedientes, historial de citas y facturación.",
};

export default function PacientesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
