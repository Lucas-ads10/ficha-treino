/**
 * Configuração de ambiente (CORS, cookies, e-mail). Lida a cada uso, a partir de
 * process.env (o ConfigModule já carregou o .env).
 */

export function emProducao(): boolean {
  return process.env.NODE_ENV === 'production';
}

function lista(valor: string | undefined): string[] {
  return (valor ?? '')
    .split(',')
    .map((item) => item.trim().replace(/\/+$/, ''))
    .filter(Boolean);
}

/** Origens (frontends) autorizadas a chamar a API com cookies. */
export function origensPermitidas(): string[] {
  const configuradas = lista(process.env.CORS_ORIGENS);

  if (configuradas.length > 0) {
    return configuradas;
  }

  return emProducao()
    ? ['https://ctcaverna.com.br', 'https://www.ctcaverna.com.br']
    : [
        'http://localhost:5500',
        'http://127.0.0.1:5500',
        'http://localhost:8080',
        'http://localhost:3000',
      ];
}

/** URL pública do frontend, usada nos links enviados por e-mail. */
export function urlFrontend(): string {
  const configurada = process.env.FRONTEND_URL?.trim().replace(/\/+$/, '');
  return configurada || origensPermitidas()[0];
}

export interface OpcoesCookie {
  httpOnly: true;
  secure: boolean;
  sameSite: 'lax' | 'strict' | 'none';
  domain?: string;
  path: string;
}

export function opcoesCookieSessao(): OpcoesCookie {
  const sameSiteEnv = (process.env.COOKIE_SAMESITE ?? 'lax').toLowerCase();
  const sameSite = (['lax', 'strict', 'none'] as const).includes(
    sameSiteEnv as 'lax',
  )
    ? (sameSiteEnv as 'lax' | 'strict' | 'none')
    : 'lax';

  // Secure é obrigatório em produção e quando SameSite=None.
  const secure =
    emProducao() ||
    sameSite === 'none' ||
    process.env.COOKIE_SECURE?.toLowerCase() === 'true';

  const domain = process.env.COOKIE_DOMAIN?.trim();

  return {
    httpOnly: true,
    secure,
    sameSite,
    ...(domain ? { domain } : {}),
    path: '/',
  };
}

export const NOME_COOKIE_SESSAO = 'caverna_sessao';

export function duracaoSessaoMs(): number {
  const horas = Number(process.env.SESSAO_DURACAO_HORAS);
  return (Number.isFinite(horas) && horas > 0 ? horas : 24 * 7) * 3_600_000;
}
