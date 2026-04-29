import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { SpecialtyCard } from "@/components/shared/specialty-card";
import { TestimonialCarousel } from "@/components/shared/testimonial-carousel";
import { ComingSoonCard } from "@/components/shared/coming-soon-card";
import { getPublicTestimonials } from "@/lib/services/testimonials.server";
import Image from "next/image";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Inicio — Especialistas en Odontología",
  description:
    "Clínica Arca: Centro odontológico en Perú con especialistas en ortodoncia, implantes, odontopediatría y más. Agenda tu cita hoy.",
};

const specialties = [
  {
    icon: "child_care",
    title: "Odontopediatría",
    description:
      "Creamos experiencias positivas para los más pequeños en un ambiente lúdico y seguro.",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuA6wemSKYnCYKXzzocoSSuwdzzqgcoGvtcMquxmXwGeafmMDinesxJapKULzRUWjue54dKi8Yl7byuc56GnXcJOgaZRVYQ8HZ5dVLRp5vXDKXA_8t7DLiD39-G2VYbnu48OCJ1YTLLaHY8mEuhtDiQoBToHzMp8tp7shRTAYhROUrtRsRIS2qJuLoNZVgRIq2Xc3JYXmwGX8qhRW9lZ2WpOKg9EDwdf11uAe_kHS8XCXXfv4uuahanR583h0-P1qfEkqmwNIjOCv5A",
    imageAlt: "Dentista atendiendo a niño en consultorio pediátrico moderno",
    href: "/especialidades#odontopediatria",
  },
  {
    icon: "dentistry",
    title: "Periodoncia e Implantes",
    description:
      "Recupera tu sonrisa con tecnología de carga inmediata y mediata con materiales biocompatibles de alta gama.",
    imageUrl: "/periodoncia-implantes-clinica-arca.webp",
    imageAlt:
      "Pantalla de diagnóstico avanzado 3D mostrando planificación de implantes y evaluación periodontal en Clínica Arca",
    href: "/especialidades#implantes",
  },
  {
    icon: "medical_services",
    title: "Odontología General",
    description:
      "Desde limpiezas profundas hasta restauraciones estéticas. Prevención y mantenimiento de una sonrisa radiante y funcional.",
    imageUrl: "/odontologia-general-clinica-arca.webp",
    imageAlt:
      "Doctora de Clínica Arca revisando historial digital del paciente en consultorio",
    href: "/especialidades#odontologia-general",
  },
];

export default async function HomePage() {
  const testimonials = await getPublicTestimonials();

  return (
    <>
      {/* ========== HERO SECTION ========== */}
      <section className="relative py-24 lg:py-32 overflow-hidden">
        <div className="max-w-screen-2xl mx-auto px-8 grid lg:grid-cols-2 gap-16 items-center">
          <div className="z-10">
            <Badge variant="primary" className="mb-6 text-sm tracking-widest">
              Tecnología de Punta
            </Badge>
            <h1 className="text-5xl lg:text-7xl font-headline font-extrabold tracking-tighter text-on-surface leading-[1.1] mb-8">
              Odontología de Vanguardia.{" "}
              <span className="text-primary italic">Sin dolor</span>, con
              precisión absoluta
            </h1>
            <p className="text-xl text-on-surface-variant max-w-xl mb-10 leading-relaxed">
              Redefinimos la experiencia dental combinando calidez humana con
              tecnología robótica y sedación consciente para tu total
              tranquilidad.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/agendar-cita">
                <Button variant="primary" size="lg" tabIndex={-1} className="shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform">
                  Reserve su cita YA
                </Button>
              </Link>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative">
            <div className="absolute -top-12 -right-12 w-64 h-64 bg-tertiary-fixed rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
            <div className="absolute -bottom-8 -left-8 w-72 h-72 bg-secondary-fixed rounded-full mix-blend-multiply filter blur-3xl opacity-30" />
            <div className="relative rounded-3xl overflow-hidden shadow-2xl border-8 border-white dark:border-slate-800 h-[500px]">
              <Image
                className="object-cover"
                src="/hero-doctora-sonia.webp"
                alt="Doctora Sonia, especialista de Clínica Arca"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                priority
              />
            </div>
          </div>
        </div>
      </section>

      {/* ========== ESPECIALIDADES ========== */}
      <section className="py-24 bg-surface-container-low">
        <div className="max-w-screen-2xl mx-auto px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
            <div className="max-w-2xl">
              <h2 className="text-4xl font-headline font-bold mb-4 tracking-tight">
                Especialidades Avanzadas
              </h2>
              <p className="text-on-surface-variant text-lg">
                Tratamientos diseñados bajo estándares internacionales de
                excelencia y bioseguridad.
              </p>
            </div>
            <Link
              href="/especialidades"
              className="text-primary font-bold flex items-center gap-2 hover:underline"
            >
              Ver todas las especialidades{" "}
              <Icon name="arrow_forward" />
            </Link>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {specialties.map((s) => (
              <SpecialtyCard key={s.title} {...s} />
            ))}
          </div>
        </div>
      </section>

      {/* ========== TESTIMONIOS ========== */}
      <section className="py-24 bg-surface">
        <div className="max-w-screen-2xl mx-auto px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-headline font-bold mb-4">
              Experiencias Reales
            </h2>
            <p className="text-on-surface-variant max-w-xl mx-auto">
              Más de 5,000 pacientes han transformado su vida con nosotros.
              Escucha sus historias.
            </p>
          </div>

          <TestimonialCarousel items={testimonials} />
        </div>
      </section>

      {/* ========== NOTICIAS Y CONVENIOS ========== */}
      <section className="py-24 bg-surface-container-low">
        <div className="max-w-screen-2xl mx-auto px-8">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Actualidad */}
            <div>
              <h2 className="text-3xl font-headline font-bold mb-8">
                Actualidad Clínica
              </h2>
              <ComingSoonCard
                icon="newspaper"
                title="Próximamente"
                description="Pronto compartiremos noticias, hitos y novedades de la clínica."
                variant="wide"
              />
            </div>

            {/* Convenios */}
            <div>
              <h2 className="text-3xl font-headline font-bold mb-8">
                Convenios y Aseguradoras
              </h2>
              <ComingSoonCard
                icon="handshake"
                title="Próximamente"
                description="Trabajamos en alianzas con las principales aseguradoras del país. Pronto verás aquí los convenios disponibles."
                variant="wide"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
