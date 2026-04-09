import type { Metadata } from "next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { SpecialtyCard } from "@/components/shared/specialty-card";
import { TestimonialReel } from "@/components/shared/testimonial-reel";
import { NewsCard } from "@/components/shared/news-card";
import { InsuranceLogos } from "@/components/shared/insurance-logos";
import Image from "next/image";
import Link from "next/link";

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
  },
  {
    icon: "dentistry",
    title: "Implantes",
    description:
      "Recupera tu sonrisa con tecnología de carga inmediata y materiales biocompatibles de alta gama.",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAJe-YHkVbcvgkBKOwwFXEeyMSGtOGLZUYGC2jCLmPTtJtk_YOMd__bJ9Dn_vFv_Z_0XBKE2vJv0UINuXsy7L_MV52ODpwtU93kR2n_ET5gUBywzjCO-vj7OPMwJuzpMnvCmjkiCZNdtcuVMJ_FJXHZAWqn2mXCf7bS9Vtx3Mmb5_F0WQpx1vvYMdw2Qq0ew7rqLLazN8lrvZ8DUOb9dMwWAF2dVErnwFbZr_OXtJYZy1V3C2jp6fcY0A3qBzBLnoGrwM_NuprZg0Q",
    imageAlt: "Prototipo de implante dental y escaneo digital 3D",
  },
  {
    icon: "medical_services",
    title: "Sedación Consciente",
    description:
      "Elimina la ansiedad por completo con nuestro equipo de anestesiología especializado.",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBnv9TCjja1q7r5HcP3P2xKgdkTT_L3iZ3dtvGTQeGTIpuB63ajCKnMYW7uxcVqYXlMEDbOmw94xYWngaWsDGxxCaQWbOLksz0JyDOsoxEYXXZ9MVMllZqeqhjO-OAPG78Flu2mZVt1DcgZp4wdim-fFZTglM88aqvuQ8a1bomPl9jfeRv_CSJtkRk6mTALBUYn_StVc5I95JlYbIvYSszZkIs5di_mNT7lQaOrbzgPc-3xN52uQ3C8HmHU_OqDSI5I97Diruqsmkk",
    imageAlt: "Paciente relajado durante procedimiento con sedación",
  },
];

const testimonials = [
  {
    name: "Carlos M.",
    quote:
      '"Increíble trato, no sentí absolutamente nada durante mi implante."',
    rating: 5,
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuDjZ9IjUkAC7A5Q7GD29dcXj6gbdIWOAzBsXsd7HfwJhmjk_0ui0xKzfm5sAOzIgBeuAOh4SBDptSJfdIPMap2T3QWaEMMcFThR5TEgaRkuXdJjmHP-PgZYYYFtjQNLzW3qTs9c3u-j43IEyPtyo1dLLjPquYkgRjYQLqvkB6EI4Zt0sr89NG8MCiaZigrH5BzHw7gGZecVljfhuKxZGgm6lk0hiEmgmvKcRTmaar-q0QNYhEnHNA326fBgva19UsgHV3G1G2WNLQk",
    imageAlt: "Hombre joven sonriendo mostrando su sonrisa perfecta",
  },
  {
    name: "Elena R.",
    quote: '"Mis hijos aman venir aquí. El área de niños es fantástica."',
    rating: 5,
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBCKSTwoG_YbfGFLREKcMyypn1d6MbOYl9xaPOsQ49QEUHAN8aKQmKvdkLfEtsdXaLZ8x1YXzQWzxExpRkN6IrXwaxA61NOo5vteqnonwnQGucJa_fGukDszpwUcWzdm99MZi3Q0i1bRjxjyNeVNBQl1dd8Gb4PgQn5iMVOdMhbTCT_bGkdCov2inQHkNHgeu2Ji5Jj_Z2EoEUNYpmJhB-Xc88pTXckAeh725s1Wq03hi_G26oSQ9S1GAcXw46VyzPin30SN3qc3T0",
    imageAlt: "Mujer profesional sonriendo después de un tratamiento estético",
  },
  {
    name: "Roberto F.",
    quote:
      '"La tecnología que usan es de otro nivel. Súper recomendado."',
    rating: 5,
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuCZICe4z22n5DmCVIoa3X1bT4JwkAmG3uqm9nFvp02m2bUmyYadTom0kxu69vF2ZiPnZbROaLZhVUlmMUDxGY4XRGgWJmCIQmb3Tv2f0-OHKuJ7qjT7GoOclUJNP191xTVCECfJuOzNCdxkb3_9aY6-X7LN86Whme_yUC8xy-9n9h110SDBpW3OyvMo_FBfdYYrFlE66J_XNamlRP63Cxfi4mEO8ZpYywpy2tyfCVLdzjXOOSmpA9c9PFD1k5Ra6sE-SLz5SVc30S4",
    imageAlt: "Hombre mayor riendo y mostrando sus dientes sanos",
  },
  {
    name: "Lucía S.",
    quote:
      '"La sedación fue la clave para perder mi miedo al dentista."',
    rating: 5,
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBNkZKyY3u5UqQrZqz3LO19NGUdPjUHoa5oyQfDIIOUD1XQca5S8lhdJU5p0V02MsUZTKDLOc_ECDyD1o1kXU2z76ySsXkUCtrBsJmLzUbH4l1JF13kCjMJl7RHr8gEYXEua9dzv0p_3HqOSztuFDIrOXgSoEv_aCbBcS9UrBEEgQbCV7_DEA4VoZ7evdqK3pV_xV0QzeySLrA34HzHmHIoeu_IiNbIjX-YI_Yz_Yu0W0WaNUQCcmQVqHXFIQQ-955zTdmyyIq2wb4",
    imageAlt: "Joven artista sonriendo mostrando sus resultados de ortodoncia",
  },
];

