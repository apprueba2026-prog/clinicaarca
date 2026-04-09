"use client";

import { cn } from "@/lib/utils/cn";
import { Icon } from "@/components/ui/icon";

interface StepIndicatorProps {
  currentStep: number;
  steps: { label: string; icon: string }[];
}

export function StepIndicator({ currentStep, steps }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-1 sm:gap-2">
      {steps.map((step, index) => {
        const stepNumber = index + 1;
        const isActive = stepNumber === currentStep;
        const isCompleted = stepNumber < currentStep;

        return (
          <div key={step.label} className="flex items-center gap-1 sm:gap-2">
            {/* Step circle */}
            <div className="flex flex-col items-center gap-1">
              <div
                className={cn(
                  "flex items-center justify-center w-10 h-10 rounded-full transition-all duration-300",
                  isCompleted &&
                    "bg-primary text-on-primary",
                  isActive &&
                    "bg-primary text-on-primary ring-4 ring-primary-fixed",
                  !isActive &&
                    !isCompleted &&
                    "bg-surface-container-high text-on-surface-variant"
                )}
              >
                {isCompleted ? (
                  <Icon name="check" size="sm" />
                ) : (
                  <Icon name={step.icon} size="sm" />
                )}
              </div>
              <span
                className={cn(
                  "text-[10px] font-semibold text-center leading-tight max-w-[70px]",
                  isActive
                    ? "text-primary"
                    : isCompleted
                      ? "text-primary/70"
                      : "text-on-surface-variant/50"
                )}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {index < steps.length - 1 && (
              <div
                className={cn(
                  "h-0.5 w-6 sm:w-10 rounded-full mb-5 transition-all duration-300",
                  stepNumber < currentStep
                    ? "bg-primary"
                    : "bg-outline-variant/40"
                )}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
