import type { Metadata } from "next";
import Image from "next/image";

export const metadata: Metadata = {
  title: "Acceso | Clínica Arca",
  description: "Accede o crea tu cuenta en Clínica Arca.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen bg-surface dark:bg-slate-950">
      {/* Panel izquierdo — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative items-center justify-center bg-gradient-to-br from-[#004b73] via-[#006194] to-[#007bb9] dark:from-[#001d31] dark:via-[#003351] dark:to-[#004b73] overflow-hidden">
        {/* Patrón decorativo */}
        <div className="absolute inset-0 opacity-20 dark:opacity-30">
          <div className="absolute top-20 -left-10 w-72 h-72 rounded-full bg-white/20 blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-48 h-48 rounded-full bg-white/15 blur-2xl" />
        </div>

        <div className="relative z-10 text-center px-12 max-w-lg">
          <div className="flex justify-center mb-8">
            <Image
              src="/logo-nav.png"
              alt="Clínica Arca"
              width={167}
              height={96}
              className="h-24 w-auto [filter:brightness(1.3)_drop-shadow(0_0_8px_rgba(255,255,255,0.4))_drop-shadow(0_0_20px_rgba(255,255,255,0.15))] dark:[filter:brightness(1.8)_contrast(0.9)_saturate(1.2)_drop-shadow(0_0_4px_rgba(255,255,255,0.7))_drop-shadow(0_0_10px_rgba(230,245,255,0.5))_drop-shadow(0_0_24px_rgba(200,230,255,0.25))]"
              priority
            />
          </div>
          <h2 className="text-2xl font-headline font-bold text-white mb-4">
            Bienvenido a Clínica Arca
          </h2>
          <p className="text-white/70 text-sm leading-relaxed">
            Gestiona tus citas, revisa tu historial y mantente al día con tu salud dental.
          </p>
        </div>
      </div>

      {/* Panel derecho — Formulario */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-8">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  );
}
