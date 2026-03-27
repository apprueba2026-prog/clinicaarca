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
        className="absolute inset-0 bg-slate-900/20 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={cn(
          "absolute right-0 top-0 h-full w-[450px] bg-white dark:bg-slate-900 shadow-2xl flex flex-col",
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
    <div className="p-8 border-b border-slate-100 dark:border-slate-800">
      <div className="flex justify-between items-start mb-6">
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full cursor-pointer"
        >
          <Icon name="close" />
        </button>
        {onEdit && (
          <button
            onClick={onEdit}
            className="px-4 py-2 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 text-sm font-bold rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
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
    <div className="flex border-b border-slate-100 dark:border-slate-800 px-8">
      {tabs.map((tab, i) => (
        <button
          key={tab}
          onClick={() => onTabChange(i)}
          className={cn(
            "px-4 py-4 text-sm font-bold border-b-2 transition-colors cursor-pointer",
            activeTab === i
              ? "text-sky-700 dark:text-sky-400 border-sky-600"
              : "text-slate-400 border-transparent hover:text-sky-600"
          )}
        >
          {tab}
        </button>
      ))}
    </div>
  );
}
