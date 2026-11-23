import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

/**
 * Limitador de taxa em memória (janela deslizante).
 *
 * Suficiente para uma instância única (Render). Se a API passar a rodar em
 * várias instâncias, trocar por um armazenamento compartilhado (ex.: Redis).
 */
@Injectable()
export class LimitadorTaxaService {
  private readonly baldes = new Map<string, number[]>();
  private ultimaLimpeza = Date.now();

  /** Registra uma ocorrência. Retorna quantas já houve na janela (incluindo esta). */
  registrar(chave: string, janelaMs: number): number {
    const agora = Date.now();
    this.limpar(agora);

    const recentes = (this.baldes.get(chave) ?? []).filter(
      (momento) => agora - momento < janelaMs,
    );
    recentes.push(agora);
    this.baldes.set(chave, recentes);

    return recentes.length;
  }

  contar(chave: string, janelaMs: number): number {
    const agora = Date.now();
    return (this.baldes.get(chave) ?? []).filter(
      (momento) => agora - momento < janelaMs,
    ).length;
  }

  limparChave(chave: string): void {
    this.baldes.delete(chave);
  }

  /** Zera todos os contadores (usado pelos testes automatizados). */
  limparTudo(): void {
    this.baldes.clear();
  }

  /** Lança 429 se a chave estourou o limite; senão, registra a ocorrência. */
  consumir(chave: string, max: number, janelaSeg: number): void {
    const total = this.registrar(chave, janelaSeg * 1000);

    if (total > max) {
      throw new HttpException(
        'Muitas tentativas. Aguarde alguns minutos e tente novamente.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  private limpar(agora: number): void {
    // Evita crescimento indefinido do mapa.
    if (agora - this.ultimaLimpeza < 60_000) {
      return;
    }

    this.ultimaLimpeza = agora;

    for (const [chave, momentos] of this.baldes) {
      if (momentos.every((momento) => agora - momento > 3_600_000)) {
        this.baldes.delete(chave);
      }
    }
  }
}
