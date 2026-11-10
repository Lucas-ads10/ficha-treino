
import { BadRequestException, Injectable } from '@nestjs/common';
import { TreinosRepository } from './treinos.repository.js';

interface DadosTreino {
  treino: string;
  exercicio: string;
  tipo: 'cardio' | 'tempo' | 'normal';
  series?: {
    valor?: number | string;
    carga?: number | string;
    repeticoes?: number | string;
  }[];
  valor?: number | string;
}

@Injectable()
export class TreinosService {
  constructor(
    private readonly repository: TreinosRepository,
  ) {}

  private erroValidacao(mensagem: string): never {
    throw new BadRequestException(mensagem);
  }

  async salvarTreino(dados: DadosTreino) {
    const { treino, exercicio, tipo, series, valor } = dados;

    if (!treino) {
      this.erroValidacao('O treino não foi informado.');
    }

    if (!exercicio) {
      this.erroValidacao('O exercício não foi informado.');
    }

    const dataTreino = new Date();

    if (tipo === 'cardio') {
      if (!valor || Number(valor) <= 0) {
        this.erroValidacao('Informe o tempo do cardio.');
      }

      await this.repository.salvarCardio({
        treino,
        exercicio,
        valor,
        dataTreino,
      });

      return {
        mensagem: 'Cardio salvo com sucesso! 🏃',
        data_treino: dataTreino,
      };
    }

    if (tipo === 'tempo') {
      if (!Array.isArray(series) || series.length === 0) {
        this.erroValidacao('Nenhuma série de tempo foi enviada.');
      }

      for (let i = 0; i < series.length; i++) {
        const valorTempo = Number(series[i]?.valor);

        if (!Number.isFinite(valorTempo) || valorTempo <= 0) {
          this.erroValidacao(`Valor inválido na Série ${i + 1}.`);
        }
      }

      await this.repository.salvarSeriesTempo({
        treino,
        exercicio,
        series: series.map((serie) => ({
          valor: serie.valor!,
        })),
        dataTreino,
      });

      return {
        mensagem: 'Exercício de tempo salvo! ⏱️',
        data_treino: dataTreino,
      };
    }

    if (tipo === 'normal') {
      if (!Array.isArray(series) || series.length === 0) {
        this.erroValidacao('Nenhuma série foi enviada.');
      }

      for (let i = 0; i < series.length; i++) {
        const carga = Number(series[i]?.carga);
        const repeticoes = Number(series[i]?.repeticoes);

        if (
          !Number.isFinite(carga) ||
          carga <= 0 ||
          !Number.isFinite(repeticoes) ||
          repeticoes <= 0
        ) {
          this.erroValidacao(`Dados inválidos na Série ${i + 1}.`);
        }
      }

      await this.repository.salvarSeriesNormais({
        treino,
        exercicio,
        series: series.map((serie) => ({
          carga: serie.carga!,
          repeticoes: serie.repeticoes!,
        })),
        dataTreino,
      });

      return {
        mensagem: 'Treino salvo com sucesso! 💪',
        data_treino: dataTreino,
      };
    }

    this.erroValidacao('Tipo de exercício inválido.');
  }

  async buscarUltimoTreino(treino: string, exercicio: string) {
    const series = await this.repository.buscarUltimoTreino(
      treino,
      exercicio,
    );

    if (series.length === 0) {
      return {
        sucesso: true,
        encontrado: false,
        treino,
        exercicio,
        data_treino: null,
        series: [],
      };
    }

    return {
      sucesso: true,
      encontrado: true,
      treino,
      exercicio,
      data_treino: series[0].data_treino,
      series,
    };
  }

  async buscarTodos() {
    return this.repository.buscarTodos();
  }

  async testarConexao() {
    return this.repository.testarConexao();
  }
}
