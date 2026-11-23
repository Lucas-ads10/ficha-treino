import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
} from '@nestjs/common';

import {
  exigirAlunoId,
  Perfis,
  UsuarioAtual,
  type UsuarioAutenticado,
} from '../../common/decorators.js';
import { PagamentosService, RegistrarPagamentoDto } from './pagamentos.service.js';

@Controller()
export class PagamentosController {
  constructor(private readonly pagamentos: PagamentosService) {}

  // ---- Administrador: financeiro de qualquer aluno ----

  @Perfis('ADMIN')
  @Post('alunos/:id/pagamentos')
  async registrar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: RegistrarPagamentoDto,
    @UsuarioAtual() admin: UsuarioAutenticado,
  ) {
    return {
      sucesso: true,
      pagamentos: await this.pagamentos.registrar(id, dto, admin.id),
    };
  }

  @Perfis('ADMIN')
  @Get('alunos/:id/pagamentos')
  async listar(@Param('id', ParseIntPipe) id: number) {
    return { sucesso: true, pagamentos: await this.pagamentos.listar(id) };
  }

  // ---- Aluno: SOMENTE o próprio financeiro (id vem da sessão) ----

  @Perfis('ALUNO')
  @Get('me/pagamentos')
  async meusPagamentos(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return {
      sucesso: true,
      pagamentos: await this.pagamentos.listar(exigirAlunoId(usuario)),
    };
  }
}
