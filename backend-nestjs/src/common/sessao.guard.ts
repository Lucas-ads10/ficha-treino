import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  HttpException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';

import { PrismaService } from '../prisma/prisma.service.js';
import { NOME_COOKIE_SESSAO, origensPermitidas } from './ambiente.js';
import {
  type ConfigLimiteTaxa,
  LIMITE_TAXA,
  PERFIS,
  PERMITE_TROCA_PENDENTE,
  PUBLICO,
  type UsuarioAutenticado,
} from './decorators.js';
import { LimitadorTaxaService } from './limitador-taxa.service.js';
import { hashToken, iguaisSeguro } from './senha.service.js';
import type { Perfil } from '../generated/prisma/enums.js';

const METODOS_SEGUROS = new Set(['GET', 'HEAD', 'OPTIONS']);

export function lerCookie(req: Request, nome: string): string | undefined {
  const cabecalho = req.headers.cookie;

  if (!cabecalho) {
    return undefined;
  }

  for (const parte of cabecalho.split(';')) {
    const indice = parte.indexOf('=');

    if (indice > 0 && parte.slice(0, indice).trim() === nome) {
      try {
        return decodeURIComponent(parte.slice(indice + 1).trim());
      } catch {
        return undefined;
      }
    }
  }

  return undefined;
}

/**
 * Guard GLOBAL: toda rota exige sessão válida, a menos que use @Publico().
 * Isso fecha por padrão qualquer rota nova ou antiga esquecida sem proteção.
 *
 * Em ordem: limite de taxa → origem (CSRF) → sessão → conta ativa →
 * troca de senha obrigatória → perfil (ADMIN/ALUNO) → token anti-CSRF.
 */
@Injectable()
export class SessaoGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService,
    private readonly limitador: LimitadorTaxaService,
  ) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    const req = contexto.switchToHttp().getRequest<
      Request & {
        usuario?: UsuarioAutenticado;
      }
    >();
    const alvos = [contexto.getHandler(), contexto.getClass()];

    const limite = this.reflector.getAllAndOverride<ConfigLimiteTaxa>(
      LIMITE_TAXA,
      alvos,
    );

    if (limite) {
      this.limitador.consumir(
        `${limite.nome}:ip:${req.ip}`,
        limite.max,
        limite.janelaSeg,
      );
    }

    const metodoMuda = !METODOS_SEGUROS.has(req.method);

    // Defesa em profundidade contra CSRF: se o navegador informou a origem,
    // ela precisa ser um dos frontends autorizados.
    if (metodoMuda) {
      this.validarOrigem(req);
    }

    if (this.reflector.getAllAndOverride<boolean>(PUBLICO, alvos)) {
      return true;
    }

    const token = lerCookie(req, NOME_COOKIE_SESSAO);

    if (!token) {
      throw new UnauthorizedException('Faça login para continuar.');
    }

    const sessao = await this.prisma.sessao.findUnique({
      where: { tokenHash: hashToken(token) },
      include: {
        usuario: {
          select: {
            id: true,
            nome: true,
            email: true,
            perfil: true,
            status: true,
            excluidoEm: true,
            deveTrocarSenha: true,
            aluno: { select: { id: true } },
          },
        },
      },
    });

    if (!sessao || sessao.revogadaEm || sessao.expiraEm <= new Date()) {
      throw new UnauthorizedException('Sessão expirada. Faça login novamente.');
    }

    const { usuario } = sessao;

    if (usuario.excluidoEm) {
      throw new UnauthorizedException('Sessão expirada. Faça login novamente.');
    }

    if (usuario.status === 'BLOQUEADO') {
      throw new ForbiddenException(
        'Acesso bloqueado. Procure a recepção da academia.',
      );
    }

    if (
      usuario.deveTrocarSenha &&
      !this.reflector.getAllAndOverride<boolean>(PERMITE_TROCA_PENDENTE, alvos)
    ) {
      throw new HttpException(
        { mensagem: 'Crie uma nova senha para continuar.', codigo: 'TROCA_SENHA_OBRIGATORIA' },
        403,
      );
    }

    const perfisPermitidos = this.reflector.getAllAndOverride<Perfil[]>(
      PERFIS,
      alvos,
    );

    if (perfisPermitidos && !perfisPermitidos.includes(usuario.perfil)) {
      throw new ForbiddenException('Você não tem permissão para esta ação.');
    }

    if (metodoMuda) {
      const enviado = req.headers['x-csrf-token'];

      if (typeof enviado !== 'string' || !iguaisSeguro(enviado, sessao.csrfToken)) {
        throw new ForbiddenException(
          'Requisição recusada (token de segurança ausente ou inválido). Recarregue a página.',
        );
      }
    }

    req.usuario = {
      id: usuario.id,
      nome: usuario.nome,
      email: usuario.email,
      perfil: usuario.perfil,
      alunoId: usuario.aluno?.id ?? null,
      sessaoId: sessao.id,
      deveTrocarSenha: usuario.deveTrocarSenha,
    };

    return true;
  }

  private validarOrigem(req: Request): void {
    const origem = req.headers.origin;

    if (origem && !origensPermitidas().includes(origem.replace(/\/+$/, ''))) {
      throw new ForbiddenException('Origem não autorizada.');
    }
  }
}
