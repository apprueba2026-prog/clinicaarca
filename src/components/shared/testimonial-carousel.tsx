"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Icon } from "@/components/ui/icon";
import { StarRating } from "@/components/ui/star-rating";
import { cn } from "@/lib/utils/cn";
import type { Testimonial } from "@/lib/types/testimonial";

interface TestimonialCarouselProps {
  items: Testimonial[];
}

const SWIPE_THRESHOLD = 60;

/**
 * Placeholder visual para cuando no hay thumbnail_url.
 * Muestra un gradiente atractivo con ícono de video
 * para evitar que se vea un bloque negro.
 */
function ThumbnailPlaceholder() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-primary/80 via-primary-container/70 to-tertiary/60">
      {/* Decorative blurred circles */}
      <div className="absolute top-1/4 left-1/4 w-32 h-32 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute bottom-1/3 right-1/4 w-40 h-40 rounded-full bg-white/8 blur-3xl" />
      {/* Top label — positioned above center to avoid play button overlay */}
      <div className="absolute top-[15%] left-0 right-0 flex flex-col items-center">
        <span className="w-14 h-14 rounded-full bg-white/15 backdrop-blur-sm flex items-center justify-center mb-3">
          <Icon name="videocam" size="lg" className="text-white/80" />
        </span>
        <p className="text-white/60 text-xs font-medium tracking-widest uppercase">
          Testimonio
        </p>
      </div>
    </div>
  );
}

