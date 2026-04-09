import Image from "next/image";

interface NewsCardProps {
  category: string;
  title: string;
  excerpt: string;
  imageUrl: string;
  imageAlt: string;
}

export function NewsCard({
  category,
  title,
  excerpt,
  imageUrl,
  imageAlt,
}: NewsCardProps) {
  return (
    <div className="flex gap-6 items-center bg-surface-container-lowest p-4 rounded-2xl hover:bg-white transition-all shadow-sm">
      <Image
        className="rounded-xl object-cover shrink-0"
        src={imageUrl}
        alt={imageAlt}
        width={128}
        height={128}
        loading="lazy"
      />
      <div>
        <span className="text-primary text-xs font-bold uppercase tracking-wider">
          {category}
        </span>
        <h4 className="font-headline font-bold text-lg mt-1">{title}</h4>
        <p className="text-sm text-on-surface-variant mt-2 line-clamp-1">
          {excerpt}
        </p>
      </div>
    </div>
  );
}
