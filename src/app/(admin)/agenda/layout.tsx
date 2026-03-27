import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Agenda",
  description: "Calendario semanal de citas médicas con gestión en tiempo real.",
};

export default function AgendaLayout({ children }: { children: React.ReactNode }) {
  return children;
}
