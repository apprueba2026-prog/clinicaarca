"use client";

import { Icon } from "@/components/ui/icon";
import { useThemeStore } from "@/stores/theme.store";
import { useAuth } from "@/hooks/use-auth";

export function AdminTopBar() {
  const { resolvedTheme, setTheme } = useThemeStore();
  const { user } = useAuth();

  const toggleTheme = () => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  };

  const displayName = user?.user_metadata?.full_name ?? "Administrador";
  const displayRole = user?.user_metadata?.role ?? "Staff";

  return (
    <header className="fixed top-0 right-0 w-[calc(100%-16rem)] h-16 glass-nav border-b border-slate-200 dark:border-slate-800 z-40">
      <div className="flex justify-between items-center px-8 h-full">
        {/* Search */}
        <div className="flex items-center bg-surface-container-low dark:bg-slate-900 rounded-full px-4 py-1.5 w-96">
          <Icon name="search" size="sm" className="text-slate-400" />
          <input
            className="bg-transparent border-none focus:ring-0 focus:outline-none text-sm w-full text-slate-600 dark:text-slate-300 ml-2"
            placeholder="Buscar pacientes, citas..."
            type="text"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 border-r border-slate-200 dark:border-slate-800 pr-6">
            {/* Dark mode toggle */}
            <button
              onClick={toggleTheme}
              className="text-slate-500 hover:text-sky-600 transition-colors cursor-pointer"
            >
              <Icon
                name={resolvedTheme === "dark" ? "light_mode" : "dark_mode"}
              />
            </button>

            {/* Notifications */}
            <button className="text-slate-500 hover:text-sky-600 transition-colors relative cursor-pointer">
              <Icon name="notifications" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-error rounded-full border-2 border-white dark:border-slate-950" />
            </button>
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                {displayName}
              </p>
              <p className="text-[10px] text-slate-500">{displayRole}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary/10 border-2 border-primary/20 flex items-center justify-center">
              <Icon
                name="person"
                className="text-primary"
                size="sm"
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
