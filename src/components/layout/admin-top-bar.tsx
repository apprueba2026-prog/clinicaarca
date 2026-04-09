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
    <header className="fixed top-0 right-0 w-[calc(100%-16rem)] h-16 glass-nav border-b border-outline-variant z-40">
      <div className="flex justify-between items-center px-8 h-full">
        {/* Search */}
        <div className="flex items-center bg-surface-container rounded-full px-4 py-1.5 w-96">
          <Icon name="search" size="sm" className="text-on-surface-variant" />
          <input
            className="bg-transparent border-none focus:ring-0 focus:outline-none text-sm w-full text-on-surface ml-2 placeholder:text-on-surface-variant/50"
            placeholder="Buscar pacientes, citas..."
            type="text"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-4 border-r border-outline-variant pr-6">
            {/* Dark mode toggle */}
            <button
              onClick={toggleTheme}
              className="text-on-surface-variant hover:text-primary transition-colors cursor-pointer"
            >
              <Icon
                name={resolvedTheme === "dark" ? "light_mode" : "dark_mode"}
              />
            </button>

            {/* Notifications */}
            <button className="text-on-surface-variant hover:text-primary transition-colors relative cursor-pointer">
              <Icon name="notifications" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-error rounded-full border-2 border-surface-container-lowest" />
            </button>
          </div>

          {/* User Profile */}
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs font-bold text-on-surface">
                {displayName}
              </p>
              <p className="text-[10px] text-on-surface-variant">{displayRole}</p>
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