export function TestimonialCarousel({ items }: TestimonialCarouselProps) {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState<Set<number>>(() => new Set());
  const trackRef = useRef<HTMLDivElement>(null);
  const pointerStart = useRef<{ x: number; y: number } | null>(null);

  const total = items.length;
  const goTo = useCallback(
    (index: number) => {
      if (total === 0) return;
      const next = (index + total) % total;
      setActive(next);
      setPlaying(new Set());
    },
    [total]
  );

  const next = useCallback(() => goTo(active + 1), [active, goTo]);
  const prev = useCallback(() => goTo(active - 1), [active, goTo]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "ArrowRight") next();
      else if (e.key === "ArrowLeft") prev();
    }
    const node = trackRef.current;
    if (!node) return;
    node.addEventListener("keydown", onKey);
    return () => node.removeEventListener("keydown", onKey);
  }, [next, prev]);

  function onPointerDown(e: React.PointerEvent) {
    pointerStart.current = { x: e.clientX, y: e.clientY };
  }
  function onPointerUp(e: React.PointerEvent) {
    if (!pointerStart.current) return;
    const dx = e.clientX - pointerStart.current.x;
    const dy = e.clientY - pointerStart.current.y;
    pointerStart.current = null;
    if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) next();
      else prev();
    }
  }

  function handlePlay(index: number) {
    setPlaying((prev) => {
      const copy = new Set(prev);
      copy.add(index);
      return copy;
    });
  }

  if (total === 0) {
    return (
      <div className="rounded-3xl border-2 border-dashed border-outline-variant bg-surface-container-lowest/60 py-20 px-8 text-center max-w-md mx-auto">
        <span className="w-14 h-14 rounded-2xl bg-secondary-container/40 text-secondary inline-flex items-center justify-center mb-4">
          <Icon name="play_circle" size="lg" />
        </span>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-2">
          Próximamente
        </p>
        <p className="text-on-surface-variant leading-relaxed">
          Estamos preparando los testimonios de nuestros pacientes.
        </p>
      </div>
    );
  }

  return (
    <div
      role="region"
      aria-roledescription="carousel"
      aria-label="Testimonios de pacientes"
      className="relative w-full max-w-[300px] sm:max-w-[340px] md:max-w-sm lg:max-w-md mx-auto select-none"
    >
      <div
        ref={trackRef}
        tabIndex={0}
        className="relative aspect-[9/16] rounded-3xl overflow-hidden shadow-2xl outline-none focus-visible:ring-2 focus-visible:ring-primary"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
      >
        <div
          className="flex h-full transition-transform duration-500 ease-out"
          style={{ transform: `translateX(-${active * 100}%)` }}
        >
          {items.map((t, idx) => {
            const isActive = idx === active;
            const isNeighbor = Math.abs(idx - active) <= 1;
            const isPlaying = playing.has(idx);

            return (
              <div
                key={t.id}
                role="group"
                aria-roledescription="slide"
                aria-label={`${idx + 1} de ${total}`}
                aria-hidden={!isActive}
                className="relative shrink-0 w-full h-full"
              >
                {!isPlaying ? (
                  t.thumbnail_url ? (
                    <Image
                      src={t.thumbnail_url}
                      alt={`Miniatura del testimonio de ${t.patient_name}`}
                      fill
                      sizes="(max-width: 640px) 300px, (max-width: 768px) 340px, (max-width: 1024px) 384px, 448px"
                      className="object-cover"
                      priority={isActive}
                    />
                  ) : (
                    <ThumbnailPlaceholder />
                  )
                ) : null}

                {isNeighbor && t.video_url ? (
                  <video
                    key={`${t.id}-${isPlaying ? "play" : "idle"}`}
                    src={isPlaying ? t.video_url : undefined}
                    poster={t.thumbnail_url ?? undefined}
                    controls={isPlaying}
                    playsInline
                    preload="none"
                    className={cn(
                      "absolute inset-0 w-full h-full object-cover",
                      isPlaying ? "opacity-100" : "opacity-0 pointer-events-none"
                    )}
                    autoPlay={isPlaying}
                  />
                ) : null}

                {!isPlaying ? (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => handlePlay(idx)}
                      aria-label={`Reproducir testimonio de ${t.patient_name}`}
                      className="absolute inset-0 flex items-center justify-center group cursor-pointer"
                      tabIndex={isActive ? 0 : -1}
                    >
                      <span className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/25 backdrop-blur-md flex items-center justify-center transition-transform group-hover:scale-110 group-active:scale-95">
                        <Icon
                          name="play_arrow"
                          filled
                          size="xl"
                          className="text-white translate-x-0.5"
                        />
                      </span>
                    </button>

                    <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 text-white pointer-events-none">
                      <StarRating value={t.rating} className="mb-1.5 sm:mb-2" />
                      <h4 className="font-headline font-bold text-lg sm:text-xl leading-tight">
                        {t.patient_name}
                      </h4>
                      {t.review_text ? (
                        <p className="text-xs sm:text-sm text-white/85 mt-1 sm:mt-1.5 line-clamp-2 sm:line-clamp-3 leading-snug">
                          &ldquo;{t.review_text}&rdquo;
                        </p>
                      ) : null}
                    </div>
                  </>
                ) : null}
              </div>
            );
          })}
        </div>

        {total > 1 ? (
          <>
            <button
              type="button"
              onClick={prev}
              aria-label="Testimonio anterior"
              className="absolute left-1.5 sm:left-2 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/15 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer"
            >
              <Icon name="chevron_left" size="lg" />
            </button>
            <button
              type="button"
              onClick={next}
              aria-label="Siguiente testimonio"
              className="absolute right-1.5 sm:right-2 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/15 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/30 transition-colors cursor-pointer"
            >
              <Icon name="chevron_right" size="lg" />
            </button>
          </>
        ) : null}
      </div>

      {total > 1 ? (
        <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-4 sm:mt-6">
          {items.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => goTo(i)}
              aria-label={`Ir al testimonio ${i + 1}`}
              aria-current={i === active}
              className={cn(
                "h-2 rounded-full transition-all cursor-pointer",
                i === active
                  ? "w-6 sm:w-8 bg-primary"
                  : "w-2 bg-outline-variant hover:bg-on-surface-variant"
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
