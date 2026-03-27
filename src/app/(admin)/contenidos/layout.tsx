import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contenidos (CMS)",
  description: "Gestión de testimonios, staff médico y noticias para la web pública.",
};

export default function ContenidosLayout({ children }: { children: React.ReactNode }) {
  return children;
}
