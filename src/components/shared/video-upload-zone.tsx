"use client";

import { useCallback, useState } from "react";
import { Icon } from "@/components/ui/icon";
import { cn } from "@/lib/utils/cn";

interface VideoUploadZoneProps {
  onFileSelect: (file: File) => void;
  isUploading?: boolean;
}

export function VideoUploadZone({
  onFileSelect,
  isUploading = false,
}: VideoUploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file && isVideoFile(file)) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file && isVideoFile(file)) {
        onFileSelect(file);
      }
    },
    [onFileSelect]
  );

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragOver(true);
      }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={handleDrop}
      className={cn(
        "w-full aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-8 text-center group cursor-pointer transition-colors mb-6",
        isDragOver
          ? "border-primary bg-primary/5"
          : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900",
        isUploading && "pointer-events-none opacity-60"
      )}
    >
      {isUploading ? (
        <>
          <Icon
            name="progress_activity"
            size="lg"
            className="text-primary animate-spin mb-4"
          />
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
            Subiendo video...
          </p>
        </>
      ) : (
        <>
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-4 group-hover:scale-110 transition-transform">
            <Icon name="movie" size="lg" />
          </div>
          <p className="text-sm font-bold text-slate-700 dark:text-slate-200">
            Arrastra tu video aquí
          </p>
          <p className="text-xs text-slate-500 mt-1">
            Formato MP4, MOV. Max 15 segundos.
          </p>
          <label className="mt-4 px-4 py-2 bg-white dark:bg-slate-800 text-xs font-bold rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
            Explorar archivos
            <input
              type="file"
              accept="video/mp4,video/quicktime"
              className="hidden"
              onChange={handleFileInput}
            />
          </label>
        </>
      )}
    </div>
  );
}

function isVideoFile(file: File) {
  return file.type.startsWith("video/");
}
