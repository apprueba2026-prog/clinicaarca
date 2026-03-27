import { cn } from "@/lib/utils/cn";

interface CardProps {
  hover?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function Card({ hover = false, className, children }: CardProps) {
  return (
    <div
      className={cn(
        "bg-surface-container-lowest rounded-3xl p-8",
        hover &&
          "transition-all duration-300 hover:-translate-y-2 hover:shadow-xl",
        className
      )}
    >
      {children}
    </div>
  );
}
