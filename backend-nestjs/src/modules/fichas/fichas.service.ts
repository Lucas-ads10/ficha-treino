import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import type { Prisma } from '../../generated/prisma/client.js';
import type { TipoExercicio } from '../../generated/prisma/enums.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { normalizarEmail } from '../usuarios/usuarios.service.js';
import type { CriarFichaDto, ExercicioDto } from './fichas.dto.js';

const ordenar = [{ ordem: 'asc' as const }, { id: 'asc' as const }];

const INCLUIR_FICHA = {
  divisoes: {
    where: { excluidoEm: null },
    orderBy: ordenar,
    include: { exercicios: { where: { excluidoEm: null }, orderBy: ordenar } },
  },
} satisfies Prisma.FichaInclude;

type FichaCompleta = Prisma.FichaGetPayload<{ include: typeof INCLUIR_FICHA }>;

/**
 * Deduz o tipo pelo texto de repetições, como já era feito à mão na ficha
 * fixa: "segundos" = tempo (por série), "minutos" = cardio.
 */
export function inferirTipo(repeticoes: string): TipoExercicio {
  if (/minut/i.test(repeticoes)) {
    return 'CARDIO';
  }

  if (/segund|\bseg\b/i.test(repeticoes)) {
    return 'TEMPO';
  }

  return 'NORMAL';
}

function exercicioParaVisao(exercicio: {
  id: number;
  nome: string;
  tipo: TipoExercicio;
  series: number;
  repeticoes: string;
  cargaSugerida: Prisma.Decimal | null;
  descansoSeg: number | null;
  observacoes: string | null;
}) {
  return {
    id: exercicio.id,
    nome: exercicio.nome,
    series: exercicio.series,
    repeticoes: exercicio.repeticoes,
    tipo: exercicio.tipo,
    cargaSugerida:
      exercicio.cargaSugerida === null ? null : Number(exercicio.cargaSugerida),
    descansoSeg: exercicio.descansoSeg,
    observacoes: exercicio.observacoes ?? '',
  };
}

export function fichaParaVisao(ficha: FichaCompleta) {
  return {
    id: ficha.id,
    nome: ficha.nome,
    ativa: ficha.ativa === true,
    iniciadaEm: ficha.iniciadaEm,
    encerradaEm: ficha.encerradaEm,
    treinos: ficha.divisoes.map((divisao) => ({
      id: divisao.id,
      nome: divisao.nome,
      exercicios: divisao.exercicios.map(exercicioParaVisao),
    })),
  };
}

@Injectable()
export class FichasService {
  constructor(private readonly prisma: PrismaService) {}

  // ------------------------------------------------------------
  // Consulta
  // ------------------------------------------------------------

  /** Ficha ATUAL de um aluno, no formato da área do aluno. */
  async fichaDoAluno(alunoId: number) {
    const ficha = await this.prisma.ficha.findFirst({
      where: { alunoId, ativa: true },
      include: INCLUIR_FICHA,
    });

    if (!ficha) {
      return null;
    }

    const visao = fichaParaVisao(ficha);

    // A área do aluno trata "sem tipo" como exercício normal (carga x repetições).
    return {
      ...visao,
      treinos: visao.treinos.map((treino) => ({
        ...treino,
        exercicios: treino.exercicios.map((exercicio) => ({
          ...exercicio,
          tipo:
            exercicio.tipo === 'NORMAL' ? null : exercicio.tipo.toLowerCase(),
        })),
      })),
    };
  }

  /** Todas as fichas do aluno (a atual e as anteriores), mais recentes primeiro. */
  async listarDoAluno(alunoId: number) {
    await this.exigirAluno(alunoId);

    const fichas = await this.prisma.ficha.findMany({
      where: { alunoId },
      include: INCLUIR_FICHA,
      orderBy: [{ iniciadaEm: 'desc' }, { id: 'desc' }],
    });

    return fichas.map(fichaParaVisao);
  }

  // ------------------------------------------------------------
  // Ficha
  // ------------------------------------------------------------

