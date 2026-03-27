/**
 * Formatea un número como moneda peruana (Soles)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("es-PE", {
    style: "currency",
    currency: "PEN",
    minimumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formatea un número de forma compacta (ej: 1.5K, 2.3M)
 */
export function formatCompact(amount: number): string {
  return new Intl.NumberFormat("es-PE", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(amount);
}
