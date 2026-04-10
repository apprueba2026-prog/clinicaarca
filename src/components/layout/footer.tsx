import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";

const services = [
  { label: "Odontopediatría", href: "/especialidades#odontopediatria" },
  { label: "Implantes Dentales", href: "/especialidades#implantes" },
  { label: "Anestesiología", href: "/especialidades#anestesiologia" },
  { label: "Odontología General", href: "/especialidades#odontologia-general" },
];

const quickLinks = [
  { label: "Inicio", href: "/" },
  { label: "Especialidades", href: "/especialidades" },
  { label: "Ubicación", href: "/ubicacion" },
];

export function Footer() {
  return (
    <footer className="bg-surface-container-highest py-20 border-t border-surface-variant">
      <div className="max-w-screen-2xl mx-auto px-8 grid md:grid-cols-4 gap-12">
        {/* Logo y descripción */}
        <div className="col-span-2">
          <div className="text-3xl font-bold tracking-tighter text-sky-900 mb-6">
            Clínica Arca
          </div>
          <p className="text-on-surface-variant max-w-sm mb-8 leading-relaxed">
            Excelencia odontológica basada en tecnología, transparencia y trato
            humano. Tu sonrisa es nuestro mayor compromiso.
          </p>
          <div className="flex gap-4">
            <Link
              href="#"
              className="w-10 h-10 bg-surface-container-high rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
            >
              <Icon name="public" size="sm" />
            </Link>
            <Link
              href="#"
              className="w-10 h-10 bg-surface-container-high rounded-full flex items-center justify-center hover:bg-primary hover:text-white transition-colors"
            >
              <Icon name="alternate_email" size="sm" />
            </Link>
          </div>
        </div>

        {/* Servicios */}
        <div>
          <h5 className="font-bold mb-6 text-on-surface">Servicios</h5>
          <ul className="space-y-4 text-on-surface-variant">
            {services.map((s) => (
              <li key={s.label}>
                <Link
                  href={s.href}
                  className="hover:text-primary transition-colors"
                >
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contacto */}
        <div>
          <h5 className="font-bold mb-6 text-on-surface">Contacto</h5>
          <p className="text-on-surface-variant mb-4 flex items-center gap-2">
            <Icon name="location_on" className="text-primary" /> Av. Huarochirí
            Mz A14 - Lote 3, Santa Anita, Lima 15011
          </p>
          <p className="text-on-surface-variant mb-4 flex items-center gap-2">
            <Icon name="call" className="text-primary" />
            <a href="tel:+51985289689" className="hover:text-primary transition-colors">
              +51 985 289 689
            </a>
          </p>
          <Link href="/ubicacion">
            <Button variant="primary" className="mt-4 w-full" tabIndex={-1}>
              Ver Ubicación
            </Button>
          </Link>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="max-w-screen-2xl mx-auto px-8 mt-20 pt-8 border-t border-surface-variant flex flex-col md:flex-row justify-between gap-6 text-sm text-on-surface-variant">
        <p>© 2024 Clínica Arca. Todos los derechos reservados.</p>
        <div className="flex gap-8">
          <Link href="#" className="hover:underline">
            Políticas de Privacidad
          </Link>
          <Link href="#" className="hover:underline">
            Términos de Servicio
          </Link>
        </div>
      </div>
    </footer>
  );
}
