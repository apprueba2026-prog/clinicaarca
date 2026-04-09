import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cambiar Contraseña | Clínica Arca",
  description: "Establece una nueva contraseña para tu cuenta.",
};

export default function CambiarContrasenaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
