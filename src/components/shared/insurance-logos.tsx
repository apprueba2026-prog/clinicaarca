const insurancePartners = [
  "HEALTH+",
  "MEDICARE",
  "GLOBALCARE",
  "SANTÉ",
  "SECURELIFE",
  "PRIMEINSURE",
];

export function InsuranceLogos() {
  return (
    <div className="bg-surface-container-lowest p-10 rounded-3xl">
      <p className="text-on-surface-variant mb-8">
        Trabajamos con las principales instituciones para que tu salud sea
        siempre la prioridad.
      </p>
      <div className="grid grid-cols-3 gap-8 opacity-60 grayscale hover:grayscale-0 transition-all duration-500">
        {insurancePartners.map((name) => (
          <div key={name} className="flex items-center justify-center p-4">
            <div className="font-bold text-slate-400">{name}</div>
          </div>
        ))}
      </div>
      <div className="mt-10 pt-8 border-t border-surface-variant text-center">
        <p className="text-sm text-on-surface-variant italic">
          ¿No ves tu seguro? Contáctanos para consultar convenios específicos.
        </p>
      </div>
    </div>
  );
}
