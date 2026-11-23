import { ConflictException, Injectable } from '@nestjs/common';

import { gerarToken, hashToken, SenhaService } from '../../common/senha.service.js';
import type { TipoToken } from '../../generated/prisma/enums.js';
import { PrismaService } from '../../prisma/prisma.service.js';

export function normalizarEmail(email: string): string {
  return email.trim().toLowerCase();
}

export const VALIDADE_TOKEN_MS: Record<TipoToken, number> = {
  CONVITE: 48 * 3_600_000, // 48 horas
  RECUPERACAO: 1 * 3_600_000, // 1 hora
};

/**
 * Operações de conta compartilhadas por Auth, Alunos e pelo CLI de
 * inicialização: tokens de acesso, sessões e criação do administrador.
 */
@Injectable()
export class UsuariosService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly senhas: SenhaService,
  ) { }

  buscarPorEmail(email: string) {
    return this.prisma.usuario.findUnique({
      where: { email: normalizarEmail(email) },
    });
  }

  /**
   * Cria um token de convite/recuperação. Só o HASH é gravado; o valor
   * retornado vai para o usuário (e-mail) e não é guardado em lugar nenhum.
   * Tokens anteriores do mesmo tipo, ainda não usados, são invalidados.
   */
  async criarToken(usuarioId: number, tipo: TipoToken): Promise<string> {
    const token = gerarToken();

    await this.prisma.$transaction([
      this.prisma.tokenAcesso.updateMany({
        where: { usuarioId, tipo, usadoEm: null },
        data: { usadoEm: new Date() },
      }),
      this.prisma.tokenAcesso.create({
        data: {
          usuarioId,
          tipo,
          tokenHash: hashToken(token),
          expiraEm: new Date(Date.now() + VALIDADE_TOKEN_MS[tipo]),
        },
      }),
    ]);

    return token;
  }

  /** Revoga as sessões do usuário (todas, ou todas menos uma). */
  async revogarSessoes(usuarioId: number, manterSessaoId?: number): Promise<void> {
    await this.prisma.sessao.updateMany({
      where: {
        usuarioId,
        revogadaEm: null,
        ...(manterSessaoId ? { id: { not: manterSessaoId } } : {}),
      },
      data: { revogadaEm: new Date() },
    });
  }


  async revogarTokens(usuarioId: number): Promise<void> {
    await this.prisma.tokenAcesso.updateMany({
      where: {
        usuarioId,
        usadoEm: null,
      },
      data: {
        usadoEm: new Date(),
      },
    });
  }


  /**
   * Cria o administrador. Chamado apenas pelo procedimento de inicialização
   * (CLI), que recusa rodar se já existir um administrador.
   */
  async criarAdministrador(dados: {
    nome: string;
    email: string;
    senha: string;
  }) {
    const email = normalizarEmail(dados.email);

    if (await this.prisma.usuario.findUnique({ where: { email } })) {
      throw new ConflictException('Já existe um usuário com este e-mail.');
    }

    return this.prisma.usuario.create({
      data: {
        nome: dados.nome.trim(),
        email,
        senhaHash: await this.senhas.gerarHash(dados.senha),
        perfil: 'ADMIN',
        status: 'ATIVO',
        deveTrocarSenha: false,
      },
      select: { id: true, nome: true, email: true, perfil: true },
    });
  }

  contarAdministradores(): Promise<number> {
    return this.prisma.usuario.count({
      where: { perfil: 'ADMIN', excluidoEm: null },
    });
  }
}
