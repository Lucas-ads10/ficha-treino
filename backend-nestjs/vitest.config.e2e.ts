import { defineConfig } from 'vitest/config';

/**
 * Testes de integração: sobem a API inteira (NestJS + Prisma) contra um MySQL
 * LOCAL descartável. NUNCA apontam para a Aiven: o setup aborta se DB_HOST não
 * for local. Veja test/setup-e2e.ts.
 *
 * Variáveis fixadas aqui têm prioridade sobre o .env (que tem credenciais reais).
 */
export default defineConfig({
  resolve: { tsconfigPaths: true },
  // Nest usa injeção de dependências por metadados de decorators.
  oxc: { decorator: { legacy: true, emitDecoratorMetadata: true } },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    exclude: ['node_modules/**', 'dist/**'],
    setupFiles: ['./test/setup-e2e.ts'],
    fileParallelism: false,
    testTimeout: 60_000,
    hookTimeout: 120_000,
    env: {
      NODE_ENV: 'test',
      DB_HOST: process.env.TEST_DB_HOST ?? '127.0.0.1',
      DB_PORT: process.env.TEST_DB_PORT ?? '3399',
      DB_USER: process.env.TEST_DB_USER ?? 'root',
      DB_PASSWORD: process.env.TEST_DB_PASSWORD ?? '',
      DB_NAME: process.env.TEST_DB_NAME ?? 'caverna_teste',
      DB_SSL: 'false',
      DB_SSL_CA_PATH: '',
      DB_SSL_CA: '',
      DATABASE_URL: '',
      MAIL_PROVIDER: 'memory',
      CORS_ORIGENS: 'http://localhost:5500',
      COOKIE_DOMAIN: '',
      COOKIE_SAMESITE: 'lax',
    },
  },
});
