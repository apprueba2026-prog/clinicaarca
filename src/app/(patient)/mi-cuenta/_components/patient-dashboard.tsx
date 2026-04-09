"use client";

import { useState } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils/cn";
import { UpcomingAppointments } from "./upcoming-appointments";
import { PastAppointments } from "./past-appointments";
import { PersonalInfoForm } from "./personal-info-form";

const tabs = [
  { label: "Mis Citas", icon: "calendar_month" },
  { label: "Historial", icon: "history" },
  { label: "Mi Perfil", icon: "person" },
] as const;

export function PatientDashboard() {
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6">
      {/* Tabs */}
      <div className="flex gap-1 border-b border-outline-variant/30 dark:border-slate-800 mb-6 overflow-x-auto">
        {tabs.map((tab, i) => (
          <button
            key={tab.label}
            onClick={() => setActiveTab(i)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer",
              activeTab === i
                ? "text-primary dark:text-inverse-primary border-primary dark:border-inverse-primary"
                : "text-on-surface-variant border-transparent hover:text-on-surface dark:hover:text-slate-300 hover:border-outline-variant/50"
            )}
          >
            <Icon name={tab.icon} size="sm" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 0 && <UpcomingAppointments />}
      {activeTab === 1 && <PastAppointments />}
      {activeTab === 2 && <PersonalInfoForm />}
    </div>
  );
}
