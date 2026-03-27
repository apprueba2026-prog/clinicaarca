import { Icon } from "./icon";
import { cn } from "@/lib/utils/cn";

interface StarRatingProps {
  value: number;
  max?: number;
  size?: "sm" | "md";
  className?: string;
}

export function StarRating({
  value,
  max = 5,
  size = "sm",
  className,
}: StarRatingProps) {
  return (
    <div className={cn("flex gap-1", className)}>
      {Array.from({ length: max }, (_, i) => (
        <Icon
          key={i}
          name="star"
          filled={i < value}
          size={size}
          className={i < value ? "text-yellow-400" : "text-slate-300"}
        />
      ))}
    </div>
  );
}
