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
  Put,
} from '@nestjs/common';

import {
  exigirAlunoId,
  Perfis,
  UsuarioAtual,
  type UsuarioAutenticado,
} from '../../common/decorators.js';
import {
  CriarFichaDto,
  ExercicioDto,
  NomeDto,
  OrdemDto,
} from './fichas.dto.js';
import { FichasService } from './fichas.service.js';

@Controller()
export class FichasController {
  constructor(private readonly fichas: FichasService) {}

  // ============================================================
  // ALUNO: somente a PRÓPRIA ficha (o id vem da sessão, nunca da URL)
  // ============================================================

  @Perfis('ALUNO')
  @Get('me/ficha')
  async minhaFicha(@UsuarioAtual() usuario: UsuarioAutenticado) {
    return {
      sucesso: true,
      ficha: await this.fichas.fichaDoAluno(exigirAlunoId(usuario)),
    };
  }

  // ============================================================
  // ADMINISTRADOR
  // ============================================================

  @Perfis('ADMIN')
  @Get('alunos/:id/fichas')
  async listarDoAluno(@Param('id', ParseIntPipe) id: number) {
    return { sucesso: true, fichas: await this.fichas.listarDoAluno(id) };
  }

  @Perfis('ADMIN')
  @Post('fichas')
  async criar(@Body() dto: CriarFichaDto) {
    return { sucesso: true, ficha: await this.fichas.criar(dto) };
  }

  @Perfis('ADMIN')
  @Patch('fichas/:id')
  async renomear(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: NomeDto,
  ) {
    return { sucesso: true, ficha: await this.fichas.renomear(id, dto.nome) };
  }

  @Perfis('ADMIN')
  @Post('fichas/:id/divisoes')
  async criarDivisao(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: NomeDto,
  ) {
    return { sucesso: true, treino: await this.fichas.criarDivisao(id, dto.nome) };
  }

  @Perfis('ADMIN')
  @HttpCode(200)
  @Put('fichas/:id/divisoes/ordem')
  async reordenarDivisoes(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: OrdemDto,
  ) {
    await this.fichas.reordenarDivisoes(id, dto.ids);
    return { sucesso: true };
  }

  @Perfis('ADMIN')
  @Patch('divisoes/:id')
  async renomearDivisao(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: NomeDto,
  ) {
    return {
      sucesso: true,
      treino: await this.fichas.renomearDivisao(id, dto.nome),
    };
  }

  @Perfis('ADMIN')
  @Delete('divisoes/:id')
  async excluirDivisao(@Param('id', ParseIntPipe) id: number) {
    await this.fichas.excluirDivisao(id);
    return { sucesso: true };
  }

  @Perfis('ADMIN')
  @Post('divisoes/:id/exercicios')
  async criarExercicio(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ExercicioDto,
  ) {
    return {
      sucesso: true,
      exercicio: await this.fichas.criarExercicio(id, dto),
    };
  }

  @Perfis('ADMIN')
  @HttpCode(200)
  @Put('divisoes/:id/exercicios/ordem')
  async reordenarExercicios(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: OrdemDto,
  ) {
    await this.fichas.reordenarExercicios(id, dto.ids);
    return { sucesso: true };
  }

  @Perfis('ADMIN')
  @Patch('exercicios/:id')
  async atualizarExercicio(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ExercicioDto,
  ) {
    return {
      sucesso: true,
      exercicio: await this.fichas.atualizarExercicio(id, dto),
    };
  }

  @Perfis('ADMIN')
  @Delete('exercicios/:id')
  async excluirExercicio(@Param('id', ParseIntPipe) id: number) {
    await this.fichas.excluirExercicio(id);
    return { sucesso: true };
  }
}
