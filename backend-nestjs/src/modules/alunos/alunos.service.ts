import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  dataParaTexto,
  dataValida,
  paraDataBanco,
} from '../../common/datas.js';
import {
  gerarSenhaTemporaria,
  SenhaService,
} from '../../common/senha.service.js';
import type { Prisma } from '../../generated/prisma/client.js';
import type { StatusUsuario } from '../../generated/prisma/enums.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { MailService } from '../mail/mail.service.js';
import {
  normalizarEmail,
  UsuariosService,
} from '../usuarios/usuarios.service.js';
import type { AtualizarAlunoDto, CriarAlunoDto } from './alunos.dto.js';

const ROTULO_STATUS: Record<StatusUsuario, string> = {
  ATIVO: 'Ativo',
  PENDENTE: 'Pendente',
  BLOQUEADO: 'Bloqueado',
};

const ordenar = [{ ordem: 'asc' as const }, { id: 'asc' as const }];

// Aluno + conta + pagamentos + ficha ATUAL (divisões e exercícios não excluídos).
const INCLUIR_COMPLETO = {
  usuario: true,
  pagamentos: { orderBy: [{ dataPagamento: 'asc' as const }, { id: 'asc' as const }] },
  fichas: {
    where: { ativa: true },
    include: {
      divisoes: {
        where: { excluidoEm: null },
        orderBy: ordenar,
        include: {
          exercicios: { where: { excluidoEm: null }, orderBy: ordenar },
        },
      },
    },
  },
} satisfies Prisma.AlunoInclude;

type AlunoCompleto = Prisma.AlunoGetPayload<{ include: typeof INCLUIR_COMPLETO }>;

/**
 * Formato consumido pelo painel administrativo. Mantém o mesmo modelo que o
 * painel já usava em memória (usuario.treinos[].exercicios[], etc.).
 */
export function paraVisaoAdmin(aluno: AlunoCompleto) {
  const ficha = aluno.fichas[0] ?? null;
  const pagamentos = aluno.pagamentos.map((pagamento) => ({
    id: pagamento.id,
    valor: Number(pagamento.valor),
    data: dataParaTexto(pagamento.dataPagamento),
    forma: pagamento.forma,
  }));

  return {
    id: aluno.id,
    nome: aluno.usuario.nome,
    email: aluno.usuario.email,
    peso: Number(aluno.peso),
    idade: aluno.idade,
    objetivo: aluno.objetivo,
    observacoes: aluno.observacoes ?? '',
    status: ROTULO_STATUS[aluno.usuario.status],
    mensalidade: Number(aluno.mensalidade),
    dataUltimoPagamento: pagamentos.length
      ? pagamentos.reduce((maior, p) => (p.data > maior ? p.data : maior), '')
      : null,
    historicoPagamentos: pagamentos,
    temSenha: aluno.usuario.senhaHash !== null,
    ultimoAcessoEm: aluno.usuario.ultimoAcessoEm,
    fichaId: ficha?.id ?? null,
    treinos: (ficha?.divisoes ?? []).map((divisao) => ({
      id: divisao.id,
      nome: divisao.nome,
      exercicios: divisao.exercicios.map((exercicio) => ({
        id: exercicio.id,
        nome: exercicio.nome,
        series: exercicio.series,
        repeticoes: exercicio.repeticoes,
        tipo: exercicio.tipo,
        cargaSugerida:
          exercicio.cargaSugerida === null ? null : Number(exercicio.cargaSugerida),
        descansoSeg: exercicio.descansoSeg,
        observacoes: exercicio.observacoes ?? '',
      })),
    })),
  };
}

