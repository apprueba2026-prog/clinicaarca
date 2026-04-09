// Navegación del sidebar admin
export const ADMIN_NAV_ITEMS = [
  { label: "Resumen", icon: "dashboard", href: "/dashboard" },
  { label: "Agenda", icon: "calendar_month", href: "/agenda" },
  { label: "Pacientes", icon: "group", href: "/pacientes" },
  { label: "Doctores", icon: "stethoscope", href: "/doctores" },
  { label: "Contenidos (CMS)", icon: "content_copy", href: "/contenidos" },
  { label: "Facturación (SUNAT)", icon: "receipt_long", href: "/facturacion" },
  { label: "Configuración", icon: "settings", href: "/configuracion" },
] as const;

// Navegación pública
export const PUBLIC_NAV_ITEMS = [
  { label: "Especialidades", href: "/especialidades" },
  { label: "Nosotros", href: "/nosotros" },
  { label: "Contacto", href: "/contacto" },
] as const;

// Horarios del calendario
export const CALENDAR_START_HOUR = 8;
export const CALENDAR_END_HOUR = 20;

// Agendamiento de citas
export const APPOINTMENT_DURATION_MINUTES = 30;
export const MAX_FUTURE_APPOINTMENTS = 10;
export const MAX_ADVANCE_DAYS = 60;
export const MIN_CANCEL_HOURS = 24;

// Paginación por defecto
export const DEFAULT_PAGE_SIZE = 20;

// Tamaños máximos de archivos
export const MAX_VIDEO_SIZE_MB = 15;
export const MAX_IMAGE_SIZE_MB = 5;
