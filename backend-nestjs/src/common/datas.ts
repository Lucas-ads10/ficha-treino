/**
 * Datas "só dia" (YYYY-MM-DD), sem fuso: usadas em pagamentos.
 * "Hoje" é sempre o dia em São Paulo, independentemente do fuso do servidor.
 */

export function hojeSaoPaulo(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

export function dataValida(texto: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    return false;
  }

  const data = new Date(`${texto}T00:00:00.000Z`);
  return !Number.isNaN(data.getTime()) && data.toISOString().startsWith(texto);
}

export function paraDataBanco(texto: string): Date {
  return new Date(`${texto}T00:00:00.000Z`);
}

export function dataParaTexto(data: Date): string {
  return data.toISOString().slice(0, 10);
}
