"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { useThemeStore } from "@/stores/theme.store";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils/cn";

export function PatientNavBar() {
  const router = useRouter();
  const { resolvedTheme, setTheme } = useThemeStore();
  const { user, signOut } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  const firstName = user?.user_metadata?.first_name ?? "Mi Cuenta";

  return (
    <nav className="sticky top-0 w-full z-50 font-headline antialiased tracking-tight border-b border-outline-variant/30 dark:border-slate-800/50 bg-surface-container-lowest/80 dark:bg-slate-950/80 backdrop-blur-2xl backdrop-saturate-150">
      <div className="flex justify-between items-center h-16 px-4 sm:px-6 max-w-4xl mx-auto">
        {/* Logo */}
        <Link href="/" className="flex-shrink-0">
          <Image
            src="/logo-nav.png"
            alt="Clínica Arca"
            width={84}
            height={48}
            className={cn(
              "h-[48px] w-auto transition-all duration-300",
              "dark:[filter:brightness(1.8)_contrast(0.9)_saturate(1.2)_drop-shadow(0_0_4px_rgba(255,255,255,0.7))]"
            )}
            priority
          />
        </Link>

        {/* Center: Agendar Cita */}
        <Link href="/agendar-cita" className="hidden sm:block">
          <Button variant="primary" size="sm" tabIndex={-1}>
            <Icon name="add" size="sm" />
            Agendar Cita
          </Button>
        </Link>

        {/* Right actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-xl hover:bg-surface-container-high dark:hover:bg-slate-800 transition-colors text-on-surface-variant"
          >
            <Icon name={resolvedTheme === "dark" ? "light_mode" : "dark_mode"} size="sm" />
          </button>

          {/* User menu */}
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-surface-container-high dark:hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center text-primary dark:text-inverse-primary">
                <Icon name="person" size="sm" />
              </div>
              <span className="hidden sm:block text-sm font-medium text-on-surface dark:text-white">
                {firstName}
              </span>
              <Icon
                name="expand_more"
                size="sm"
                className={cn(
                  "text-on-surface-variant transition-transform",
                  menuOpen && "rotate-180"
                )}
              />
            </button>

            {/* Dropdown */}
            {menuOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setMenuOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1 z-50 w-52 rounded-xl bg-surface-container-lowest dark:bg-slate-900 border border-outline-variant/30 dark:border-slate-800 shadow-xl py-1">
                  <Link
                    href="/mi-cuenta"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-on-surface dark:text-slate-300 hover:bg-surface-container-high dark:hover:bg-slate-800 transition-colors"
                  >
                    <Icon name="account_circle" size="sm" />
                    Mi Cuenta
                  </Link>
                  <Link
                    href="/agendar-cita"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-on-surface dark:text-slate-300 hover:bg-surface-container-high dark:hover:bg-slate-800 transition-colors sm:hidden"
                  >
                    <Icon name="calendar_month" size="sm" />
                    Agendar Cita
                  </Link>
                  <Link
                    href="/"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-on-surface dark:text-slate-300 hover:bg-surface-container-high dark:hover:bg-slate-800 transition-colors"
                  >
                    <Icon name="home" size="sm" />
                    Ir al sitio web
                  </Link>
                  <div className="border-t border-outline-variant/20 dark:border-slate-800 my-1" />
                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-error hover:bg-error/5 dark:hover:bg-error/10 transition-colors w-full cursor-pointer"
                  >
                    <Icon name="logout" size="sm" />
                    Cerrar sesión
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
