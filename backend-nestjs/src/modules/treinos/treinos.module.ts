import { Module } from '@nestjs/common';

import { TreinosController } from './treinos.controller.js';
import { TreinosService } from './treinos.service.js';

/** TreinosModule: execução e histórico dos treinos (Prisma). */
@Module({
  controllers: [TreinosController],
  providers: [TreinosService],
  exports: [TreinosService],
})
export class TreinosModule {}
