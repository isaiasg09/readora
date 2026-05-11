// Formata uma data para o padrão brasileiro: dd/mm/aaaa hh:mm.
// Centralizar isso evita espalhar lógica de apresentação de data pela interface.
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
