import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";

export const metadata: Metadata = {
  title: "Especialidades | Clínica Arca",
  description:
    "Conoce nuestras especialidades: Odontopediatría, Implantes, Anestesiología y Odontología General. Excelencia clínica en cada tratamiento.",
};

export default function EspecialidadesPage() {
  return (
    <>
      {/* ========== HEADER EDITORIAL ========== */}
      <header className="py-24 lg:py-32 px-8 md:px-20 max-w-7xl mx-auto flex flex-col gap-8">
        <Badge variant="primary" className="w-fit text-xs tracking-[0.2em]">
          Excelencia Clínica
        </Badge>
        <h1 className="font-headline text-5xl md:text-8xl font-extrabold tracking-tighter text-on-surface leading-[0.9]">
          Nuestras <br />
          <span className="text-outline-variant">Especialidades.</span>
        </h1>
        <p className="max-w-xl text-lg md:text-xl text-on-surface-variant leading-relaxed">
          Combinamos precisión quirúrgica con una sensibilidad artística para
          transformar la salud bucal en una experiencia de bienestar integral.
        </p>
      </header>

      {/* ========== SECCIÓN 1: ODONTOPEDIATRÍA ========== */}
      <section id="odontopediatria" className="scroll-mt-24 bg-surface-container-low dark:bg-surface-container-low/50 overflow-hidden">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center">
          {/* Texto */}
          <div className="w-full md:w-1/2 py-16 lg:py-24 px-8 md:px-20">
            <div className="flex flex-col gap-6">
              <div className="w-12 h-1 bg-tertiary-container mb-4" />
              <h2 className="font-headline text-4xl md:text-6xl font-bold text-on-surface">
                Odontopediatría
              </h2>
              <p className="text-on-surface-variant text-lg leading-relaxed">
                Cuidado especializado para los más pequeños en un entorno
                diseñado para la calma. Transformamos el miedo en curiosidad a
                través de técnicas de refuerzo positivo y espacios lúdicos.
              </p>
              <div className="mt-4 flex gap-4 items-center">
                <span className="w-10 h-10 rounded-full bg-tertiary-fixed flex items-center justify-center">
                  <Icon name="child_care" filled className="text-tertiary" />
                </span>
                <span className="font-medium text-tertiary">
                  Enfoque Preventivo &amp; Lúdico
                </span>
              </div>
              <button className="w-fit mt-8 border-b-2 border-primary text-primary font-bold py-2 hover:translate-x-2 transition-transform">
                Ver tratamiento
              </button>
            </div>
          </div>
          {/* Imagen */}
          <div className="w-full md:w-1/2 h-[400px] md:h-[700px] relative overflow-hidden group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <Image
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuA6wemSKYnCYKXzzocoSSuwdzzqgcoGvtcMquxmXwGeafmMDinesxJapKULzRUWjue54dKi8Yl7byuc56GnXcJOgaZRVYQ8HZ5dVLRp5vXDKXA_8t7DLiD39-G2VYbnu48OCJ1YTLLaHY8mEuhtDiQoBToHzMp8tp7shRTAYhROUrtRsRIS2qJuLoNZVgRIq2Xc3JYXmwGX8qhRW9lZ2WpOKg9EDwdf11uAe_kHS8XCXXfv4uuahanR583h0-P1qfEkqmwNIjOCv5A"
              alt="Consultorio pediátrico con dentista atendiendo niño"
            />
            <div className="absolute inset-0 bg-tertiary/10 mix-blend-overlay" />
          </div>
        </div>
      </section>

      {/* ========== SECCIÓN 2: IMPLANTES ========== */}
      <section id="implantes" className="scroll-mt-24 bg-surface overflow-hidden">
        <div className="max-w-[1400px] mx-auto flex flex-col-reverse md:flex-row items-center">
          {/* Imagen */}
          <div className="w-full md:w-1/2 h-[400px] md:h-[700px] relative overflow-hidden group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <Image
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              src="/implantes-clinica-arca.webp"
              alt="Equipo de Clínica Arca durante procedimiento de implantes dentales"
            />
            <div className="absolute inset-0 bg-primary/15 mix-blend-multiply" />
          </div>
          {/* Texto */}
          <div className="w-full md:w-1/2 py-16 lg:py-24 px-8 md:px-20">
            <div className="flex flex-col gap-6 md:pl-12">
              <div className="w-12 h-1 bg-primary mb-4" />
              <h2 className="font-headline text-4xl md:text-6xl font-bold text-on-surface">
                Implantes
              </h2>
              <p className="text-on-surface-variant text-lg leading-relaxed">
                Restauramos la función y la estética con tecnología de
                vanguardia. Carga inmediata y materiales biocompatibles de grado
                aeroespacial para resultados que duran toda la vida.
              </p>
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3 text-on-surface-variant">
                  <Icon name="biotech" className="text-primary" />
                  <span>Cirugía guiada por ordenador</span>
                </div>
                <div className="flex items-center gap-3 text-on-surface-variant">
                  <Icon name="verified" className="text-primary" />
                  <span>Garantía de oseointegración</span>
                </div>
              </div>
              <Link href="/agendar-cita" className="w-fit mt-8">
                <Button
                  variant="primary"
                  size="lg"
                  tabIndex={-1}
                  className="shadow-lg hover:shadow-primary/20"
                >
                  Consulta Diagnóstica
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========== SECCIÓN 3: ANESTESIOLOGÍA ========== */}
      <section id="anestesiologia" className="scroll-mt-24 bg-surface-container-highest/30 overflow-hidden">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row items-center">
          {/* Texto */}
          <div className="w-full md:w-1/2 py-16 lg:py-24 px-8 md:px-20">
            <div className="flex flex-col gap-6">
              <div className="w-12 h-1 bg-outline mb-4" />
              <h2 className="font-headline text-4xl md:text-6xl font-bold text-on-surface">
                Anestesiología
              </h2>
              <p className="text-on-surface-variant text-lg leading-relaxed">
                Seguridad absoluta en cada intervención. Contamos con
                anestesiólogos certificados para procedimientos bajo sedación
                consciente, garantizando cero dolor y máxima tranquilidad.
              </p>
              <div className="p-6 bg-surface-container-lowest rounded-xl border-l-4 border-outline flex flex-col gap-2">
                <p className="text-sm font-bold uppercase tracking-widest text-outline">
                  Protocolo Arca
                </p>
                <p className="italic text-on-surface-variant">
                  &ldquo;La ausencia de dolor no es un lujo, es nuestro estándar
                  clínico.&rdquo;
                </p>
              </div>
              <button className="w-fit mt-8 border-b-2 border-outline text-on-surface font-bold py-2 hover:translate-x-2 transition-transform">
                Más información
              </button>
            </div>
          </div>
          {/* Imagen */}
          <div className="w-full md:w-1/2 h-[400px] md:h-[700px] relative overflow-hidden group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <Image
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuD6Qkgt1nNUa__I9KgaetZxnfUMXujhWfDkdgoNnLuROVawU2QpFMfiGzCeEx7H9F2tYeAoGsm5HaOI8cRtiHJ6yRO6CnlbUzFNheesRwPjdyWz84vJhlZM88MCqrU3qNl6COvMbh_2kRlFu3PCyvpMYAdofNDEij1z0l-cXgL3LRFcHIwsNojnXUYskw7UT0AQXqo04ML4QgsIWH3FAIep-WzX4Ebh31bHraeivIgAB2cuJfNA5_jx-fEBK4a9Man56od1KfkooGg"
              alt="Procedimiento de anestesiología dental segura"
            />
            <div className="absolute inset-0 bg-slate-900/20 mix-blend-overlay" />
          </div>
        </div>
      </section>

      {/* ========== SECCIÓN 4: ODONTOLOGÍA GENERAL ========== */}
      <section id="odontologia-general" className="scroll-mt-24 bg-surface overflow-hidden">
        <div className="max-w-[1400px] mx-auto flex flex-col-reverse md:flex-row items-center">
          {/* Imagen */}
          <div className="w-full md:w-1/2 h-[400px] md:h-[700px] relative overflow-hidden group">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <Image
              fill
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              src="/odontologia-general-clinica-arca.webp"
              alt="Doctora de Clínica Arca revisando historial digital del paciente en consultorio"
            />
            <div className="absolute inset-0 bg-primary-container/10 mix-blend-soft-light" />
          </div>
          {/* Texto */}
          <div className="w-full md:w-1/2 py-16 lg:py-24 px-8 md:px-20">
            <div className="flex flex-col gap-6 md:pl-12">
              <div className="w-12 h-1 bg-primary-container mb-4" />
              <h2 className="font-headline text-4xl md:text-6xl font-bold text-on-surface">
                Odontología General
              </h2>
              <p className="text-on-surface-variant text-lg leading-relaxed">
                Desde limpiezas profundas hasta restauraciones estéticas. Nuestro
                equipo de medicina dental general se enfoca en la prevención y el
                mantenimiento de una sonrisa radiante y funcional.
              </p>
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="p-4 bg-surface-container-low rounded-lg text-center">
                  <p className="font-bold text-2xl text-primary">98%</p>
                  <p className="text-xs uppercase tracking-tighter text-on-surface-variant">
                    Satisfacción
                  </p>
                </div>
                <div className="p-4 bg-surface-container-low rounded-lg text-center">
                  <p className="font-bold text-2xl text-primary">+15</p>
                  <p className="text-xs uppercase tracking-tighter text-on-surface-variant">
                    Años Experiencia
                  </p>
                </div>
              </div>
              <Link href="/agendar-cita" className="w-fit mt-8">
                <Button
                  variant="primary"
                  size="lg"
                  tabIndex={-1}
                  className="bg-primary-container shadow-lg hover:shadow-primary-container/20"
                >
                  Reserva Tu Revisión
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
