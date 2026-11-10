
import { Inject, Injectable } from '@nestjs/common';
import type { Pool, RowDataPacket } from 'mysql2/promise';

interface DadosTreino {
  treino: string;
  exercicio: string;
  dataTreino: string | Date;
}

interface DadosCardio extends DadosTreino {
  valor: number | string;
}

interface SerieTempo {
  valor: number | string;
}

interface SerieNormal {
  carga: number | string;
  repeticoes: number | string;
}

interface DadosSeriesTempo extends DadosTreino {
  series: SerieTempo[];
}

interface DadosSeriesNormais extends DadosTreino {
  series: SerieNormal[];
}

@Injectable()
export class TreinosRepository {
  constructor(
    @Inject('MYSQL_POOL')
    private readonly db: Pool,
  ) {}

  async salvarCardio({
    treino,
    exercicio,
    valor,
    dataTreino,
  }: DadosCardio): Promise<void> {
    await this.db.query(
      `INSERT INTO treinos_realizados
      (
        treino, exercicio, serie, carga,
        repeticoes, valor_tempo, data_treino
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [treino, exercicio, 1, null, null, Number(valor), dataTreino],
    );
  }

  async salvarSeriesTempo({
    treino,
    exercicio,
    series,
    dataTreino,
  }: DadosSeriesTempo): Promise<void> {
    for (let i = 0; i < series.length; i++) {
      await this.db.query(
        `INSERT INTO treinos_realizados
        (
          treino, exercicio, serie, carga,
          repeticoes, valor_tempo, data_treino
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          treino,
          exercicio,
          i + 1,
          null,
          null,
          Number(series[i].valor),
          dataTreino,
        ],
      );
    }
  }

  async salvarSeriesNormais({
    treino,
    exercicio,
    series,
    dataTreino,
  }: DadosSeriesNormais): Promise<void> {
    for (let i = 0; i < series.length; i++) {
      await this.db.query(
        `INSERT INTO treinos_realizados
        (
          treino, exercicio, serie, carga,
          repeticoes, valor_tempo, data_treino
        )
        VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          treino,
          exercicio,
          i + 1,
          Number(series[i].carga),
          Number(series[i].repeticoes),
          null,
          dataTreino,
        ],
      );
    }
  }

  async buscarUltimoTreino(
    treino: string,
    exercicio: string,
  ): Promise<RowDataPacket[]> {
    const [resultado] = await this.db.query<RowDataPacket[]>(
      `SELECT
        serie,
        carga,
        repeticoes,
        valor_tempo,
        data_treino
      FROM treinos_realizados
      WHERE treino = ?
      AND exercicio = ?
      AND data_treino = (
        SELECT MAX(data_treino)
        FROM treinos_realizados
        WHERE treino = ?
        AND exercicio = ?
      )
      ORDER BY serie ASC`,
      [treino, exercicio, treino, exercicio],
    );

    return resultado;
  }

  async buscarTodos(): Promise<RowDataPacket[]> {
    const [resultado] = await this.db.query<RowDataPacket[]>(
      `SELECT *
       FROM treinos_realizados
       ORDER BY data_treino DESC`,
    );

    return resultado;
  }

  async testarConexao(): Promise<RowDataPacket[]> {
    const [resultado] = await this.db.query<RowDataPacket[]>(
      'SELECT 1 AS teste',
    );

    return resultado;
  }
}
