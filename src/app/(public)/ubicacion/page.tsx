import type { Metadata } from "next";
import { Icon } from "@/components/ui/icon";
import { ContactActions } from "@/components/shared/contact-actions";

export const metadata: Metadata = {
  title: "Ubicación | Clínica Arca",
  description:
    "Visítanos en Av. Huarochirí Mz A14 - Lote 3, Santa Anita, Lima 15011, Perú. Atención de lunes a sábado. Agenda tu cita o chatea con nosotros 24/7.",
};

export default function UbicacionPage() {
  return (
    <main className="pt-12 pb-24 px-6 max-w-7xl mx-auto">
      {/* ========== HEADER ========== */}
      <header className="text-center mb-20">
        <h1 className="font-headline text-4xl md:text-6xl font-extrabold text-on-surface tracking-tight mb-6 max-w-4xl mx-auto">
          Estamos aquí para cuidar tu sonrisa.
        </h1>
        <p className="text-on-surface-variant text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
          Atención premium en el corazón de Santa Anita. Escríbenos 24/7 o
          visítanos en nuestra clínica.
        </p>
      </header>

      {/* ========== GRID PRINCIPAL ========== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
        {/* Columna Izquierda: Info Cards */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card: Ubicación */}
          <div className="bg-surface-container-lowest p-8 rounded-3xl shadow-[0_20px_40px_rgba(0,29,49,0.04)] transition-all hover:-translate-y-1">
            <div className="flex items-start gap-5">
              <div className="bg-tertiary-fixed p-3 rounded-xl">
                <Icon
                  name="location_on"
                  filled
                  className="text-tertiary-container"
                />
              </div>
              <div className="space-y-2">
                <h3 className="font-headline text-xl font-bold text-on-surface">
                  Nuestra Clínica
                </h3>
                <p className="text-on-surface-variant leading-relaxed">
                  Av. Huarochirí Mz A14 - Lote 3, Santa Anita, Lima 15011, Perú.
                </p>
                <a
                  className="inline-flex items-center gap-2 text-primary font-semibold hover:underline mt-2"
                  href="https://www.google.com/maps/place/X26W%2BF9G+Lima"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Abrir en Google Maps / Waze
                  <Icon name="open_in_new" size="sm" />
                </a>
              </div>
            </div>
          </div>

          {/* Card: Contacto */}
          <div className="bg-surface-container-lowest p-8 rounded-3xl shadow-[0_20px_40px_rgba(0,29,49,0.04)] transition-all hover:-translate-y-1">
            <div className="flex items-start gap-5">
              <div className="bg-primary-fixed p-3 rounded-xl">
                <Icon name="chat" filled className="text-primary" />
              </div>
              <div className="flex-1 space-y-4">
                <h3 className="font-headline text-xl font-bold text-on-surface">
                  Hablemos
                </h3>
                <ContactActions />
              </div>
            </div>
          </div>

          {/* Card: Horarios */}
          <div className="bg-surface-container-lowest p-8 rounded-3xl shadow-[0_20px_40px_rgba(0,29,49,0.04)] transition-all hover:-translate-y-1">
            <div className="flex items-start gap-5">
              <div className="bg-secondary-fixed p-3 rounded-xl">
                <Icon name="schedule" filled className="text-secondary" />
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <h3 className="font-headline text-xl font-bold text-on-surface">
                    Horario de Atención
                  </h3>
                  <span className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border border-emerald-200/50 dark:border-emerald-700/50">
                    Abierto Ahora
                  </span>
                </div>
                <p className="text-on-surface-variant font-medium">
                  Lunes a Sábado: 09:00 AM - 08:00 PM
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Columna Derecha: Mapa */}
        <div className="lg:col-span-7 h-[500px] lg:h-full min-h-[500px] relative group">
          <div className="absolute inset-0 bg-primary-fixed/20 rounded-3xl blur-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-700" />
          <div className="relative h-full w-full overflow-hidden rounded-3xl shadow-[0_30px_60px_rgba(0,29,49,0.08)] bg-surface-container-low border-8 border-surface-container-lowest">
            <iframe
              className="w-full h-full border-0 [filter:grayscale(0.2)_contrast(1.1)] dark:[filter:invert(90%)_hue-rotate(180deg)_brightness(0.9)_contrast(1.2)]"
              src="https://maps.google.com/maps?q=X26W%2BF9G+Lima+15011+Peru&t=&z=17&ie=UTF8&iwloc=&output=embed"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Ubicación de Clínica Arca en Google Maps"
              allowFullScreen
            />
          </div>
        </div>
      </div>
    </main>
  );
}
