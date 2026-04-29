// Roles del staff (también usado en src/middleware.ts y validaciones API).
// 'patient' tiene su propio portal y queda fuera de este nav.
export type StaffRole = "admin" | "dentist" | "receptionist";

// Cada item declara los roles que pueden VERLO en el sidebar.
// El middleware valida lo mismo server-side para bloquear acceso por URL directa.
export const ADMIN_NAV_ITEMS: ReadonlyArray<{
  label: string;
  icon: string;
  href: string;
  roles: ReadonlyArray<StaffRole>;
}> = [
  {
    label: "Resumen",
    icon: "dashboard",
    href: "/dashboard",
    roles: ["admin", "dentist", "receptionist"],
  },
  {
    label: "Agenda",
    icon: "calendar_month",
    href: "/agenda",
    roles: ["admin", "dentist", "receptionist"],
  },
  {
    label: "Pacientes",
    icon: "group",
    href: "/pacientes",
    roles: ["admin", "dentist", "receptionist"],
  },
  // Doctores: solo admin (gestión sensible del staff médico).
  {
    label: "Doctores",
    icon: "stethoscope",
    href: "/doctores",
    roles: ["admin"],
  },
  // CMS: solo admin (contenido público y branding).
  {
    label: "Contenidos (CMS)",
    icon: "content_copy",
    href: "/contenidos",
    roles: ["admin"],
  },
  // Facturación: solo admin (datos fiscales).
  {
    label: "Facturación (SUNAT)",
    icon: "receipt_long",
    href: "/facturacion",
    roles: ["admin"],
  },
  // Usuarios: solo admin (gestión de roles del staff).
  {
    label: "Usuarios",
    icon: "manage_accounts",
    href: "/usuarios",
    roles: ["admin"],
  },
  {
    label: "Mi Perfil",
    icon: "person",
    href: "/perfil",
    roles: ["admin", "dentist", "receptionist"],
  },
  {
    label: "Configuración",
    icon: "settings",
    href: "/configuracion",
    roles: ["admin"],
  },
];

/** Filtra items del nav según el rol actual del staff. */
export function filterNavItemsByRole(role: StaffRole | null | undefined) {
  if (!role) return [];
  return ADMIN_NAV_ITEMS.filter((item) =>
    (item.roles as ReadonlyArray<string>).includes(role)
  );
}

/** Rutas (path prefix) restringidas a roles concretos. Usado por middleware. */
export const RESTRICTED_ROUTES: Array<{
  prefix: string;
  allowed: ReadonlyArray<StaffRole>;
}> = [
  { prefix: "/doctores", allowed: ["admin"] },
  { prefix: "/contenidos", allowed: ["admin"] },
  { prefix: "/facturacion", allowed: ["admin"] },
  { prefix: "/usuarios", allowed: ["admin"] },
  { prefix: "/configuracion", allowed: ["admin"] },
];

// Navegación pública
export const PUBLIC_NAV_ITEMS = [
  { label: "Especialidades", href: "/especialidades" },
  { label: "Nosotros", href: "/nosotros" },
  { label: "Contacto", href: "/contacto" },
] as const;

// Horarios del calendario (atención de la clínica: 09:00 a 20:00)
export const CALENDAR_START_HOUR = 9;
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
