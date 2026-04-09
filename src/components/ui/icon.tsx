import { cn } from "@/lib/utils/cn";

interface IconProps {
  name: string;
  filled?: boolean;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const sizeMap = {
  xs: "text-[16px]",
  sm: "text-[20px]",
  md: "text-[24px]",
  lg: "text-[32px]",
  xl: "text-[36px]",
};

export function Icon({
  name,
  filled = false,
  size = "md",
  className,
}: IconProps) {
  return (
    <span
      className={cn(
        "material-symbols-outlined inline-flex items-center justify-center leading-none shrink-0",
        sizeMap[size],
        className
      )}
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
