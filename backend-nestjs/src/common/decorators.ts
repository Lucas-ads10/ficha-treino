import {
  createParamDecorator,
  type ExecutionContext,
  SetMetadata,
} from '@nestjs/common';

import type { Perfil } from '../generated/prisma/enums.js';

export const PUBLICO = 'caverna:publico';
export const PERFIS = 'caverna:perfis';
export const PERMITE_TROCA_PENDENTE = 'caverna:permite-troca-pendente';
export const LIMITE_TAXA = 'caverna:limite-taxa';

/** Rota sem login (login, recuperação de senha, aceite de convite). */
export const Publico = () => SetMetadata(PUBLICO, true);

/** Restringe a rota aos perfis informados. */
export const Perfis = (...perfis: Perfil[]) => SetMetadata(PERFIS, perfis);

/** Rota liberada mesmo quando o usuário ainda precisa trocar a senha. */
export const PermiteTrocaPendente = () =>
  SetMetadata(PERMITE_TROCA_PENDENTE, true);

export interface ConfigLimiteTaxa {
  nome: string;
  max: number;
  janelaSeg: number;
}

/** Limita as requisições por IP (em memória) para a rota. */
export const LimiteTaxa = (config: ConfigLimiteTaxa) =>
  SetMetadata(LIMITE_TAXA, config);

/** Usuário da sessão atual. NUNCA vem do corpo ou da URL da requisição. */
export interface UsuarioAutenticado {
  id: number;
  nome: string;
  email: string;
  perfil: Perfil;
  /** Preenchido só para ALUNO: id interno do cadastro de aluno. */
  alunoId: number | null;
  sessaoId: number;
  deveTrocarSenha: boolean;
}

export const UsuarioAtual = createParamDecorator(
  (_dados: unknown, contexto: ExecutionContext): UsuarioAutenticado => {
    const req = contexto.switchToHttp().getRequest<{
      usuario: UsuarioAutenticado;
    }>();
    return req.usuario;
  },
);

/** Id do aluno logado; falha se a conta não for de aluno. */
export function exigirAlunoId(usuario: UsuarioAutenticado): number {
  if (usuario.alunoId === null) {
    throw new Error('Rota exclusiva de aluno acessada sem cadastro de aluno.');
  }
  return usuario.alunoId;
}
