
import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';

import { TreinosService } from './treinos.service.js';

@Controller()
export class TreinosController {
  private readonly logger = new Logger(TreinosController.name);

  constructor(private readonly service: TreinosService) {}

  @Post('treinos')
  async salvarTreino(@Body() dados: any) {
    try {
      const resultado = await this.service.salvarTreino(dados);

      return {
        sucesso: true,
        mensagem: resultado.mensagem,
        data_treino: resultado.data_treino,
      };
    } catch (erro) {
      this.logger.error('Erro ao salvar treino:', erro);

      if (erro instanceof InternalServerErrorException) {
        throw erro;
      }

      throw erro;
    }
  }

  @Get('ultimo-treino/:treino/:exercicio')
  async buscarUltimoTreino(
    @Param('treino') treino: string,
    @Param('exercicio') exercicio: string,
  ) {
    try {
      return await this.service.buscarUltimoTreino(
        treino,
        decodeURIComponent(exercicio),
      );
    } catch (erro) {
      this.logger.error('Erro ao buscar último treino:', erro);

      throw new InternalServerErrorException({
        sucesso: false,
        mensagem: 'Erro ao buscar último treino.',
        erro: erro instanceof Error ? erro.message : String(erro),
      });
    }
  }

  @Get('treinos')
  async buscarTodos() {
    try {
      const treinos = await this.service.buscarTodos();

      return {
        sucesso: true,
        treinos,
      };
    } catch (erro) {
      this.logger.error('Erro ao buscar treinos:', erro);

      throw new InternalServerErrorException({
        sucesso: false,
        mensagem: 'Erro ao buscar treinos.',
        erro: erro instanceof Error ? erro.message : String(erro),
      });
    }
  }

  @Get('teste-mysql')
  async testarConexao() {
    try {
      const resultado = await this.service.testarConexao();

      return {
        sucesso: true,
        mensagem: 'MySQL conectado com sucesso! 🗄️',
        resultado,
      };
    } catch (erro) {
      this.logger.error('Erro ao conectar no MySQL:', erro);

      throw new InternalServerErrorException({
        sucesso: false,
        mensagem: 'Erro ao conectar no MySQL.',
        erro: erro instanceof Error ? erro.message : String(erro),
      });
    }
  }
}
