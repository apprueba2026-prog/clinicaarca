import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Crear Cuenta | Clínica Arca",
  description: "Regístrate para gestionar tus citas en Clínica Arca.",
};

export default function RegistroLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