  /**
   * Cria a ficha ATUAL do aluno. Se já existir uma, ela é encerrada e fica
   * guardada como histórico. O aluno é localizado por id ou por e-mail; em
   * ambos os casos a ficha é gravada com o ID INTERNO.
   */
  async criar(dto: CriarFichaDto) {
    const alunoId = await this.resolverAluno(dto);

    try {
      const criada = await this.prisma.$transaction(async (tx) => {
        const atual = await tx.ficha.findFirst({
          where: { alunoId, ativa: true },
          include: INCLUIR_FICHA,
        });

        if (atual) {
          await tx.ficha.update({
            where: { id: atual.id },
            data: { ativa: null, encerradaEm: new Date() },
          });
        }

        const nova = await tx.ficha.create({
          data: {
            alunoId,
            ativa: true,
            nome: dto.nome?.trim() || 'Ficha de treino',
          },
        });

        if (atual && dto.copiarAtual) {
          for (const [i, divisao] of atual.divisoes.entries()) {
            const copia = await tx.fichaDivisao.create({
              data: { fichaId: nova.id, nome: divisao.nome, ordem: i },
            });

            if (divisao.exercicios.length > 0) {
              await tx.fichaExercicio.createMany({
                data: divisao.exercicios.map((exercicio, j) => ({
                  divisaoId: copia.id,
                  nome: exercicio.nome,
                  tipo: exercicio.tipo,
                  series: exercicio.series,
                  repeticoes: exercicio.repeticoes,
                  cargaSugerida: exercicio.cargaSugerida,
                  descansoSeg: exercicio.descansoSeg,
                  observacoes: exercicio.observacoes,
                  ordem: j,
                })),
              });
            }
          }
        }

        return tx.ficha.findUniqueOrThrow({
          where: { id: nova.id },
          include: INCLUIR_FICHA,
        });
      });

      return fichaParaVisao(criada);
    } catch (erro) {
      if ((erro as { code?: string })?.code === 'P2002') {
        throw new ConflictException(
          'A ficha deste aluno foi alterada ao mesmo tempo. Tente novamente.',
        );
      }
      throw erro;
    }
  }

  async renomear(fichaId: number, nome: string) {
    await this.exigirFichaAtiva(fichaId);

    await this.prisma.ficha.update({
      where: { id: fichaId },
      data: { nome: nome.trim() },
    });

    return this.visao(fichaId);
  }

  // ------------------------------------------------------------
  // Divisões (os "treinos" do painel)
  // ------------------------------------------------------------

  async criarDivisao(fichaId: number, nome: string) {
    await this.exigirFichaAtiva(fichaId);
    await this.garantirNomeDivisaoLivre(fichaId, nome);

    const ultima = await this.prisma.fichaDivisao.aggregate({
      where: { fichaId },
      _max: { ordem: true },
    });

    const divisao = await this.prisma.fichaDivisao.create({
      data: {
        fichaId,
        nome: nome.trim(),
        ordem: (ultima._max.ordem ?? -1) + 1,
      },
    });

    return { id: divisao.id, nome: divisao.nome, exercicios: [] };
  }

  async renomearDivisao(divisaoId: number, nome: string) {
    const divisao = await this.exigirDivisaoEditavel(divisaoId);
    await this.garantirNomeDivisaoLivre(divisao.fichaId, nome, divisaoId);

    const atualizada = await this.prisma.fichaDivisao.update({
      where: { id: divisaoId },
      data: { nome: nome.trim() },
    });

    return { id: atualizada.id, nome: atualizada.nome };
  }

  /**
   * Exclusão LÓGICA da divisão e dos seus exercícios: treinos já realizados
   * continuam apontando para eles e o histórico não é alterado.
   */
  async excluirDivisao(divisaoId: number): Promise<void> {
    await this.exigirDivisaoEditavel(divisaoId);

    const agora = new Date();
    await this.prisma.$transaction([
      this.prisma.fichaExercicio.updateMany({
        where: { divisaoId, excluidoEm: null },
        data: { excluidoEm: agora },
      }),
      this.prisma.fichaDivisao.update({
        where: { id: divisaoId },
        data: { excluidoEm: agora },
      }),
    ]);
  }

  async reordenarDivisoes(fichaId: number, ids: number[]): Promise<void> {
    await this.exigirFichaAtiva(fichaId);

    const atuais = await this.prisma.fichaDivisao.findMany({
      where: { fichaId, excluidoEm: null },
      select: { id: true },
    });

    this.validarOrdem(
      atuais.map((item) => item.id),
      ids,
    );

    await this.prisma.$transaction(
      ids.map((id, indice) =>
        this.prisma.fichaDivisao.update({ where: { id }, data: { ordem: indice } }),
      ),
    );
  }

  // ------------------------------------------------------------
  // Exercícios
  // ------------------------------------------------------------

  async criarExercicio(divisaoId: number, dto: ExercicioDto) {
    await this.exigirDivisaoEditavel(divisaoId);

    const ultimo = await this.prisma.fichaExercicio.aggregate({
      where: { divisaoId },
      _max: { ordem: true },
    });

    const exercicio = await this.prisma.fichaExercicio.create({
      data: {
        divisaoId,
        ...this.dadosExercicio(dto),
        ordem: (ultimo._max.ordem ?? -1) + 1,
      },
    });

    return exercicioParaVisao(exercicio);
  }

  async atualizarExercicio(exercicioId: number, dto: ExercicioDto) {
    await this.exigirExercicioEditavel(exercicioId);

    const exercicio = await this.prisma.fichaExercicio.update({
      where: { id: exercicioId },
      data: this.dadosExercicio(dto),
    });

    return exercicioParaVisao(exercicio);
  }

