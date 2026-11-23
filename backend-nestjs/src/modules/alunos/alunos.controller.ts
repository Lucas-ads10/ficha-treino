import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';

import {
  Perfis,
  UsuarioAtual,
  type UsuarioAutenticado,
} from '../../common/decorators.js';
import { AtualizarAlunoDto, CriarAlunoDto } from './alunos.dto.js';
import { AlunosService } from './alunos.service.js';

/** Gestão de alunos: exclusiva do administrador (validada no backend). */
@Perfis('ADMIN')
@Controller('alunos')
export class AlunosController {
  constructor(private readonly alunos: AlunosService) {}

  @Get()
  async listar(@Query('busca') busca?: string) {
    return { sucesso: true, alunos: await this.alunos.listar(busca) };
  }

  @Get(':id')
  async obter(@Param('id', ParseIntPipe) id: number) {
    return { sucesso: true, aluno: await this.alunos.obter(id) };
  }

  @Post()
  async criar(
    @Body() dto: CriarAlunoDto,
    @UsuarioAtual() admin: UsuarioAutenticado,
  ) {
    const { aluno, conviteEnviado } = await this.alunos.criar(dto, admin.id);
    return { sucesso: true, aluno, conviteEnviado };
  }

  @Patch(':id')
  async atualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: AtualizarAlunoDto,
  ) {
    return { sucesso: true, aluno: await this.alunos.atualizar(id, dto) };
  }

  @HttpCode(200)
  @Post(':id/bloquear')
  async bloquear(@Param('id', ParseIntPipe) id: number) {
    return { sucesso: true, aluno: await this.alunos.bloquear(id) };
  }

  @HttpCode(200)
  @Post(':id/desbloquear')
  async desbloquear(@Param('id', ParseIntPipe) id: number) {
    return { sucesso: true, aluno: await this.alunos.desbloquear(id) };
  }

  @Delete(':id')
  async excluir(@Param('id', ParseIntPipe) id: number) {
    await this.alunos.excluir(id);
    return { sucesso: true };
  }

  @HttpCode(200)
  @Post(':id/convite')
  async convite(@Param('id', ParseIntPipe) id: number) {
    return { sucesso: true, ...(await this.alunos.enviarConvite(id)) };
  }

  @HttpCode(200)
  @Post(':id/senha-temporaria')
  async senhaTemporaria(@Param('id', ParseIntPipe) id: number) {
    return { sucesso: true, ...(await this.alunos.gerarSenhaTemporaria(id)) };
  }
}
