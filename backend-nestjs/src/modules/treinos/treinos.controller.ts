import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';

import {
  exigirAlunoId,
  Perfis,
  UsuarioAtual,
  type UsuarioAutenticado,
} from '../../common/decorators.js';
import {
  RegistrarExecucaoDto,
  RegistrarExecucaoLegadoDto,
} from './treinos.dto.js';
import { TreinosService } from './treinos.service.js';

const limitar = (valor: number | undefined, padrao: number, maximo: number) =>
  Math.min(Math.max(valor ?? padrao, 1), maximo);

@Controller()
export class TreinosController {
  constructor(private readonly treinos: TreinosService) {}

  // ============================================================
  // ALUNO (o id do aluno vem SEMPRE da sessão)
  // ============================================================

  @Perfis('ALUNO')
  @Post('me/execucoes')
  async registrar(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Body() dto: RegistrarExecucaoDto,
  ) {
    const resultado = await this.treinos.registrar(exigirAlunoId(usuario), dto);
    return { sucesso: true, ...resultado };
  }

  @Perfis('ALUNO')
  @Get('me/execucoes')
  listar(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Query('limite', new ParseIntPipe({ optional: true })) limite?: number,
  ) {
    return this.treinos.listarExecucoes(
      exigirAlunoId(usuario),
      limitar(limite, 50, 200),
    );
  }

  @Perfis('ALUNO')
  @Get('me/exercicios/:id/ultimo')
  ultimo(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.treinos.ultimo(exigirAlunoId(usuario), id);
  }

  @Perfis('ALUNO')
  @Get('me/exercicios/:id/historico')
  historico(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Param('id', ParseIntPipe) id: number,
    @Query('limite', new ParseIntPipe({ optional: true })) limite?: number,
  ) {
    return this.treinos.historico(
      exigirAlunoId(usuario),
      id,
      limitar(limite, 10, 50),
    );
  }

  // ============================================================
  // ROTAS ANTIGAS (compatibilidade): agora exigem login de ALUNO e
  // sempre filtram pelo aluno da sessão. O frontend novo não as usa.
  // ============================================================

  @Perfis('ALUNO')
  @Post('treinos')
  async salvarTreinoLegado(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Body() dto: RegistrarExecucaoLegadoDto,
  ) {
    const alunoId = exigirAlunoId(usuario);
    const exercicioId = await this.treinos.exercicioIdPorNome(
      alunoId,
      dto.exercicio,
      dto.treino,
    );

    const resultado = await this.treinos.registrar(alunoId, {
      exercicioId,
      valor: dto.valor,
      series: dto.series,
    });

    return { sucesso: true, ...resultado };
  }

  @Perfis('ALUNO')
  @Get('ultimo-treino/:treino/:exercicio')
  ultimoLegado(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Param('exercicio') exercicio: string,
  ) {
    return this.treinos.ultimoPorNome(exigirAlunoId(usuario), exercicio);
  }

  @Perfis('ALUNO')
  @Get('historico/:treino/:exercicio')
  historicoLegado(
    @UsuarioAtual() usuario: UsuarioAutenticado,
    @Param('exercicio') exercicio: string,
  ) {
    return this.treinos.historicoPorNome(exigirAlunoId(usuario), exercicio);
  }

  // ============================================================
  // ADMINISTRADOR
  // ============================================================

  @Perfis('ADMIN')
  @Get('alunos/:id/execucoes')
  execucoesDoAluno(
    @Param('id', ParseIntPipe) id: number,
    @Query('limite', new ParseIntPipe({ optional: true })) limite?: number,
  ) {
    return this.treinos.execucoesDoAluno(id, limitar(limite, 100, 300));
  }

  /** Antes era pública e devolvia a tabela inteira. Agora só o administrador. */
  @Perfis('ADMIN')
  @Get('treinos')
  async todos() {
    return { sucesso: true, treinos: await this.treinos.todosOsRegistros() };
  }
}
