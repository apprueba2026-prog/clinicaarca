import { Icon } from "@/components/ui/icon";
import { StarRating } from "@/components/ui/star-rating";

interface TestimonialReelProps {
  name: string;
  quote: string;
  rating: number;
  imageUrl: string;
  imageAlt: string;
}

export function TestimonialReel({
  name,
  quote,
  rating,
  imageUrl,
  imageAlt,
}: TestimonialReelProps) {
  return (
    <div className="relative aspect-[9/16] rounded-3xl overflow-hidden group cursor-pointer shadow-lg">
      {/* Imagen de fondo */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        src={imageUrl}
        alt={imageAlt}
      />

      {/* Gradiente overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

      {/* Botón play */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-16 h-16 bg-white/30 backdrop-blur-md rounded-full flex items-center justify-center group-hover:scale-125 transition-transform">
          <Icon name="play_arrow" filled size="xl" className="text-white" />
        </div>
      </div>

      {/* Contenido inferior */}
      <div className="absolute bottom-6 left-6 right-6">
        <StarRating value={rating} className="mb-2" />
        <h4 className="text-white font-bold text-lg">{name}</h4>
        <p className="text-white/80 text-sm line-clamp-2">{quote}</p>
      </div>
    </div>
  );
}
