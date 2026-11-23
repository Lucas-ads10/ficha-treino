import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { Prisma } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { RegistrarExecucaoDto, SerieDto } from './treinos.dto.js';

const numero = (valor: Prisma.Decimal | null): number | null =>
  valor === null ? null : Number(valor);

type LinhaExecucao = {
  serie: number;
  carga: Prisma.Decimal | null;
  repeticoes: number | null;
  valorTempo: Prisma.Decimal | null;
  dataTreino: Date;
};

/** Formato histórico da API (snake_case), usado pela área do aluno. */
function linhaParaVisao(linha: LinhaExecucao) {
  return {
    serie: linha.serie,
    carga: numero(linha.carga),
    repeticoes: linha.repeticoes,
    valor_tempo: numero(linha.valorTempo),
    data_treino: linha.dataTreino,
  };
}

@Injectable()
export class TreinosService {
  constructor(private readonly prisma: PrismaService) { }

  // ------------------------------------------------------------
  // Registrar treino realizado
  // ------------------------------------------------------------

  /**
   * Grava as séries executadas. O aluno vem SEMPRE da sessão e o exercício só é
   * aceito se pertencer à ficha atual DESTE aluno (impede gravar em nome de outro).
   * O nome do treino e do exercício são copiados para a linha (snapshot): editar
   * ou apagar o exercício depois não altera o histórico.
   */
  async registrar(alunoId: number, dto: RegistrarExecucaoDto) {
    const exercicio = await this.prisma.fichaExercicio.findFirst({
      where: {
        id: dto.exercicioId,
        excluidoEm: null,
        divisao: { excluidoEm: null, ficha: { alunoId, ativa: true } },
      },
      include: { divisao: true },
    });

    if (!exercicio) {
      throw new NotFoundException('Exercício não encontrado na sua ficha.');
    }

    const dataTreino = new Date();
    const base = {
      alunoId,
      fichaExercicioId: exercicio.id,
      treino: exercicio.divisao.nome.slice(0, 100),
      exercicio: exercicio.nome,
      dataTreino,
    };

    let linhas: Prisma.TreinoRealizadoCreateManyInput[];
    let mensagem: string;

    if (exercicio.tipo === 'CARDIO') {
      if (!dto.valor || dto.valor <= 0) {
        throw new BadRequestException('Informe o tempo do cardio.');
      }

      linhas = [{ ...base, serie: 1, valorTempo: dto.valor }];
      mensagem = 'Cardio salvo com sucesso! 🏃';
    } else if (exercicio.tipo === 'TEMPO') {
      const series = this.exigirSeries(dto.series, 'Nenhuma série de tempo foi enviada.');

      linhas = series.map((serie, i) => {
        if (!serie.valor || serie.valor <= 0) {
          throw new BadRequestException(`Valor inválido na Série ${i + 1}.`);
        }
        return { ...base, serie: i + 1, valorTempo: serie.valor };
      });
      mensagem = 'Exercício de tempo salvo! ⏱️';
    } else {
      const series = this.exigirSeries(dto.series, 'Nenhuma série foi enviada.');

      linhas = series.map((serie, i) => {
        if (!serie.carga || serie.carga <= 0 || !serie.repeticoes) {
          throw new BadRequestException(`Dados inválidos na Série ${i + 1}.`);
        }
        return {
          ...base,
          serie: i + 1,
          carga: serie.carga,
          repeticoes: serie.repeticoes,
        };
      });
      mensagem = 'Treino salvo com sucesso! 💪';
    }

    // Todas as séries do exercício entram juntas ou nenhuma entra.
    await this.prisma.treinoRealizado.createMany({ data: linhas });

    return { mensagem, data_treino: dataTreino };
  }

  private exigirSeries(series: SerieDto[] | undefined, mensagem: string): SerieDto[] {
    if (!Array.isArray(series) || series.length === 0) {
      throw new BadRequestException(mensagem);
    }
    return series;
  }

  // ------------------------------------------------------------
  // Consultas do aluno (sempre filtradas pelo alunoId da sessão)
  // ------------------------------------------------------------

  /** Último treino de um exercício da ficha do aluno. */
  async ultimo(alunoId: number, exercicioId: number) {
    const nome = await this.nomeDoExercicio(alunoId, exercicioId);

    const recente = await this.prisma.treinoRealizado.findFirst({
      where: { alunoId, fichaExercicioId: exercicioId },
      orderBy: { dataTreino: 'desc' },
      select: { dataTreino: true },
    });

    if (!recente) {
      return {
        sucesso: true,
        encontrado: false,
        exercicio: nome,
        data_treino: null,
        series: [],
      };
    }

    const linhas = await this.prisma.treinoRealizado.findMany({
      where: {
        alunoId,
        fichaExercicioId: exercicioId,
        dataTreino: recente.dataTreino,
      },
      orderBy: { serie: 'asc' },
    });

    return {
      sucesso: true,
      encontrado: true,
      exercicio: nome,
      data_treino: recente.dataTreino,
      series: linhas.map(linhaParaVisao),
    };
  }

  async ultimoPorNome(alunoId: number, exercicio: string) {
    const recente = await this.prisma.treinoRealizado.findFirst({
      where: { alunoId, exercicio },
      orderBy: { dataTreino: 'desc' },
      select: { dataTreino: true },
    });

    if (!recente) {
      return {
        sucesso: true,
        encontrado: false,
        exercicio,
        data_treino: null,
        series: [],
      };
    }

    const linhas = await this.prisma.treinoRealizado.findMany({
      where: { alunoId, exercicio, dataTreino: recente.dataTreino },
      orderBy: { serie: 'asc' },
    });

    return {
      sucesso: true,
      encontrado: true,
      exercicio,
      data_treino: recente.dataTreino,
      series: linhas.map(linhaParaVisao),
    };
  }

