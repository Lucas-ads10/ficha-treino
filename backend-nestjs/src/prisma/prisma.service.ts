import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';

import { PrismaClient } from '../generated/prisma/client.js';
import { montarOpcoesSsl, type OpcoesSsl } from './database-ssl.js';

const logger = new Logger('PrismaService');

function resolverSsl(config: ConfigService): OpcoesSsl {
  try {
    const { opcoes, origemCa } = montarOpcoesSsl({
      DB_SSL_CA: config.get<string>('DB_SSL_CA'),
      DB_SSL_CA_PATH: config.get<string>('DB_SSL_CA_PATH'),
    });

    if (origemCa === 'sistema') {
      logger.warn(
        'Nenhuma CA configurada (DB_SSL_CA / DB_SSL_CA_PATH). ' +
          'Usando só as CAs do sistema: a conexão Prisma com a Aiven deve falhar.',
      );
    }

    return opcoes;
  } catch (erro) {
    // Não derruba a aplicação inteira: as rotas legadas (mysql2) precisam
    // continuar no ar durante a transição. A verificação do certificado
    // continua ligada.
    logger.error(erro instanceof Error ? erro.message : String(erro));
    return { rejectUnauthorized: true };
  }
}

const HOSTS_LOCAIS = new Set(['localhost', '127.0.0.1', '::1']);

/**
 * TLS só pode ser desligado (DB_SSL=false) quando o banco está NESTA máquina
 * (desenvolvimento e testes). Para qualquer outro host a opção é ignorada:
 * o TLS validado é obrigatório.
 */
function tlsDesativadoPermitido(config: ConfigService): boolean {
  const host = config.get<string>('DB_HOST') ?? '';

  if (config.get<string>('DB_SSL')?.toLowerCase() !== 'false') {
    return false;
  }

  if (!HOSTS_LOCAIS.has(host)) {
    logger.error('DB_SSL=false ignorado: só é aceito para banco local (localhost).');
    return false;
  }

  return true;
}

function criarAdapter(config: ConfigService): PrismaMariaDb {
  return new PrismaMariaDb({
    host: config.get<string>('DB_HOST'),
    port: Number(config.get<string>('DB_PORT')) || 3306,
    user: config.get<string>('DB_USER'),
    password: config.get<string>('DB_PASSWORD'),
    database: config.get<string>('DB_NAME'),
    connectionLimit: 5,
    // O padrão do driver (1 s) é curto demais para a Aiven e para o Render
    // acordando do repouso.
    connectTimeout: 15000,
    acquireTimeout: 20000,
    ssl: tlsDesativadoPermitido(config) ? false : resolverSsl(config),
  });
}

/**
 * Cliente Prisma único, compartilhado por todos os módulos (PrismaModule é global).
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(config: ConfigService) {
    super({ adapter: criarAdapter(config) });
  }

  onModuleInit(): void {
    // Não bloqueia o boot: a verificação roda em segundo plano para que a API
    // abra a porta rápido (o Render exige isso) e os endpoints legados
    // continuem no ar mesmo se o Prisma não conseguir conectar.
    void this.verificarConexao();
  }

  private async verificarConexao(): Promise<void> {
    try {
      // O $connect() do adapter é preguiçoso; só uma query prova a conexão.
      await this.$queryRaw`SELECT 1`;
      logger.log('Prisma conectado ao MySQL (TLS validado).');
    } catch (erro) {
      const detalhe =
        erro instanceof Error
          ? (erro.message.split('\n').filter((linha) => linha.trim()).at(-1)?.trim() ?? erro.name)
          : String(erro);

      logger.error(`Prisma não conseguiu conectar: ${detalhe}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
