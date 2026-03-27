"use client";

const bars = [
  { day: "Lun", height: "60%", hoverHeight: "70%", color: "bg-sky-200 dark:bg-sky-800" },
  { day: "Mar", height: "45%", hoverHeight: "55%", color: "bg-sky-300 dark:bg-sky-700" },
  { day: "Mié", height: "80%", hoverHeight: "90%", color: "bg-sky-400 dark:bg-sky-600" },
  { day: "Jue", height: "65%", hoverHeight: "75%", color: "bg-sky-500 dark:bg-sky-500" },
  { day: "Vie", height: "95%", hoverHeight: "100%", color: "bg-primary dark:bg-primary-container" },
  { day: "Sáb", height: "40%", hoverHeight: "50%", color: "bg-sky-300 dark:bg-sky-700" },
  { day: "Dom", height: "30%", hoverHeight: "40%", color: "bg-sky-200 dark:bg-sky-800" },
];

export function ClinicPerformance() {
  return (
    <div className="lg:col-span-2 bg-surface-container-high dark:bg-slate-900 p-8 rounded-xl flex flex-col justify-between">
      <div>
        <h3 className="text-xl font-extrabold text-slate-900 dark:text-white mb-2">
          Desempeño de la Clínica
        </h3>
        <p className="text-slate-500 mb-8 max-w-md">
          Análisis predictivo basado en el flujo de pacientes de los últimos 7
          días. La IA sugiere abrir una ventana adicional de atención el jueves.
        </p>
      </div>
      <div className="h-48 w-full flex items-end justify-between gap-4">
        {bars.map((bar) => (
          <div
            key={bar.day}
            className={`w-full ${bar.color} rounded-t-lg transition-all cursor-help group`}
            style={{ height: bar.height }}
            title={bar.day}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.height = bar.hoverHeight;
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.height = bar.height;
            }}
          />
        ))}
      </div>
      <div className="flex justify-between mt-2 px-1">
        {bars.map((bar) => (
          <span
            key={bar.day}
            className="text-[10px] font-medium text-slate-400 w-full text-center"
          >
            {bar.day}
          </span>
        ))}
      </div>
    </div>
  );
}
