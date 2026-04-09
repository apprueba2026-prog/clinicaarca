"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { useThemeStore } from "@/stores/theme.store";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils/cn";

const navLinks = [
  { label: "Inicio", href: "/" },
  { label: "Especialidades", href: "/especialidades" },
  { label: "Ubicación", href: "/ubicacion" },
];

export function TopNavBar() {
  const pathname = usePathname();
  const { resolvedTheme, setTheme } = useThemeStore();
  const { user, loading } = useAuth();

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <nav className="sticky top-0 w-full z-50 font-headline antialiased tracking-tight border-b border-outline-variant/30 dark:border-slate-800/50 bg-surface-container-lowest/80 dark:bg-slate-950/80 backdrop-blur-2xl backdrop-saturate-150">
      <div className="flex justify-between items-center h-20 px-8 max-w-screen-2xl mx-auto">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0 relative group">
          <Image
            src="/logo-nav.png"
            alt="Clínica Arca"
            width={119}
            height={68}
            className={cn(
              "h-[68px] w-auto relative transition-all duration-300",
              // Light mode: sombra sutil para profundidad
              "[filter:drop-shadow(0_1px_3px_rgba(0,97,148,0.15))]",
              // Dark mode: brightness para visibilidad + neón blanco-brillante en letras
              "dark:[filter:brightness(1.8)_contrast(0.9)_saturate(1.2)_drop-shadow(0_0_4px_rgba(255,255,255,0.7))_drop-shadow(0_0_10px_rgba(230,245,255,0.5))_drop-shadow(0_0_24px_rgba(200,230,255,0.25))]",
              // Hover light
              "group-hover:[filter:drop-shadow(0_0_8px_rgba(0,97,148,0.25))_drop-shadow(0_0_20px_rgba(0,97,148,0.1))]",
              // Hover dark: neón blanco más intenso
              "dark:group-hover:[filter:brightness(2.0)_contrast(0.9)_saturate(1.2)_drop-shadow(0_0_6px_rgba(255,255,255,0.85))_drop-shadow(0_0_14px_rgba(230,245,255,0.6))_drop-shadow(0_0_30px_rgba(200,230,255,0.3))]"
            )}
            priority
          />
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center space-x-1">
          {navLinks.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname.startsWith(link.href);

            return (
              <Link
                key={link.label}
                href={link.href}
                className={
                  isActive
                    ? "relative px-4 py-2 text-sm font-semibold text-primary dark:text-inverse-primary rounded-xl bg-primary/8 dark:bg-primary/15 transition-all duration-200"
                    : "px-4 py-2 text-sm font-medium text-on-surface-variant hover:text-primary dark:hover:text-inverse-primary hover:bg-primary/5 dark:hover:bg-primary/10 rounded-xl transition-all duration-200"
                }
              >
                {link.label}
              </Link>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-3">
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl hover:bg-surface-container-high dark:hover:bg-slate-800 transition-all duration-200 text-on-surface-variant"
          >
            <Icon name={resolvedTheme === "dark" ? "light_mode" : "dark_mode"} />
          </button>
          <div className="hidden lg:block min-w-[140px]">
            <Link
              href={
                user
                  ? user.user_metadata?.role === "patient"
                    ? "/mi-cuenta"
                    : "/dashboard"
                  : "/login"
              }
              className={cn(
                "transition-opacity duration-200",
                loading ? "opacity-0 pointer-events-none" : "opacity-100"
              )}
            >
              <Button variant="ghost" size="sm" tabIndex={-1}>
                <Icon
                  name={
                    user
                      ? user.user_metadata?.role === "patient"
                        ? "account_circle"
                        : "dashboard"
                      : "login"
                  }
                  size="sm"
                />
                {user
                  ? user.user_metadata?.role === "patient"
                    ? "Mi Cuenta"
                    : "Dashboard"
                  : "Iniciar Sesión"}
              </Button>
            </Link>
          </div>
          <Link href="/agendar-cita">
            <Button variant="primary" size="md" tabIndex={-1}>
              Agendar Cita
            </Button>
          </Link>
        </div>
      </div>
    </nav>
  );
}
