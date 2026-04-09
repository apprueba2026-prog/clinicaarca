import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Clínica Arca",
    short_name: "Arca",
    description: "Clínica dental en Lima, Perú. Gestión de citas y atención odontológica.",
    start_url: "/",
    display: "standalone",
    background_color: "#f7f9fb",
    theme_color: "#006194",
    lang: "es-PE",
    icons: [
      {
        src: "/logo-nav.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/logo-nav.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
