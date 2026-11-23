import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import {
  NOME_COOKIE_SESSAO,
  opcoesCookieSessao,
} from '../../common/ambiente.js';
import {
  LimiteTaxa,
  PermiteTrocaPendente,
  Publico,
  UsuarioAtual,
  type UsuarioAutenticado,
} from '../../common/decorators.js';
import type { Perfil } from '../../generated/prisma/enums.js';
import {
  AlterarSenhaDto,
  EsqueciSenhaDto,
  LoginDto,
  TokenSenhaDto,
} from './auth.dto.js';
import { AuthService } from './auth.service.js';

const DESTINO: Record<Perfil, string> = {
  ADMIN: '/admin/',
  ALUNO: '/ficha/',
};

@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Publico()
  @LimiteTaxa({ nome: 'login', max: 20, janelaSeg: 15 * 60 })
  @HttpCode(200)
  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { usuario, sessao } = await this.auth.login(dto.email, dto.senha, {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    });

    res.cookie(NOME_COOKIE_SESSAO, sessao.token, {
      ...opcoesCookieSessao(),
      expires: sessao.expiraEm,
    });

    return {
      sucesso: true,
      usuario: {
        id: usuario.id,
        nome: usuario.nome,
        email: usuario.email,
        perfil: usuario.perfil,
        deveTrocarSenha: usuario.deveTrocarSenha,
      },
      csrfToken: sessao.csrfToken,
      destino: DESTINO[usuario.perfil],
    };
  }

  @PermiteTrocaPendente()
  @HttpCode(200)
  @Post('logout')
  async logout(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.auth.logout(usuario.sessaoId);
    res.clearCookie(NOME_COOKIE_SESSAO, opcoesCookieSessao());
    return { sucesso: true };
  }

  @PermiteTrocaPendente()
  @Get('me')
  async me(@UsuarioAtual() usuario: UsuarioAutenticado) {
    const { csrfToken, usuario: dados } = await this.auth.sessaoAtual(
      usuario.sessaoId,
    );

    return {
      sucesso: true,
      usuario: dados,
      csrfToken,
      destino: DESTINO[dados.perfil],
    };
  }

  @PermiteTrocaPendente()
  @HttpCode(200)
  @Post('alterar-senha')
  async alterarSenha(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Body() dto: AlterarSenhaDto,
  ) {
    await this.auth.alterarSenha(
      usuario.id,
      usuario.sessaoId,
      dto.senhaAtual,
      dto.novaSenha,
    );

    return { sucesso: true, mensagem: 'Senha alterada com sucesso.' };
  }

  @Publico()
  @LimiteTaxa({ nome: 'esqueci-senha', max: 10, janelaSeg: 60 * 60 })
  @HttpCode(200)
  @Post('esqueci-senha')
  async esqueciSenha(@Body() dto: EsqueciSenhaDto) {
    await this.auth.solicitarRecuperacao(dto.email);

    // Resposta idêntica exista ou não o e-mail (evita descobrir contas).
    return {
      sucesso: true,
      mensagem:
        'Se o e-mail estiver cadastrado, você receberá um link para redefinir a senha.',
    };
  }

  @Publico()
  @LimiteTaxa({ nome: 'redefinir-senha', max: 10, janelaSeg: 15 * 60 })
  @HttpCode(200)
  @Post('redefinir-senha')
  async redefinirSenha(@Body() dto: TokenSenhaDto) {
    await this.auth.definirSenhaPorToken('RECUPERACAO', dto.token, dto.novaSenha);
    return { sucesso: true, mensagem: 'Senha redefinida. Faça login.' };
  }

  @Publico()
  @LimiteTaxa({ nome: 'convite', max: 10, janelaSeg: 15 * 60 })
  @HttpCode(200)
  @Post('convite/aceitar')
  async aceitarConvite(@Body() dto: TokenSenhaDto) {
    await this.auth.definirSenhaPorToken('CONVITE', dto.token, dto.novaSenha);
    return { sucesso: true, mensagem: 'Senha criada. Faça login.' };
  }
}
