/**
 * Trava de segurança dos testes de integração.
 *
 * Eles apagam e recriam registros nas tabelas do sistema, então só podem rodar
 * contra um MySQL LOCAL. Se algo apontar para outro host (por exemplo a Aiven,
 * por engano de configuração), tudo é abortado antes de abrir qualquer conexão.
 */
const host = process.env.DB_HOST ?? '';
const locais = ['127.0.0.1', 'localhost', '::1'];

if (!locais.includes(host)) {
  throw new Error(
    `ABORTADO: os testes de integração só rodam em banco local (DB_HOST=${host || '(vazio)'}).`,
  );
}

if (!/teste/i.test(process.env.DB_NAME ?? '')) {
  throw new Error(
    `ABORTADO: o nome do banco de testes deve conter "teste" (DB_NAME=${process.env.DB_NAME}).`,
  );
}
