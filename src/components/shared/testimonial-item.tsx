"use client";

import Image from "next/image";
import { Icon } from "@/components/ui/icon";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import type { Testimonial } from "@/lib/types/testimonial";
import { formatRelative } from "@/lib/utils/format-date";

interface TestimonialItemProps {
  testimonial: Testimonial;
  onToggleVisibility: (id: string, visible: boolean) => void;
  onDelete: (id: string) => void;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex">
      {Array.from({ length: 5 }, (_, i) => (
        <Icon
          key={i}
          name="star"
          size="sm"
          filled={i < rating}
          className={
            i < rating
              ? "text-amber-400"
              : "text-slate-300 dark:text-slate-700"
          }
        />
      ))}
    </div>
  );
}

export function TestimonialItem({
  testimonial,
  onToggleVisibility,
  onDelete,
}: TestimonialItemProps) {
  return (
    <div className="flex items-center gap-4 p-4 bg-surface-container-lowest dark:bg-slate-900 rounded-2xl shadow-sm hover:shadow-md transition-all group">
      {/* Thumbnail */}
      <div className="w-32 aspect-video bg-slate-200 dark:bg-slate-800 rounded-xl overflow-hidden relative shrink-0">
        {testimonial.thumbnail_url ? (
          <Image
            src={testimonial.thumbnail_url}
            alt={testimonial.patient_name}
            fill
            sizes="128px"
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Icon name="videocam" className="text-slate-400" />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
          <Icon name="play_arrow" size="lg" className="text-white" />
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="font-bold text-on-surface dark:text-white leading-none">
          {testimonial.patient_name}
        </h4>
        <div className="flex items-center gap-2 mt-1 mb-2">
          <StarRating rating={testimonial.rating} />
          <span className="text-[10px] text-slate-400 font-medium">
            {formatRelative(testimonial.created_at)}
          </span>
        </div>
        {testimonial.review_text && (
          <p className="text-xs text-slate-500 line-clamp-1">
            &ldquo;{testimonial.review_text}&rdquo;
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-6 pr-4 shrink-0">
        <ToggleSwitch
          label="Visible"
          checked={testimonial.is_visible}
          onChange={(checked) =>
            onToggleVisibility(testimonial.id, checked)
          }
        />
        <button
          onClick={() => onDelete(testimonial.id)}
          className="p-2 text-slate-300 hover:text-error transition-colors cursor-pointer"
        >
          <Icon name="delete" />
        </button>
      </div>
    </div>
  );
}
