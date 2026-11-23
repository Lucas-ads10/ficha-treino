import { Module } from '@nestjs/common';

import { FichasController } from './fichas.controller.js';
import { FichasService } from './fichas.service.js';

/**
 * FichasModule: fichas de treino, divisões ("treinos"), exercícios, ordem,
 * substituição de ficha (com histórico) e a ficha do aluno logado.
 */
@Module({
  controllers: [FichasController],
  providers: [FichasService],
  exports: [FichasService],
})
export class FichasModule {}
