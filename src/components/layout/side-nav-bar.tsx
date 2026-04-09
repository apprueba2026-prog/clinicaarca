"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { ADMIN_NAV_ITEMS } from "@/lib/utils/constants";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils/cn";

export function SideNavBar() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 border-r border-outline-variant bg-surface-container-lowest flex flex-col py-6 z-50">
      {/* Logo */}
      <div className="px-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-on-primary">
            <Icon name="medical_services" filled />
          </div>
          <div>
            <h1 className="text-xl font-bold text-on-surface font-headline leading-tight">
              Clínica Arca
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-on-surface-variant font-semibold">
              Admin Panel
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1">
        {ADMIN_NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-6 py-3 font-medium transition-all duration-200",
                isActive
                  ? "text-primary font-semibold bg-primary/8 border-r-2 border-primary"
                  : "text-on-surface-variant hover:bg-surface-container-high"
              )}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Cerrar Sesión */}
      <div className="px-4 mt-auto">
        <button
          onClick={handleSignOut}
          className="w-full py-3 px-4 bg-surface-container-high hover:bg-error/10 text-on-surface-variant hover:text-error rounded-xl font-medium flex items-center justify-center gap-2 transition-all cursor-pointer"
        >
          <Icon name="logout" size="sm" />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}
