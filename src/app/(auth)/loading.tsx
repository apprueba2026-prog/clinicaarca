import { Icon } from "@/components/ui/icon";

export default function AuthLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <Icon name="progress_activity" size="xl" className="animate-spin" />
        <p className="text-sm font-medium">Cargando...</p>
      </div>
    </div>
  );
}