const news = [
  {
    category: "Innovación",
    title: "Inauguramos nuestra nueva unidad de escaneo 3D facial",
    excerpt:
      "Precisión milimétrica para cirugías maxilofaciales más seguras.",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuBLr9jVntVbJPKlBOX6fgm3HvuxlHp-O3m5DxGUlzTzgSRo4gRUR38WJKb7TRAdYSfHh-6YqHE1NdGfDEDy1vSgDrADFYBecrHQT67Mo7Ifo2MdJgZ8J92xx8SS1Ohh5CyykNzIeU5PZ5LVcF6Cor9oPI0D7_tH3ORcgXxslQ4JsKtUpsERDqGztZGI1TGbG2ciVaxMFj1pwiy2-WnK2YoKr3ZLaAXDaVpfYjaB1tba65WUdi6-uALS5kBpRLPsjxXRssr7jSkeBnk",
    imageAlt: "Dentista enseñando odontología digital con equipos avanzados",
  },
  {
    category: "Premios",
    title: "Reconocidos como clínica líder en excelencia médica 2024",
    excerpt:
      "Un logro compartido con toda nuestra comunidad de pacientes.",
    imageUrl:
      "https://lh3.googleusercontent.com/aida-public/AB6AXuAPa5R703_i_0-3ipN53zcNGb5yxcEk4cnLcBky3OA9XF759ghYjVUKy5uzBfWwxi7X68WSY6cG7Vd3Iy85d2L8zlzHsHpFWoaEBK0nUVgLebCkXhdAjMiq8n2xYR-ryVWPx-puqRplnjS3mhWMp-KPL8Xo5BF-VdQd2STFvtep7WQtipIs0dbfoQsBkrQS7q6eQWoX4Pj292Gl8fTyda9vRj37fJPG2OZB6eJeT-EYQw1wio9dteptZ-zktVEGKjkQR1leV8GNxJ0",
    imageAlt: "Placa de premio con logo de Clínica Arca",
  },
];

export default function HomePage() {
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
              <Button variant="primary" size="lg" className="shadow-xl shadow-primary/20 hover:scale-[1.02] transition-transform">
                Primera Consulta Gratis
              </Button>
              <Button variant="secondary" size="lg">
                Ver Instalaciones <Icon name="play_circle" />
              </Button>
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {testimonials.map((t) => (
              <TestimonialReel key={t.name} {...t} />
            ))}
          </div>
        </div>
      </section>

      {/* ========== NOTICIAS Y CONVENIOS ========== */}
      <section className="py-24 bg-surface-container-low">
        <div className="max-w-screen-2xl mx-auto px-8">
          <div className="grid lg:grid-cols-2 gap-16">
            {/* Noticias */}
            <div>
              <h2 className="text-3xl font-headline font-bold mb-8">
                Actualidad Clínica
              </h2>
              <div className="grid gap-6">
                {news.map((n) => (
                  <NewsCard key={n.title} {...n} />
                ))}
              </div>
            </div>

            {/* Convenios */}
            <div>
              <h2 className="text-3xl font-headline font-bold mb-8">
                Convenios y Aseguradoras
              </h2>
              <InsuranceLogos />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
