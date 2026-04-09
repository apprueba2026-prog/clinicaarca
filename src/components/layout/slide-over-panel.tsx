"use client";

import { useEffect } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils/cn";

interface SlideOverPanelProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function SlideOverPanel({
  isOpen,
  onClose,
  children,
}: SlideOverPanelProps) {
  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-on-surface/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          "absolute right-0 top-0 h-full w-[450px] bg-surface-container-lowest shadow-2xl flex flex-col",
          "animate-in slide-in-from-right duration-300"
        )}
      >
        {children}
      </div>
    </div>
  );
}

/** Sub-components for structure */

interface SlideOverHeaderProps {
  onClose: () => void;
  onEdit?: () => void;
  children: React.ReactNode;
}

export function SlideOverHeader({
  onClose,
  onEdit,
  children,
}: SlideOverHeaderProps) {
  return (
    <div className="p-8 border-b border-outline-variant">
      <div className="flex justify-between items-start mb-6">
        <button
          onClick={onClose}
          className="p-2 hover:bg-surface-container-high rounded-full cursor-pointer"
        >
          <Icon name="close" />
        </button>
        {onEdit && (
          <button
            onClick={onEdit}
            className="px-4 py-2 border border-outline-variant text-on-surface-variant text-sm font-bold rounded-lg hover:bg-surface-container cursor-pointer"
          >
            Editar Perfil
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

interface SlideOverTabsProps {
  tabs: string[];
  activeTab: number;
  onTabChange: (index: number) => void;
}

export function SlideOverTabs({
  tabs,
  activeTab,
  onTabChange,
}: SlideOverTabsProps) {
  return (
    <div className="flex border-b border-outline-variant px-8">
      {tabs.map((tab, i) => (
        <button
          key={tab}
          onClick={() => onTabChange(i)}
          className={cn(
            "px-4 py-4 text-sm font-bold border-b-2 transition-colors cursor-pointer",
            activeTab === i
              ? "text-primary border-primary"
              : "text-on-surface-variant border-transparent hover:text-primary"
          )}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
