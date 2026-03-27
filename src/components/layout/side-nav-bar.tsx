"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon } from "@/components/ui/icon";
import { ADMIN_NAV_ITEMS } from "@/lib/utils/constants";
import { useModalStore } from "@/stores/modal.store";
import { cn } from "@/lib/utils/cn";

export function SideNavBar() {
  const pathname = usePathname();
  const openModal = useModalStore((s) => s.openModal);

  return (
    <aside className="h-screen w-64 fixed left-0 top-0 border-r border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex flex-col py-6 z-50">
      {/* Logo */}
      <div className="px-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white">
            <Icon name="medical_services" filled />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white font-headline leading-tight">
              Clínica Arca
            </h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-semibold">
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
                  ? "text-sky-700 dark:text-sky-400 font-semibold bg-sky-50/50 dark:bg-sky-900/20 border-r-2 border-sky-600"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900"
              )}
            >
              <Icon name={item.icon} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Nueva Cita Button */}
      <div className="px-4 mt-auto">
        <button
          onClick={() => openModal("new-appointment")}
          className="w-full py-3 px-4 bg-primary hover:bg-primary-container text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-primary/20 cursor-pointer"
        >
          <Icon name="add" size="sm" />
          Nueva Cita
        </button>
      </div>
    </aside>
  );
}