@Injectable()
export class AlunosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usuarios: UsuariosService,
    private readonly senhas: SenhaService,
    private readonly mail: MailService,
  ) {}

  async listar(busca?: string) {
    const termo = busca?.trim();

    const alunos = await this.prisma.aluno.findMany({
      where: {
        usuario: {
          excluidoEm: null,
          ...(termo
            ? {
                OR: [
                  { nome: { contains: termo } },
                  { email: { contains: termo } },
                ],
              }
            : {}),
        },
      },
      include: INCLUIR_COMPLETO,
      orderBy: { usuario: { nome: 'asc' } },
      take: 500,
    });

    return alunos.map(paraVisaoAdmin);
  }

  async obter(id: number) {
    return paraVisaoAdmin(await this.buscarCompleto(id));
  }

  async criar(dto: CriarAlunoDto, adminId: number) {
    if (!dataValida(dto.dataPrimeiroPagamento)) {
      throw new BadRequestException('Informe uma data de pagamento válida.');
    }

    const email = normalizarEmail(dto.email);
    await this.garantirEmailLivre(email);

    let alunoId: number;

    try {
      // Conta, cadastro do aluno e primeiro pagamento: tudo ou nada.
      alunoId = await this.prisma.$transaction(async (tx) => {
        const usuario = await tx.usuario.create({
          data: {
            nome: dto.nome.trim(),
            email,
            perfil: 'ALUNO',
            status: 'PENDENTE',
          },
        });

        const aluno = await tx.aluno.create({
          data: {
            usuarioId: usuario.id,
            peso: dto.peso,
            idade: dto.idade,
            objetivo: dto.objetivo,
            observacoes: dto.observacoes || null,
            mensalidade: dto.mensalidade,
            dataPrimeiroPagamento: paraDataBanco(dto.dataPrimeiroPagamento),
          },
        });


        return aluno.id;
      });
    } catch (erro) {
      this.traduzirConflito(erro);
      throw erro;
    }

    // Convite por e-mail (se a configuração de e-mail existir). Falha de envio
    // não desfaz o cadastro: o administrador pode reenviar ou gerar senha temporária.
    const aluno = await this.buscarCompleto(alunoId);
    const conviteEnviado = await this.enviarConviteInterno(
      aluno.usuario.id,
      aluno.usuario.email,
      aluno.usuario.nome,
    );

    return { aluno: paraVisaoAdmin(aluno), conviteEnviado };
  }

  
  async atualizar(id: number, dto: AtualizarAlunoDto) {
    const aluno = await this.buscarCompleto(id);
    const email = normalizarEmail(dto.email);
    const emailAlterado = email !== aluno.usuario.email;

    if (emailAlterado) {
      await this.garantirEmailLivre(email, aluno.usuario.id);
    }

    try {
      await this.prisma.$transaction([
        this.prisma.usuario.update({
          where: { id: aluno.usuarioId },
          data: { nome: dto.nome.trim(), email },
        }),
        this.prisma.aluno.update({
          where: { id },
          data: {
            peso: dto.peso,
            idade: dto.idade,
            objetivo: dto.objetivo,
            observacoes: dto.observacoes || null,
            mensalidade: dto.mensalidade,
          },
        }),
      ]);
    } catch (erro) {
      this.traduzirConflito(erro);
      throw erro;
    }

    if (emailAlterado) {
      await this.usuarios.revogarSessoes(aluno.usuarioId);
      await this.usuarios.revogarTokens(aluno.usuarioId);
    }

    return this.obter(id);
  }


  async bloquear(id: number) {
    const aluno = await this.buscarCompleto(id);

    await this.prisma.usuario.update({
      where: { id: aluno.usuarioId },
      data: { status: 'BLOQUEADO' },
    });
    // Derruba as sessões abertas na hora.
    await this.usuarios.revogarSessoes(aluno.usuarioId);

    return this.obter(id);
  }

  async desbloquear(id: number) {
    const aluno = await this.buscarCompleto(id);
    const { usuario } = aluno;

    // Volta ao estado anterior: Ativo se já tem senha definitiva; senão Pendente.
    const status: StatusUsuario =
      usuario.senhaHash && !usuario.deveTrocarSenha ? 'ATIVO' : 'PENDENTE';

    await this.prisma.usuario.update({
      where: { id: aluno.usuarioId },
      data: { status, tentativasFalhas: 0, bloqueadoAte: null },
    });

    return this.obter(id);
  }

  /**
   * Exclusão LÓGICA: a conta deixa de existir para login e listagens, mas
   * pagamentos, fichas e treinos realizados são preservados (histórico).
   */
  async excluir(id: number): Promise<void> {
    const aluno = await this.buscarCompleto(id);

    await this.prisma.usuario.update({
      where: { id: aluno.usuarioId },
      data: { excluidoEm: new Date(), status: 'BLOQUEADO' },
    });
    await this.usuarios.revogarSessoes(aluno.usuarioId);
  }

  async enviarConvite(id: number) {
    const aluno = await this.buscarCompleto(id);

    if (aluno.usuario.status === 'BLOQUEADO') {
      throw new BadRequestException('Desbloqueie o aluno antes de enviar o convite.');
    }

    const enviado = await this.enviarConviteInterno(
      aluno.usuario.id,
      aluno.usuario.email,
      aluno.usuario.nome,
    );

    return {
      enviado,
      mensagem: enviado
        ? 'Convite enviado por e-mail.'
        : 'O envio de e-mail não está configurado. Gere uma senha temporária para liberar o acesso.',
    };
  }

  /**
   * Define uma senha temporária (exibida UMA vez ao administrador). No primeiro
   * acesso o aluno é obrigado a trocá-la. A senha nunca é registrada em log.
   */
  async gerarSenhaTemporaria(id: number) {
    const aluno = await this.buscarCompleto(id);

    if (aluno.usuario.status === 'BLOQUEADO') {
      throw new BadRequestException('Desbloqueie o aluno antes de gerar uma senha.');
    }

    const senha = gerarSenhaTemporaria();

    await this.prisma.usuario.update({
      where: { id: aluno.usuarioId },
      data: {
        senhaHash: await this.senhas.gerarHash(senha),
        deveTrocarSenha: true,
        status: 'PENDENTE',
        tentativasFalhas: 0,
        bloqueadoAte: null,
      },
    });
    await this.usuarios.revogarSessoes(aluno.usuarioId);

    return {
      senhaTemporaria: senha,
      mensagem:
        'Entregue esta senha ao aluno. Ela não será exibida novamente e deve ser trocada no primeiro acesso.',
    };
  }

  // ------------------------------------------------------------
  // internos
  // ------------------------------------------------------------

  private async enviarConviteInterno(
    usuarioId: number,
    email: string,
    nome: string,
  ): Promise<boolean> {
    if (!this.mail.configurado()) {
      return false;
    }

    const token = await this.usuarios.criarToken(usuarioId, 'CONVITE');
    return this.mail.enviarConvite(email, nome, token);
  }

  private async buscarCompleto(id: number): Promise<AlunoCompleto> {
    const aluno = await this.prisma.aluno.findFirst({
      where: { id, usuario: { excluidoEm: null } },
      include: INCLUIR_COMPLETO,
    });

    if (!aluno) {
      throw new NotFoundException('Aluno não encontrado.');
    }

    return aluno;
  }

  private async garantirEmailLivre(email: string, ignorarUsuarioId?: number) {
    const existente = await this.prisma.usuario.findUnique({
      where: { email },
      select: { id: true, excluidoEm: true },
    });

    if (existente && existente.id !== ignorarUsuarioId) {
      throw new ConflictException(
        existente.excluidoEm
          ? 'Este e-mail pertence a um cadastro excluído. Use outro e-mail.'
          : 'Este e-mail já está cadastrado.',
      );
    }
  }

  private traduzirConflito(erro: unknown): void {
    if ((erro as { code?: string })?.code === 'P2002') {
      throw new ConflictException('Este e-mail já está cadastrado.');
    }
  }
}
