import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

export interface OpcoesSsl {
  ca?: string;
  rejectUnauthorized: true;
}

/**
 * Monta as opções de TLS para o MySQL da Aiven.
 *
 * A verificação do certificado é SEMPRE ligada (rejectUnauthorized: true).
 * A Aiven usa uma CA própria do projeto, então ela precisa ser informada:
 *
 *  - DB_SSL_CA       conteúdo PEM da CA (use no Render; aceita "\n" literal)
 *  - DB_SSL_CA_PATH  caminho de um arquivo PEM (use em desenvolvimento)
 *
 * Sem nenhuma das duas, usa só as CAs do sistema: a conexão com a Aiven
 * vai FALHAR com erro explícito, em vez de aceitar um certificado
 * qualquer silenciosamente.
 */
export function montarOpcoesSsl(
  env: { DB_SSL_CA?: string; DB_SSL_CA_PATH?: string },
): { opcoes: OpcoesSsl; origemCa: 'env' | 'arquivo' | 'sistema' } {
  const caInline = env.DB_SSL_CA?.trim();

  if (caInline) {
    return {
      opcoes: { ca: caInline.replace(/\\n/g, '\n'), rejectUnauthorized: true },
      origemCa: 'env',
    };
  }

  const caPath = env.DB_SSL_CA_PATH?.trim();

  if (caPath) {
    const caminho = resolve(caPath);

    if (!existsSync(caminho)) {
      throw new Error(`DB_SSL_CA_PATH aponta para um arquivo inexistente: ${caPath}`);
    }

    return {
      opcoes: { ca: readFileSync(caminho, 'utf8'), rejectUnauthorized: true },
      origemCa: 'arquivo',
    };
  }

  return { opcoes: { rejectUnauthorized: true }, origemCa: 'sistema' };
}
