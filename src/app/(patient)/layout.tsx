import type { Metadata } from "next";
import { PatientNavBar } from "./_components/patient-nav-bar";
import { AIFab } from "@/components/shared/ai-fab";

export const metadata: Metadata = {
  title: "Mi Cuenta | Clínica Arca",
  description: "Gestiona tus citas y datos personales en Clínica Arca.",
};

export default function PatientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-surface dark:bg-slate-950">
      <PatientNavBar />
      {children}
      <AIFab />
    </div>
  );
}
