import { Global, Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';

import { ErrosFilter } from './erros.filter.js';
import { LimitadorTaxaService } from './limitador-taxa.service.js';
import { SenhaService } from './senha.service.js';
import { SessaoGuard } from './sessao.guard.js';

/**
 * CommonModule: recursos compartilhados.
 *  - SessaoGuard (global): toda rota exige sessão, exceto as marcadas @Publico().
 *  - ErrosFilter (global): respostas de erro padronizadas, sem vazar detalhes internos.
 *  - SenhaService: hash Argon2id.
 *  - LimitadorTaxaService: limite de tentativas.
 */
@Global()
@Module({
  providers: [
    SenhaService,
    LimitadorTaxaService,
    { provide: APP_GUARD, useClass: SessaoGuard },
    { provide: APP_FILTER, useClass: ErrosFilter },
  ],
  exports: [SenhaService, LimitadorTaxaService],
})
export class CommonModule {}
