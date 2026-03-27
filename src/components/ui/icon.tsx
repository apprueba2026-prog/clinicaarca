import { cn } from "@/lib/utils/cn";

interface IconProps {
  name: string;
  filled?: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  sm: "text-sm",
  md: "text-2xl",
  lg: "text-3xl",
  xl: "text-4xl",
};

export function Icon({
  name,
  filled = false,
  size = "md",
  className,
}: IconProps) {
  return (
    <span
      className={cn("material-symbols-outlined", sizeMap[size], className)}
      style={
        filled
          ? { fontVariationSettings: "'FILL' 1, 'wght' 400, 'GRAD' 0, 'opsz' 24" }
          : undefined
      }
    >
      {name}
    </span>
  );
}
