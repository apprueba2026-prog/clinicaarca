import { Icon } from "@/components/ui/icon";

export function SubscriptionPromo() {
  return (
    <div className="bg-primary dark:bg-primary-container p-8 rounded-xl text-white flex flex-col">
      <Icon name="stars" filled size="xl" className="mb-4" />
      <h3 className="text-2xl font-bold font-headline leading-tight mb-4">
        Suscripción Dental Pro
      </h3>
      <p className="text-sky-100 text-sm mb-8 leading-relaxed">
        Accede a las herramientas de análisis radiográfico por IA y firma
        digital ilimitada para tus pacientes.
      </p>
      <button className="mt-auto w-full py-3 bg-white text-primary font-bold rounded-xl hover:bg-sky-50 transition-colors shadow-xl cursor-pointer">
        Actualizar Plan
      </button>
    </div>
  );
}
