"use client";

import Image from "next/image";
import { cn } from "@/lib/utils/cn";
import { Icon } from "@/components/ui/icon";
import type { PublicDoctor } from "@/lib/types/scheduling";

const SPECIALTY_LABELS: Record<string, string> = {
  general: "Odontología General",
  odontopediatria: "Odontopediatría",
  implantes: "Implantes Dentales",
  ortodoncia: "Ortodoncia",
  sedacion: "Sedación Consciente",
  cirugia: "Cirugía Oral",
  estetica: "Estética Dental",
  endodoncia: "Endodoncia",
  periodoncia: "Periodoncia",
};

interface DoctorCardProps {
  doctor: PublicDoctor;
  isSelected?: boolean;
  onClick: () => void;
}

export function DoctorCard({ doctor, isSelected, onClick }: DoctorCardProps) {
  if (!doctor.profile) return null;

  const fullName = `Dr(a). ${doctor.profile.first_name} ${doctor.profile.last_name}`;
  const specialtyLabel = doctor.specialties
    .map((s) => SPECIALTY_LABELS[s] ?? s)
    .join(" / ");

  // Resumen de horarios activos
  const activeDays = doctor.schedules
    .filter((s) => s.is_active)
    .map((s) => s.day_of_week.charAt(0).toUpperCase() + s.day_of_week.slice(1, 3));

  const schedule = doctor.schedules.find((s) => s.is_active);
  const scheduleText = schedule
    ? `${schedule.start_time.slice(0, 5)} - ${schedule.end_time.slice(0, 5)}`
    : "";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-start gap-4 p-5 rounded-2xl border-2 transition-all duration-200 cursor-pointer text-left w-full",
        "hover:shadow-lg hover:scale-[1.01] active:scale-[0.99]",
        isSelected
          ? "border-primary bg-primary-fixed/30 shadow-md"
          : "border-outline-variant/40 bg-surface-container-lowest hover:border-primary/50"
      )}
    >
      {/* Avatar */}
      <div
        className={cn(
          "w-14 h-14 rounded-full flex-shrink-0 flex items-center justify-center",
          isSelected
            ? "bg-primary text-on-primary"
            : "bg-primary-fixed text-on-primary-fixed-variant"
        )}
      >
        {doctor.profile.avatar_url ? (
          <div className="relative w-14 h-14 rounded-full overflow-hidden shrink-0">
            <Image
              src={doctor.profile.avatar_url}
              alt={fullName}
              fill
              sizes="56px"
              className="object-cover"
            />
          </div>
        ) : (
          <Icon name="person" size="lg" />
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h3 className="font-headline font-bold text-on-surface text-sm">
          {fullName}
        </h3>
        <p className="text-xs text-primary font-semibold mt-0.5">
          {specialtyLabel}
        </p>
        {doctor.bio && (
          <p className="text-xs text-on-surface-variant mt-1.5 line-clamp-2 leading-relaxed">
            {doctor.bio}
          </p>
        )}
        <div className="flex items-center gap-3 mt-2 text-[10px] text-on-surface-variant">
          <span className="flex items-center gap-1">
            <Icon name="calendar_month" size="sm" className="text-xs" />
            {activeDays.join(", ")}
          </span>
          {scheduleText && (
            <span className="flex items-center gap-1">
              <Icon name="schedule" size="sm" className="text-xs" />
              {scheduleText}
            </span>
          )}
        </div>
      </div>

      {/* Check indicator */}
      {isSelected && (
        <div className="w-6 h-6 rounded-full bg-primary text-on-primary flex items-center justify-center flex-shrink-0">
          <Icon name="check" size="sm" className="text-sm" />
        </div>
      )}
    </button>
  );
}