  /** Histórico de um exercício, agrupado por dia/horário (mais recente primeiro). */
  async historico(alunoId: number, exercicioId: number, limite = 10) {
  const nome = await this.nomeDoExercicio(alunoId, exercicioId);

  const linhas = await this.prisma.treinoRealizado.findMany({
    where: { alunoId, fichaExercicioId: exercicioId },
    orderBy: [{ dataTreino: 'desc' }, { serie: 'asc' }],
    take: 30 * limite,
  });

  const sessoes = new Map<number, ReturnType<typeof linhaParaVisao>[]>();

  for (const linha of linhas) {
    const chave = linha.dataTreino.getTime();
    sessoes.set(chave, [
      ...(sessoes.get(chave) ?? []),
      linhaParaVisao(linha),
    ]);
  }

  return {
    sucesso: true,
    exercicio: nome,
    sessoes: [...sessoes.entries()].slice(0, limite).map(([chave, series]) => ({
      data_treino: new Date(chave),
      series,
    })),
  };
}

  async historicoPorNome(alunoId: number, exercicio: string, limite = 10) {
    const linhas = await this.prisma.treinoRealizado.findMany({
      where: { alunoId, exercicio },
      orderBy: [{ dataTreino: 'desc' }, { serie: 'asc' }],
      take: 30 * limite,
    });

    const sessoes = new Map<number, ReturnType<typeof linhaParaVisao>[]>();

    for (const linha of linhas) {
      const chave = linha.dataTreino.getTime();
      sessoes.set(chave, [...(sessoes.get(chave) ?? []), linhaParaVisao(linha)]);
    }

    return {
      sucesso: true,
      exercicio,
      sessoes: [...sessoes.entries()].slice(0, limite).map(([chave, series]) => ({
        data_treino: new Date(chave),
        series,
      })),
    };
  }

  /** Todos os treinos realizados do aluno, agrupados por exercício e horário. */
  async listarExecucoes(alunoId: number, limite = 50) {
    const linhas = await this.prisma.treinoRealizado.findMany({
      where: { alunoId },
      orderBy: [{ dataTreino: 'desc' }, { id: 'asc' }],
      take: 30 * limite,
    });

    const grupos = new Map<
      string,
      {
        data_treino: Date;
        treino: string;
        exercicio: string;
        series: ReturnType<typeof linhaParaVisao>[];
      }
    >();

    for (const linha of linhas) {
      const chave = `${linha.dataTreino.getTime()}|${linha.treino}|${linha.exercicio}`;
      const grupo = grupos.get(chave) ?? {
        data_treino: linha.dataTreino,
        treino: linha.treino,
        exercicio: linha.exercicio,
        series: [],
      };
      grupo.series.push(linhaParaVisao(linha));
      grupos.set(chave, grupo);
    }

    return { sucesso: true, execucoes: [...grupos.values()].slice(0, limite) };
  }

  // ------------------------------------------------------------
  // Rotas antigas (compatibilidade): resolvem o exercício por NOME
  // dentro da ficha do aluno logado.
  // ------------------------------------------------------------

  async exercicioIdPorNome(
    alunoId: number,
    exercicio: string,
    treino?: string,
  ): Promise<number> {
    const encontrado = await this.prisma.fichaExercicio.findFirst({
      where: {
        nome: exercicio,
        excluidoEm: null,
        divisao: {
          excluidoEm: null,
          ...(treino ? { nome: treino } : {}),
          ficha: { alunoId, ativa: true },
        },
      },
      select: { id: true },
    });

    if (!encontrado) {
      throw new NotFoundException('Exercício não encontrado na sua ficha.');
    }

    return encontrado.id;
  }

  // ------------------------------------------------------------
  // Administrador
  // ------------------------------------------------------------

  /** Execuções de UM aluno (o id vem da URL, rota restrita a ADMIN). */
  async execucoesDoAluno(alunoId: number, limite = 100) {
    const aluno = await this.prisma.aluno.findFirst({
      where: { id: alunoId, usuario: { excluidoEm: null } },
      select: { id: true },
    });

    if (!aluno) {
      throw new NotFoundException('Aluno não encontrado.');
    }

    return this.listarExecucoes(alunoId, limite);
  }

  /** Tabela inteira, incluindo os 278 registros antigos sem dono. Só ADMIN. */
  async todosOsRegistros() {
    const linhas = await this.prisma.treinoRealizado.findMany({
      orderBy: { dataTreino: 'desc' },
      take: 5000,
    });

    return linhas.map((linha) => ({
      id: linha.id,
      treino: linha.treino,
      exercicio: linha.exercicio,
      serie: linha.serie,
      carga: numero(linha.carga),
      repeticoes: linha.repeticoes,
      valor_tempo: numero(linha.valorTempo),
      data_treino: linha.dataTreino,
      aluno_id: linha.alunoId,
    }));
  }

  // ------------------------------------------------------------
  // internos
  // ------------------------------------------------------------

  /** Nome do exercício, SE ele pertencer à ficha atual do aluno. */
  private async nomeDoExercicio(alunoId: number, exercicioId: number): Promise<string> {
    const exercicio = await this.prisma.fichaExercicio.findFirst({
      where: {
        id: exercicioId,
        excluidoEm: null,
        divisao: { excluidoEm: null, ficha: { alunoId, ativa: true } },
      },
      select: { nome: true },
    });

    if (!exercicio) {
      throw new NotFoundException('Exercício não encontrado na sua ficha.');
    }

    return exercicio.nome;
  }
}
