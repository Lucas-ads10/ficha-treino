import { resolve } from 'node:path';
import { defineConfig } from 'prisma/config';

/**
 * Configuração da CLI do Prisma (db pull, validate, generate, migrate).
 *
 * A aplicação NestJS NÃO usa esta URL: ela conecta pelo adapter
 * (src/prisma/prisma.service.ts). Este arquivo serve só para a CLI.
 */

// A CLI do Prisma 7 não carrega o .env sozinha.
try {
  process.loadEnvFile('.env');
} catch {
  // Sem .env (ex.: Render): usa as variáveis do ambiente.
}

function montarDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }

  const { DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

  if (!DB_HOST || !DB_USER || !DB_NAME) {
    // Permite `prisma validate` e `prisma generate` sem banco configurado.
    return 'mysql://usuario:senha@localhost:3306/banco';
  }

  const url = new URL('mysql://localhost');
  url.hostname = DB_HOST;
  url.port = DB_PORT || '3306';
  url.username = DB_USER;
  url.password = DB_PASSWORD ?? '';
  url.pathname = `/${DB_NAME}`;

  // TLS estrito: valida o certificado do servidor com a CA da Aiven.
  const caPath = process.env.DB_SSL_CA_PATH;
  if (caPath) {
    url.searchParams.set('sslaccept', 'strict');
    url.searchParams.set('sslcert', resolve(caPath));
  }

  return url.toString();
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: montarDatabaseUrl(),
  },
});
