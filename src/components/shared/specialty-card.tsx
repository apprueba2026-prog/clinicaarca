import Image from "next/image";
import Link from "next/link";
import { Icon } from "@/components/ui/icon";
import { Button } from "@/components/ui/button";

interface SpecialtyCardProps {
  icon: string;
  title: string;
  description: string;
  imageUrl: string;
  imageAlt: string;
  href?: string;
}

export function SpecialtyCard({
  icon,
  title,
  description,
  imageUrl,
  imageAlt,
  href,
}: SpecialtyCardProps) {
  return (
    <div className="group bg-surface-container-lowest p-8 rounded-3xl transition-all duration-300 hover:-translate-y-2 hover:shadow-xl">
      {/* Ícono */}
      <div className="w-14 h-14 bg-secondary-container text-secondary flex items-center justify-center rounded-2xl mb-6 group-hover:bg-primary group-hover:text-white transition-colors">
        <Icon name={icon} size="lg" />
      </div>

      {/* Contenido */}
      <h3 className="text-2xl font-headline font-bold mb-3">{title}</h3>
      <p className="text-on-surface-variant mb-6 leading-relaxed">
        {description}
      </p>

      {/* Imagen */}
      <div className="h-48 rounded-2xl overflow-hidden mb-6 relative">
        <Image
          className="object-cover"
          src={imageUrl}
          alt={imageAlt}
          fill
          sizes="(max-width: 768px) 100vw, 33vw"
          loading="lazy"
        />
      </div>

      {/* Botón */}
      {href ? (
        <Link href={href} className="block">
          <Button variant="outline" tabIndex={-1} className="w-full py-3">
            Saber más
          </Button>
        </Link>
      ) : (
        <Button variant="outline" className="w-full py-3">
          Saber más
        </Button>
      )}
    </div>
  );
}
