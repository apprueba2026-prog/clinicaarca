import type { User } from "@supabase/supabase-js";
import type { UserRole } from "@/lib/types/enums";

const ROLE_ROUTES: Record<UserRole, string> = {
  admin: "/dashboard",
  dentist: "/dashboard",
  receptionist: "/dashboard",
  patient: "/mi-cuenta",
};

export function getRoleRedirect(user: User): string {
  const role = (user.user_metadata?.role as UserRole) ?? "patient";
  return ROLE_ROUTES[role] ?? "/mi-cuenta";
}

export function getRoleRedirectFromMetadata(role?: string): string {
  if (role && role in ROLE_ROUTES) {
    return ROLE_ROUTES[role as UserRole];
  }
  return "/mi-cuenta";
}
