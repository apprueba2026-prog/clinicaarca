import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = {
  title: "Aviso Legal | Clínica Arca",
  description:
    "Política de Privacidad y Términos de Servicio de Clínica Arca. Tratamiento de datos personales conforme a la Ley N° 29733 del Perú.",
  robots: { index: true, follow: true },
};

const LAST_UPDATE = "26 de abril de 2026";

const TOC = [
  { id: "privacidad", label: "Política de Privacidad" },
  { id: "terminos", label: "Términos de Servicio" },
];

export default function LegalPage() {
  return (
    <main className="bg-surface">
      {/* ===== HEADER ===== */}
      <header className="py-20 lg:py-28 px-8 max-w-3xl mx-auto">
        <Badge variant="primary" className="w-fit text-xs tracking-[0.2em] mb-6">
          Aviso Legal
        </Badge>
        <h1 className="font-headline text-4xl md:text-6xl font-extrabold tracking-tighter text-on-surface leading-[1.05] mb-6">
          Privacidad y Términos
        </h1>
        <p className="text-on-surface-variant text-lg leading-relaxed mb-8">
          Información esencial sobre el uso de este sitio y el tratamiento de
          tus datos personales conforme a la normativa peruana vigente.
        </p>
        <p className="text-sm text-on-surface-variant">
          Última actualización: <strong>{LAST_UPDATE}</strong>
        </p>

        {/* Tabla de contenidos */}
        <nav
          aria-label="Índice"
          className="mt-10 flex flex-wrap gap-3"
        >
          {TOC.map((item) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              className="px-4 py-2 rounded-full text-sm bg-surface-container-low text-on-surface hover:bg-primary hover:text-on-primary transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </header>

      {/* ===== PRIVACIDAD ===== */}
      <section
        id="privacidad"
        className="scroll-mt-24 py-16 px-8 bg-surface-container-low"
      >
        <div className="max-w-3xl mx-auto">
          <div className="w-12 h-1 bg-primary mb-6" />
          <h2 className="font-headline text-3xl md:text-4xl font-bold text-on-surface mb-8">
            Política de Privacidad
          </h2>

          <div className="space-y-8 text-on-surface-variant leading-relaxed">
            <Block title="1. Identidad del responsable">
              <p>
                <strong>Clínica Arca</strong>, con domicilio en Av. Huarochirí
                Mz A14 - Lote 3, Santa Anita, Lima 15011, Perú, es responsable
                del tratamiento de los datos personales recolectados a través
                de este sitio web.
              </p>
              <p>
                Contacto para asuntos de privacidad:{" "}
                <a
                  href="mailto:contacto@clinicaarca.pe"
                  className="text-primary hover:underline"
                >
                  contacto@clinicaarca.pe
                </a>{" "}
                · Teléfono:{" "}
                <a
                  href="tel:+51985289689"
                  className="text-primary hover:underline"
                >
                  +51 985 289 689
                </a>
                .
              </p>
            </Block>

            <Block title="2. Datos que recolectamos">
              <p>
                A través del formulario de agenda de citas y canales de
                contacto recolectamos: nombres y apellidos, documento de
                identidad, teléfono, correo electrónico, motivo de consulta y,
                cuando corresponde, información clínica relevante.
              </p>
              <p>
                Los datos clínicos son <strong>datos sensibles</strong> en los
                términos de la Ley N° 29733. Su tratamiento requiere tu
                consentimiento expreso, otorgado al enviar el formulario o al
                iniciar atención presencial.
              </p>
            </Block>

            <Block title="3. Finalidad del tratamiento">
              <ul className="list-disc pl-6 space-y-2">
                <li>Gestionar reservas y agenda de citas.</li>
                <li>Brindar atención clínica y elaborar la historia clínica.</li>
                <li>
                  Enviar recordatorios de cita e información sobre el
                  tratamiento contratado.
                </li>
                <li>
                  Cumplir obligaciones legales, contables y sanitarias
                  aplicables.
                </li>
              </ul>
              <p>
                No utilizamos tus datos para fines comerciales no relacionados
                ni los compartimos con terceros para publicidad.
              </p>
            </Block>

            <Block title="4. Conservación">
              <p>
                Los datos clínicos se conservan por el plazo legal aplicable a
                las historias clínicas (artículo 29 de la Ley N° 26842 - Ley
                General de Salud y normas conexas). Los demás datos se
                conservan únicamente mientras dure la relación o mientras sea
                necesario para cumplir las finalidades descritas.
              </p>
            </Block>

            <Block title="5. Destinatarios">
              <p>
                Solo el personal autorizado de la clínica accede a tus datos.
                Podemos compartir información estrictamente necesaria con
                proveedores tecnológicos contratados (alojamiento, mensajería,
                pasarelas de pago), bajo cláusulas de confidencialidad. No
                realizamos transferencias internacionales más allá de lo que
                estos servicios técnicos requieran.
              </p>
            </Block>

            <Block title="6. Tus derechos (ARCO+I)">
              <p>
                Conforme a la Ley N° 29733 puedes ejercer en cualquier
                momento los derechos de:
              </p>
              <ul className="list-disc pl-6 space-y-1">
                <li>
                  <strong>Acceso</strong> — saber qué datos tenemos sobre ti.
                </li>
                <li>
                  <strong>Rectificación</strong> — corregir datos inexactos.
                </li>
                <li>
                  <strong>Cancelación</strong> — solicitar su supresión, salvo
                  obligación legal de conservar.
                </li>
                <li>
                  <strong>Oposición</strong> — oponerte a usos específicos.
                </li>
                <li>
                  <strong>Información</strong> — ser informado sobre el
                  tratamiento.
                </li>
              </ul>
              <p>
                Para ejercerlos escribe a{" "}
                <a
                  href="mailto:contacto@clinicaarca.pe"
                  className="text-primary hover:underline"
                >
                  contacto@clinicaarca.pe
                </a>{" "}
                adjuntando copia de tu documento de identidad. Si consideras
                que tus derechos no son atendidos, puedes presentar reclamo
                ante la <strong>Autoridad Nacional de Protección de Datos
                Personales</strong> (MINJUS).
              </p>
            </Block>

            <Block title="7. Medidas de seguridad">
              <p>
                Aplicamos medidas técnicas y organizativas razonables para
                proteger tus datos: control de accesos, cifrado en tránsito,
                copias de respaldo y políticas internas de confidencialidad.
              </p>
            </Block>

            <Block title="8. Cookies">
              <p>
                Este sitio utiliza cookies estrictamente necesarias para su
                funcionamiento y, eventualmente, cookies analíticas anónimas
                para mejorar la experiencia. Puedes desactivarlas desde tu
                navegador.
              </p>
            </Block>
          </div>
        </div>
      </section>

      {/* ===== TÉRMINOS ===== */}
      <section id="terminos" className="scroll-mt-24 py-16 px-8 bg-surface">
        <div className="max-w-3xl mx-auto">
          <div className="w-12 h-1 bg-primary mb-6" />
          <h2 className="font-headline text-3xl md:text-4xl font-bold text-on-surface mb-8">
            Términos de Servicio
          </h2>

          <div className="space-y-8 text-on-surface-variant leading-relaxed">
            <Block title="1. Aceptación">
              <p>
                Al utilizar este sitio web aceptas los presentes Términos de
                Servicio. Si no estás de acuerdo, te pedimos no continuar
                navegando.
              </p>
            </Block>

            <Block title="2. Objeto del sitio">
              <p>
                Este portal tiene fines informativos y permite agendar citas
                con la clínica. La información publicada es de carácter general
                y <strong>no sustituye una consulta médica</strong>: cualquier
                diagnóstico o tratamiento debe realizarse de forma presencial
                con un profesional autorizado.
              </p>
            </Block>

            <Block title="3. Uso aceptable">
              <p>
                Te comprometes a usar el sitio de buena fe, sin suplantar
                identidades, sin extraer información de forma masiva
                (scraping), sin intentar vulnerar la seguridad y sin cargar
                contenidos ilícitos u ofensivos.
              </p>
            </Block>

            <Block title="4. Propiedad intelectual">
              <p>
                Los textos, imágenes, marcas, logotipos y demás elementos del
                sitio pertenecen a Clínica Arca o a sus licenciantes. Queda
                prohibida su reproducción sin autorización previa por escrito.
              </p>
            </Block>

            <Block title="5. Limitación de responsabilidad">
              <p>
                Procuramos que el sitio funcione correctamente y la información
                sea exacta. Sin embargo, no garantizamos disponibilidad
                ininterrumpida ni la ausencia total de errores. No nos
                responsabilizamos por daños derivados del uso indebido del
                sitio o de decisiones clínicas tomadas únicamente con la
                información publicada.
              </p>
            </Block>

            <Block title="6. Enlaces a terceros">
              <p>
                El sitio puede contener enlaces a páginas externas. No
                controlamos su contenido ni respondemos por sus prácticas de
                privacidad.
              </p>
            </Block>

            <Block title="7. Modificaciones">
              <p>
                Podemos actualizar estos Términos en cualquier momento. La
                versión vigente será la publicada en esta página, indicando la
                fecha de última actualización.
              </p>
            </Block>

            <Block title="8. Ley aplicable y jurisdicción">
              <p>
                Estos Términos se rigen por las leyes de la República del
                Perú. Cualquier controversia se someterá a los jueces y
                tribunales de la ciudad de Lima.
              </p>
            </Block>

            <Block title="9. Contacto">
              <p>
                Para consultas escribe a{" "}
                <a
                  href="mailto:contacto@clinicaarca.pe"
                  className="text-primary hover:underline"
                >
                  contacto@clinicaarca.pe
                </a>{" "}
                o visita la sección{" "}
                <Link href="/ubicacion" className="text-primary hover:underline">
                  Ubicación
                </Link>
                .
              </p>
            </Block>
          </div>

          <p className="mt-16 text-sm text-on-surface-variant italic">
            Documento informativo de carácter general. En caso de divergencia
            con la normativa peruana vigente, prevalecerá lo dispuesto por la
            ley.
          </p>
        </div>
      </section>
    </main>
  );
}

function Block({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <article className="space-y-3">
      <h3 className="font-headline text-xl font-bold text-on-surface">
        {title}
      </h3>
      {children}
    </article>
  );
}
