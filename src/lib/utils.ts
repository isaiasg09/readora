// Renders standard temporal object instances into localized client-facing representations.
// Abstracting formatting logic centrally to decouple localized layouts from underlying parsing structures.
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
