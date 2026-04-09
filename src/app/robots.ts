import type { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://clinicaarca.com";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/dashboard",
          "/agenda",
          "/pacientes",
          "/doctores",
          "/contenidos",
          "/facturacion",
          "/configuracion",
          "/login",
          "/registro",
          "/recuperar-contrasena",
          "/mi-cuenta",
          "/api/",
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
