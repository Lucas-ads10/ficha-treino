import { ValidationPipe } from '@nestjs/common';
import type { NestExpressApplication } from '@nestjs/platform-express';
import type { NextFunction, Request, Response } from 'express';

import { emProducao, origensPermitidas } from './common/ambiente.js';

/**
 * Configuração comum da API (usada pelo main.ts e pelos testes):
 * proxy, cabeçalhos de segurança, CORS restrito e validação global dos DTOs.
 */
export function configurarApp(app: NestExpressApplication): void {
  app.disable('x-powered-by');

  // No Render há exatamente um proxy na frente: confia nele para obter o IP real
  // (necessário ao limite de tentativas de login).
  if (emProducao()) {
    app.set('trust proxy', 1);
  }

  app.use((_req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'no-referrer');
    // A API devolve dados de usuário e senhas temporárias: nada de cache.
    res.setHeader('Cache-Control', 'no-store');

    if (emProducao()) {
      res.setHeader(
        'Strict-Transport-Security',
        'max-age=31536000; includeSubDomains',
      );
    }

    next();
  });

  // CORS restrito: só os frontends autorizados, com cookies.
  app.enableCors({
    origin: (origem, retornar) => {
      const permitido =
        !origem || origensPermitidas().includes(origem.replace(/\/+$/, ''));
      retornar(null, permitido);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'X-CSRF-Token'],
    maxAge: 600,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // descarta campos que não estão no DTO
      forbidNonWhitelisted: true, // e recusa a requisição que os enviar
      transform: true,
    }),
  );
}
