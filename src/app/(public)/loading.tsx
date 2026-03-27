export default function PublicLoading() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3 text-slate-400">
        <span className="material-symbols-outlined text-4xl animate-spin">
          progress_activity
        </span>
        <p className="text-sm font-medium">Cargando...</p>
      </div>
    </div>
  );
}
