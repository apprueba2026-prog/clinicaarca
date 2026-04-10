"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils/cn";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";
import { useBookingStore } from "@/stores/booking.store";
import { usePublicDoctors } from "@/hooks/use-public-doctors";
import { useAuth } from "@/hooks/use-auth";

const CATEGORY_LABELS: Record<string, string> = {
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

function formatDateLong(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  const days = [
    "Domingo", "Lunes", "Martes", "Miércoles",
    "Jueves", "Viernes", "Sábado",
  ];
  const months = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
  ];

  return `${days[date.getDay()]} ${date.getDate()} de ${months[date.getMonth()]}, ${date.getFullYear()}`;
}

function formatTime(time: string): string {
  return time.slice(0, 5);
}

export function StepConfirmation() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const {
    selectedDoctorId,
    selectedCategory,
    selectedDate,
    selectedSlot,
    notes,
    setNotes,
    guestName,
    guestPhone,
    guestEmail,
    guestDni,
    setGuestName,
    setGuestPhone,
    setGuestEmail,
    setGuestDni,
    saveDraft,
    clearDraft,
    goBack,
  } = useBookingStore();

  const { data: doctors } = usePublicDoctors();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const doctor = doctors?.find((d) => d.id === selectedDoctorId);
  const doctorName = doctor
    ? `Dr(a). ${doctor.profile?.first_name} ${doctor.profile?.last_name}`
    : "";
  const categoryLabel = selectedCategory
    ? CATEGORY_LABELS[selectedCategory] ?? selectedCategory
    : "Consulta General";
  const duration = doctor?.consultation_duration_minutes ?? 30;

  const isPatient = user?.user_metadata?.role === "patient";

  const handleRedirectToAuth = (path: "login" | "registro") => {
    saveDraft();
    router.push(`/${path}?next=/agendar-cita&restore=1`);
  };

  const handleConfirm = async () => {
    if (!selectedDoctorId || !selectedDate || !selectedSlot) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/appointments/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctor_id: selectedDoctorId,
          procedure_id: null,
          scheduled_date: selectedDate,
          start_time: selectedSlot.start,
          end_time: selectedSlot.end,
          notes: notes || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? "Error al agendar la cita");
        return;
      }

      setSuccess(true);
      clearDraft();

      // Redirigir a mi-cuenta después de 2 segundos
      setTimeout(() => {
        router.push("/mi-cuenta");
      }, 2500);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleConfirmGuest = async () => {
    if (!selectedDoctorId || !selectedDate || !selectedSlot) return;

    // Validación básica en cliente
    if (!guestName.trim() || guestName.trim().length < 2) {
      setError("Ingresa tu nombre completo");
      return;
    }
    if (!/^9\d{8}$/.test(guestPhone)) {
      setError("Teléfono debe ser 9 dígitos (ej: 985289689)");
      return;
    }
    if (!guestEmail.includes("@")) {
      setError("Ingresa un email válido");
      return;
    }
    if (!/^\d{8}$/.test(guestDni)) {
      setError("DNI debe ser 8 dígitos");
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/appointments/book-guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          guest_name: guestName.trim(),
          guest_phone: guestPhone.trim(),
          guest_email: guestEmail.trim().toLowerCase(),
          guest_dni: guestDni.trim(),
          doctor_id: selectedDoctorId,
          scheduled_date: selectedDate,
          start_time: selectedSlot.start,
          end_time: selectedSlot.end,
          notes: notes || undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setError(result.error ?? "Error al agendar la cita");
        return;
      }

      setSuccess(true);
      clearDraft();
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  // Estado de éxito
  if (success) {
    const isLoggedIn = user && isPatient;

    if (isLoggedIn) {
      // Redirigir a mi-cuenta tras 2.5s
      setTimeout(() => router.push("/mi-cuenta"), 2500);
    }

    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <Icon name="check_circle" size="xl" className="text-green-600" filled />
        </div>
        <h2 className="font-headline text-xl font-extrabold text-on-surface">
          ¡Cita Confirmada!
        </h2>
        <p className="text-sm text-on-surface-variant mt-2 max-w-sm">
          Tu cita ha sido agendada exitosamente.
          {guestEmail
            ? ` Recibirás un correo de confirmación en ${guestEmail}.`
            : " Recibirás un correo de confirmación con los detalles."}
        </p>

        {isLoggedIn ? (
          <p className="text-xs text-on-surface-variant/70 mt-4">
            Redirigiendo a tu cuenta...
          </p>
        ) : (
          <div className="mt-6 space-y-3">
            <p className="text-xs text-on-surface-variant">
              ¿Quieres gestionar tus citas online y recibir recordatorios?
            </p>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/registro?email=${encodeURIComponent(guestEmail)}&next=/mi-cuenta`)}
            >
              <Icon name="person_add" size="sm" />
              Crear mi cuenta (opcional)
            </Button>
            <button
              type="button"
              onClick={() => router.push("/")}
              className="block mx-auto text-sm text-primary font-semibold hover:underline cursor-pointer"
            >
              Volver al inicio
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Título */}
      <div className="text-center">
        <h2 className="font-headline text-xl font-extrabold text-on-surface">
          Confirma tu cita
        </h2>
        <p className="text-sm text-on-surface-variant mt-1">
          Revisa los detalles antes de confirmar
        </p>
      </div>

      {/* Card de resumen */}
      <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-6 space-y-4">
        <div className="flex items-center gap-3 pb-4 border-b border-outline-variant/20">
          <div className="w-12 h-12 rounded-full bg-primary-fixed text-on-primary-fixed-variant flex items-center justify-center">
            <Icon name="person" size="lg" />
          </div>
          <div>
            <p className="font-headline font-bold text-on-surface">
              {doctorName}
            </p>
            <p className="text-xs text-primary font-semibold">
              {categoryLabel}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-start gap-2">
            <Icon
              name="calendar_month"
              size="sm"
              className="text-primary mt-0.5"
            />
            <div>
              <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">
                Fecha
              </p>
              <p className="text-sm font-semibold text-on-surface">
                {selectedDate ? formatDateLong(selectedDate) : "-"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Icon name="schedule" size="sm" className="text-primary mt-0.5" />
            <div>
              <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">
                Hora
              </p>
              <p className="text-sm font-semibold text-on-surface">
                {selectedSlot
                  ? `${formatTime(selectedSlot.start)} - ${formatTime(selectedSlot.end)}`
                  : "-"}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Icon name="timer" size="sm" className="text-primary mt-0.5" />
            <div>
              <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">
                Duración
              </p>
              <p className="text-sm font-semibold text-on-surface">
                {duration} minutos
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2">
            <Icon name="payments" size="sm" className="text-primary mt-0.5" />
            <div>
              <p className="text-[10px] font-semibold text-on-surface-variant uppercase tracking-wider">
                Costo
              </p>
              <p className="text-sm font-semibold text-on-surface">
                Consulta gratuita
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Comentario / motivo */}
      <div>
        <label
          htmlFor="booking-notes"
          className="flex items-center gap-2 text-sm font-semibold text-on-surface mb-2"
        >
          <Icon name="edit_note" size="sm" className="text-primary" />
          Motivo de consulta
          <span className="text-on-surface-variant font-normal">(opcional)</span>
        </label>
        <textarea
          id="booking-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Describe brevemente tu motivo de consulta o dolencia..."
          maxLength={500}
          rows={3}
          className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-3 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none"
        />
        <p className="text-[10px] text-on-surface-variant/70 mt-1 text-right">
          {notes.length}/500
        </p>
      </div>

      {/* Error */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-error-container/30 text-error text-sm">
          <Icon name="error" size="sm" />
          {error}
        </div>
      )}

      {/* Auth Gate o Confirmar */}
      {authLoading ? (
        <div className="flex items-center justify-center py-6">
          <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : !user || !isPatient ? (
        <div className="space-y-4">
          {/* Formulario guest */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 p-6 space-y-4">
            <p className="text-sm font-semibold text-on-surface text-center">
              Completa tus datos para confirmar la cita
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="guest-name" className="text-xs font-semibold text-on-surface-variant mb-1 block">
                  Nombre completo
                </label>
                <input
                  id="guest-name"
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Juan Pérez García"
                  className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>

              <div>
                <label htmlFor="guest-dni" className="text-xs font-semibold text-on-surface-variant mb-1 block">
                  DNI
                </label>
                <input
                  id="guest-dni"
                  type="text"
                  inputMode="numeric"
                  value={guestDni}
                  onChange={(e) => setGuestDni(e.target.value.replace(/\D/g, "").slice(0, 8))}
                  placeholder="12345678"
                  maxLength={8}
                  className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>

              <div>
                <label htmlFor="guest-phone" className="text-xs font-semibold text-on-surface-variant mb-1 block">
                  Teléfono
                </label>
                <input
                  id="guest-phone"
                  type="tel"
                  inputMode="numeric"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value.replace(/\D/g, "").slice(0, 9))}
                  placeholder="985289689"
                  maxLength={9}
                  className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>

              <div>
                <label htmlFor="guest-email" className="text-xs font-semibold text-on-surface-variant mb-1 block">
                  Email
                </label>
                <input
                  id="guest-email"
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="tu@email.com"
                  className="w-full rounded-xl border border-outline-variant/40 bg-surface-container-lowest px-4 py-2.5 text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Botón confirmar guest */}
          <Button
            type="button"
            onClick={handleConfirmGuest}
            disabled={submitting}
            size="lg"
            className={cn("w-full", submitting && "opacity-70")}
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Agendando...
              </>
            ) : (
              <>
                <Icon name="event_available" size="sm" />
                Confirmar Cita
              </>
            )}
          </Button>

          {/* Link login opcional */}
          <div className="text-center">
            <button
              type="button"
              onClick={() => handleRedirectToAuth("login")}
              className="text-xs text-primary font-semibold hover:underline cursor-pointer"
            >
              ¿Ya tienes cuenta? Inicia sesión
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {/* Política de cancelación */}
          <div className="flex items-start gap-2 p-3 rounded-xl bg-surface-container text-xs text-on-surface-variant">
            <Icon name="info" size="sm" className="mt-0.5 flex-shrink-0" />
            <p>
              Puedes cancelar o reagendar tu cita hasta{" "}
              <strong>24 horas antes</strong> de la fecha programada.
              Cancelaciones tardías quedan registradas en tu historial.
            </p>
          </div>

          <Button
            onClick={handleConfirm}
            disabled={submitting}
            size="lg"
            className={cn("w-full", submitting && "opacity-70")}
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Agendando...
              </>
            ) : (
              <>
                <Icon name="event_available" size="sm" />
                Confirmar Cita
              </>
            )}
          </Button>
        </div>
      )}

      {/* Botón atrás */}
      <div className="flex justify-start">
        <Button type="button" variant="ghost" onClick={goBack}>
          <Icon name="arrow_back" size="sm" />
          Atrás
        </Button>
      </div>
    </div>
  );
}
