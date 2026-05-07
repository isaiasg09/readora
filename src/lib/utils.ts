// Formata uma data para o padrão brasileiro: dd/mm/aaaa hh:mm
// Usado pra exibir as datas no histórico de READMEs
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}
