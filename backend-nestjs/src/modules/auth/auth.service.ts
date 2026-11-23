import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { duracaoSessaoMs } from '../../common/ambiente.js';
import { LimitadorTaxaService } from '../../common/limitador-taxa.service.js';
import {
  gerarToken,
  hashToken,
  SenhaService,
} from '../../common/senha.service.js';
import type { TipoToken } from '../../generated/prisma/enums.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { MailService } from '../mail/mail.service.js';
import {
  normalizarEmail,
  UsuariosService,
} from '../usuarios/usuarios.service.js';

const MAX_FALHAS = 5;
const BLOQUEIO_MS = 15 * 60_000;
const JANELA_FALHAS_SEG = 15 * 60;

const MSG_CREDENCIAIS = 'E-mail ou senha incorretos.';
const MSG_MUITAS_TENTATIVAS =
  'Muitas tentativas de login. Aguarde alguns minutos e tente novamente.';

export interface DadosSessao {
  token: string;
  expiraEm: Date;
  csrfToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly senhas: SenhaService,
    private readonly usuarios: UsuariosService,
    private readonly mail: MailService,
    private readonly limitador: LimitadorTaxaService,
  ) { }

  // ------------------------------------------------------------
  // LOGIN
  // ------------------------------------------------------------

  async login(
    emailBruto: string,
    senha: string,
    contexto: { ip?: string; userAgent?: string },
  ) {
    const email = normalizarEmail(emailBruto);
    const chaveFalhas = `login-falha:${email}`;

    // Contador por e-mail, igual para contas existentes e inexistentes
    // (não revela quais e-mails estão cadastrados).
    if (this.limitador.contar(chaveFalhas, JANELA_FALHAS_SEG * 1000) >= MAX_FALHAS) {
      throw new HttpException(MSG_MUITAS_TENTATIVAS, HttpStatus.TOO_MANY_REQUESTS);
    }

    const usuario = await this.prisma.usuario.findUnique({ where: { email } });
    const ativoParaLogin = usuario && !usuario.excluidoEm ? usuario : null;

    if (ativoParaLogin?.bloqueadoAte && ativoParaLogin.bloqueadoAte > new Date()) {
      throw new HttpException(MSG_MUITAS_TENTATIVAS, HttpStatus.TOO_MANY_REQUESTS);
    }

    const confere = await this.senhas.verificar(
      senha,
      ativoParaLogin?.senhaHash ?? null,
    );

    if (!ativoParaLogin || !confere) {
      this.limitador.registrar(chaveFalhas, JANELA_FALHAS_SEG * 1000);

      if (ativoParaLogin) {
        const falhas = ativoParaLogin.tentativasFalhas + 1;
        await this.prisma.usuario.update({
          where: { id: ativoParaLogin.id },
          data: {
            tentativasFalhas: falhas,
            ...(falhas >= MAX_FALHAS
              ? { bloqueadoAte: new Date(Date.now() + BLOQUEIO_MS), tentativasFalhas: 0 }
              : {}),
          },
        });
      }

      throw new UnauthorizedException(MSG_CREDENCIAIS);
    }

    // Senha correta, mas a conta está bloqueada pela academia.
    if (ativoParaLogin.status === 'BLOQUEADO') {
      throw new ForbiddenException(
        'Acesso bloqueado. Procure a recepção da academia.',
      );
    }

    this.limitador.limparChave(chaveFalhas);

    await this.prisma.usuario.update({
      where: { id: ativoParaLogin.id },
      data: {
        tentativasFalhas: 0,
        bloqueadoAte: null,
        ultimoAcessoEm: new Date(),
      },
    });

    const sessao = await this.criarSessao(ativoParaLogin.id, contexto);

    return { usuario: ativoParaLogin, sessao };
  }

  private async criarSessao(
    usuarioId: number,
    contexto: { ip?: string; userAgent?: string },
  ): Promise<DadosSessao> {
    const token = gerarToken();
    const csrfToken = gerarToken();
    const expiraEm = new Date(Date.now() + duracaoSessaoMs());

    await this.prisma.sessao.create({
      data: {
        usuarioId,
        tokenHash: hashToken(token),
        csrfToken,
        expiraEm,
        ip: contexto.ip?.slice(0, 64) ?? null,
        userAgent: contexto.userAgent?.slice(0, 255) ?? null,
      },
    });

    return { token, expiraEm, csrfToken };
  }

  async logout(sessaoId: number): Promise<void> {
    await this.prisma.sessao.updateMany({
      where: { id: sessaoId, revogadaEm: null },
      data: { revogadaEm: new Date() },
    });
  }

  /** Dados da sessão atual (usado pelos frontends ao carregar cada página). */
  async sessaoAtual(sessaoId: number) {
    const sessao = await this.prisma.sessao.findUniqueOrThrow({
      where: { id: sessaoId },
      select: {
        csrfToken: true,
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
            perfil: true,
            deveTrocarSenha: true,
          },
        },
      },
    });

    return sessao;
  }

  // ------------------------------------------------------------
  // SENHAS
  // ------------------------------------------------------------

  async alterarSenha(
    usuarioId: number,
    sessaoId: number,
    senhaAtual: string,
    novaSenha: string,
  ): Promise<void> {
    const usuario = await this.prisma.usuario.findUniqueOrThrow({
      where: { id: usuarioId },
    });

    // Mesmo controle de tentativas do login: a senha atual não pode ser
    // adivinhada por uma sessão sequestrada.
    this.limitador.consumir(`alterar-senha:${usuarioId}`, 5, 15 * 60);

    if (!(await this.senhas.verificar(senhaAtual, usuario.senhaHash))) {
      throw new BadRequestException('A senha atual está incorreta.');
    }

    if (senhaAtual === novaSenha) {
      throw new BadRequestException('A nova senha deve ser diferente da atual.');
    }

    await this.prisma.$transaction([
      this.prisma.usuario.update({
        where: { id: usuarioId },
        data: {
          senhaHash: await this.senhas.gerarHash(novaSenha),
          deveTrocarSenha: false,
          ...(usuario.status === 'PENDENTE' ? { status: 'ATIVO' } : {}),
        },
      }),
      this.prisma.sessao.updateMany({
        where: {
          usuarioId,
          revogadaEm: null,
          id: { not: sessaoId },
        },
        data: { revogadaEm: new Date() },
      }),
      this.prisma.tokenAcesso.updateMany({
        where: {
          usuarioId,
          usadoEm: null,
        },
        data: { usadoEm: new Date() },
      }),
    ]);
  }

  /** Pedido de recuperação: a resposta é sempre a mesma, exista ou não o e-mail. */
  async solicitarRecuperacao(emailBruto: string): Promise<void> {
    const email = normalizarEmail(emailBruto);

    // Limite por e-mail (além do limite por IP da rota).
    this.limitador.consumir(`recuperacao:${email}`, 3, 60 * 60);

    const usuario = await this.prisma.usuario.findUnique({ where: { email } });

    if (!usuario || usuario.excluidoEm || usuario.status === 'BLOQUEADO') {
      return;
    }

    const token = await this.usuarios.criarToken(usuario.id, 'RECUPERACAO');
    await this.mail.enviarRecuperacao(usuario.email, usuario.nome, token);
  }

  /** Consome um token de convite ou de recuperação e define a nova senha. */
  async definirSenhaPorToken(
    tipo: TipoToken,
    token: string,
    novaSenha: string,
  ): Promise<void> {
    const tokenHash = hashToken(token);
    const senhaHash = await this.senhas.gerarHash(novaSenha);
    const invalido = new BadRequestException(
      'Link inválido ou expirado. Peça um novo.',
    );

    await this.prisma.$transaction(async (tx) => {
      const registro = await tx.tokenAcesso.findUnique({
        where: { tokenHash },
        include: { usuario: true },
      });

      if (
        !registro ||
        registro.tipo !== tipo ||
        registro.usadoEm ||
        registro.expiraEm <= new Date() ||
        registro.usuario.excluidoEm
      ) {
        throw invalido;
      }

      // Uso único, mesmo com duas requisições simultâneas: só uma atualiza a linha.
      const consumido = await tx.tokenAcesso.updateMany({
        where: { id: registro.id, usadoEm: null },
        data: { usadoEm: new Date() },
      });

      if (consumido.count !== 1) {
        throw invalido;
      }

      await tx.usuario.update({
        where: { id: registro.usuarioId },
        data: {
          senhaHash,
          deveTrocarSenha: false,
          tentativasFalhas: 0,
          bloqueadoAte: null,
          ...(registro.usuario.status === 'PENDENTE' ? { status: 'ATIVO' } : {}),
        },
      });

      // A senha mudou: encerra qualquer sessão aberta.
      await tx.sessao.updateMany({
        where: { usuarioId: registro.usuarioId, revogadaEm: null },
        data: { revogadaEm: new Date() },
      });

      // Invalida todos os outros convites e links de recuperação.
      await tx.tokenAcesso.updateMany({
        where: {
          usuarioId: registro.usuarioId,
          usadoEm: null,
        },
        data: { usadoEm: new Date() },
      });
    });
  }
}

