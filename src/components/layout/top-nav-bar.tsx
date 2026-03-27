"use client";

import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { useThemeStore } from "@/stores/theme.store";

const navLinks = [
  { label: "Inicio", href: "/", active: true },
  { label: "Odontopediatría", href: "/especialidades" },
  { label: "Implantes", href: "/especialidades" },
  { label: "Anestesiología", href: "/especialidades" },
];

export function TopNavBar() {
  const { resolvedTheme, setTheme } = useThemeStore();

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  return (
    <nav className="sticky top-0 w-full z-50 bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl shadow-sm dark:shadow-none font-headline antialiased tracking-tight">
      <div className="flex justify-between items-center h-20 px-8 max-w-screen-2xl mx-auto">
        {/* Logo */}
        <Link
          href="/"
          className="text-2xl font-bold tracking-tighter text-sky-900 dark:text-sky-50"
        >
          Clínica Arca
        </Link>

        {/* Nav Links */}
        <div className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className={
                link.active
                  ? "text-sky-700 dark:text-sky-400 font-semibold border-b-2 border-sky-700 dark:border-sky-400 pb-1"
                  : "text-slate-600 dark:text-slate-400 hover:text-sky-600 dark:hover:text-sky-300 transition-colors"
              }
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-300 text-slate-600 dark:text-slate-400"
          >
            <Icon name={resolvedTheme === "dark" ? "light_mode" : "dark_mode"} />
          </button>
          <Button variant="ghost" size="sm" className="hidden lg:block">
            Portal Paciente
          </Button>
          <Button variant="primary" size="md">
            Agendar Cita
          </Button>
        </div>
      </div>
    </nav>
  );
}
