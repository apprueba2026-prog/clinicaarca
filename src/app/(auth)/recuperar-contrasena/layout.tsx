import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recuperar Contraseña | Clínica Arca",
  description: "Recupera el acceso a tu cuenta en Clínica Arca.",
};

export default function RecuperarContrasenaLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