  async excluirExercicio(exercicioId: number): Promise<void> {
    await this.exigirExercicioEditavel(exercicioId);

    await this.prisma.fichaExercicio.update({
      where: { id: exercicioId },
      data: { excluidoEm: new Date() },
    });
  }

  async reordenarExercicios(divisaoId: number, ids: number[]): Promise<void> {
    await this.exigirDivisaoEditavel(divisaoId);

    const atuais = await this.prisma.fichaExercicio.findMany({
      where: { divisaoId, excluidoEm: null },
      select: { id: true },
    });

    this.validarOrdem(
      atuais.map((item) => item.id),
      ids,
    );

    await this.prisma.$transaction(
      ids.map((id, indice) =>
        this.prisma.fichaExercicio.update({ where: { id }, data: { ordem: indice } }),
      ),
    );
  }

  // ------------------------------------------------------------
  // internos
  // ------------------------------------------------------------

  private dadosExercicio(dto: ExercicioDto) {
    const repeticoes = dto.repeticoes.trim();
    const tipo: TipoExercicio =
      !dto.tipo || dto.tipo === 'AUTO' ? inferirTipo(repeticoes) : dto.tipo;

    return {
      nome: dto.nome.trim(),
      tipo,
      series: dto.series,
      repeticoes,
      cargaSugerida: dto.cargaSugerida ?? null,
      descansoSeg: dto.descansoSeg ?? null,
      observacoes: dto.observacoes?.trim() || null,
    };
  }

  private async visao(fichaId: number) {
    const ficha = await this.prisma.ficha.findUniqueOrThrow({
      where: { id: fichaId },
      include: INCLUIR_FICHA,
    });
    return fichaParaVisao(ficha);
  }

  private async resolverAluno(dto: CriarFichaDto): Promise<number> {
    if (dto.alunoId === undefined && !dto.alunoEmail) {
      throw new BadRequestException('Informe o aluno (e-mail ou id).');
    }

    const aluno = await this.prisma.aluno.findFirst({
      where: {
        usuario: {
          excluidoEm: null,
          perfil: 'ALUNO',
          ...(dto.alunoEmail
            ? { email: normalizarEmail(dto.alunoEmail) }
            : {}),
        },
        ...(dto.alunoId !== undefined ? { id: dto.alunoId } : {}),
      },
      select: { id: true },
    });

    if (!aluno) {
      throw new NotFoundException('Aluno não encontrado.');
    }

    return aluno.id;
  }

  private async exigirAluno(alunoId: number): Promise<void> {
    const aluno = await this.prisma.aluno.findFirst({
      where: { id: alunoId, usuario: { excluidoEm: null } },
      select: { id: true },
    });

    if (!aluno) {
      throw new NotFoundException('Aluno não encontrado.');
    }
  }

  private async exigirFichaAtiva(fichaId: number) {
    const ficha = await this.prisma.ficha.findUnique({ where: { id: fichaId } });

    if (!ficha) {
      throw new NotFoundException('Ficha não encontrada.');
    }

    if (ficha.ativa !== true) {
      throw new ConflictException(
        'Esta ficha já foi substituída e não pode mais ser alterada.',
      );
    }

    return ficha;
  }

  private async exigirDivisaoEditavel(divisaoId: number) {
    const divisao = await this.prisma.fichaDivisao.findFirst({
      where: { id: divisaoId, excluidoEm: null },
    });

    if (!divisao) {
      throw new NotFoundException('Treino não encontrado.');
    }

    await this.exigirFichaAtiva(divisao.fichaId);
    return divisao;
  }

  private async exigirExercicioEditavel(exercicioId: number) {
    const exercicio = await this.prisma.fichaExercicio.findFirst({
      where: { id: exercicioId, excluidoEm: null, divisao: { excluidoEm: null } },
      include: { divisao: true },
    });

    if (!exercicio) {
      throw new NotFoundException('Exercício não encontrado.');
    }

    await this.exigirFichaAtiva(exercicio.divisao.fichaId);
    return exercicio;
  }

  private async garantirNomeDivisaoLivre(
    fichaId: number,
    nome: string,
    ignorarId?: number,
  ): Promise<void> {
    const existente = await this.prisma.fichaDivisao.findFirst({
      where: {
        fichaId,
        excluidoEm: null,
        nome: nome.trim(),
        ...(ignorarId ? { id: { not: ignorarId } } : {}),
      },
      select: { id: true },
    });

    if (existente) {
      throw new ConflictException('Este usuário já possui um treino com esse nome.');
    }
  }

  private validarOrdem(atuais: number[], recebidos: number[]): void {
    const iguais =
      atuais.length === recebidos.length &&
      atuais.every((id) => recebidos.includes(id));

    if (!iguais) {
      throw new BadRequestException(
        'A ordem enviada não corresponde aos itens atuais. Recarregue a página.',
      );
    }
  }
}
