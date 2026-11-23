import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Response } from 'express';

/**
 * Padroniza TODAS as respostas de erro: { sucesso: false, mensagem, codigo? }.
 * Erros inesperados viram uma mensagem genérica: detalhes internos (SQL,
 * stack, caminhos) ficam só no log do servidor e nunca vão para o cliente.
 */
@Catch()
export class ErrosFilter implements ExceptionFilter {
  private readonly logger = new Logger('Erros');

  catch(erro: unknown, host: ArgumentsHost): void {
    const resposta = host.switchToHttp().getResponse<Response>();

    if (erro instanceof HttpException) {
      const status = erro.getStatus();
      const corpo = erro.getResponse();
      let mensagem = erro.message;
      let codigo: string | undefined;

      if (typeof corpo === 'object' && corpo !== null) {
        const objeto = corpo as {
          message?: string | string[];
          mensagem?: string;
          codigo?: string;
        };
        const bruto = objeto.mensagem ?? objeto.message;
        mensagem = Array.isArray(bruto) ? bruto.join(' ') : (bruto ?? mensagem);
        codigo = objeto.codigo;
      }

      resposta
        .status(status)
        .json({ sucesso: false, mensagem, ...(codigo ? { codigo } : {}) });
      return;
    }

    this.logger.error(
      erro instanceof Error ? (erro.stack ?? erro.message) : String(erro),
    );

    resposta.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      sucesso: false,
      mensagem: 'Erro interno. Tente novamente em instantes.',
    });
  }
}
