import { format, formatDistanceToNow, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export function formatDate(date: string | Date, pattern = "dd MMM yyyy") {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, pattern, { locale: es });
}

export function formatTime(date: string | Date) {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "hh:mm a", { locale: es });
}

export function formatRelative(date: string | Date) {
  const d = typeof date === "string" ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true, locale: es });
}

export function formatFullDate(date: string | Date) {
  const d = typeof date === "string" ? parseISO(date) : date;
  return format(d, "EEEE dd 'de' MMMM, yyyy", { locale: es });
}

export function formatFullDateWithTime(date: string | Date) {
  const d = typeof date === "string" ? parseISO(date) : date;
  const datePart = format(d, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es });
  const timePart = format(d, "hh:mm a", { locale: es });
  const capitalized = datePart.charAt(0).toUpperCase() + datePart.slice(1);
  return `${capitalized} • ${timePart.toUpperCase()}`;
}
