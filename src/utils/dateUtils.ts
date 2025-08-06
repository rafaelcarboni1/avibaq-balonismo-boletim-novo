/**
 * Utilitários para manipulação de datas
 * Resolve problemas de fuso horário ao exibir datas
 */

/**
 * Formata uma data no formato YYYY-MM-DD para exibição em pt-BR
 * sem problemas de fuso horário
 * @param dateString - Data no formato YYYY-MM-DD
 * @returns Data formatada em pt-BR (DD/MM/YYYY)
 */
export function formatDateSafe(dateString: string): string {
  if (!dateString) return '';
  
  // Parse manual da data para evitar problemas de timezone
  const [year, month, day] = dateString.split('-').map(Number);
  
  // Criar data local sem conversão de timezone
  const date = new Date(year, month - 1, day);
  
  return date.toLocaleDateString('pt-BR');
}

/**
 * Verifica se uma data (YYYY-MM-DD) é anterior à data atual
 * @param dateString - Data no formato YYYY-MM-DD
 * @returns true se a data for anterior à hoje
 */
export function isDatePast(dateString: string): boolean {
  if (!dateString) return false;
  
  const [year, month, day] = dateString.split('-').map(Number);
  const inputDate = new Date(year, month - 1, day);
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Reset time to compare only dates
  
  return inputDate < today;
}

/**
 * Converte uma data local para o formato YYYY-MM-DD
 * @param date - Objeto Date
 * @returns Data no formato YYYY-MM-DD
 */
export function formatDateToISO(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Obtém a data atual no formato YYYY-MM-DD
 * @returns Data atual no formato YYYY-MM-DD
 */
export function getCurrentDateISO(): string {
  return formatDateToISO(new Date());
}