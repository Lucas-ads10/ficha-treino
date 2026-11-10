
import { Controller, Get, Inject } from '@nestjs/common';
import type { Pool } from 'mysql2/promise';

@Controller('teste-mysql')
export class DatabaseController {
  constructor(
    @Inject('MYSQL_POOL')
    private readonly pool: Pool,
  ) {}

  @Get()
  async testarConexao() {
    const [resultado] = await this.pool.query(
      'SELECT 1 AS conectado',
    );

    return {
      sucesso: true,
      mensagem: 'Conexão com MySQL realizada com sucesso!',
      resultado,
    };
  }
}
