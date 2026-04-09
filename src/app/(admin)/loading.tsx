import { Icon } from "@/components/ui/icon";

export default function AdminLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <Icon name="progress_activity" size="xl" className="animate-spin" />
        <p className="text-sm font-medium">Cargando...</p>
      </div>
    </div>
  );
}
