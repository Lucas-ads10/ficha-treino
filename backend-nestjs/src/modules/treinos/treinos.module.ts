
import { Module } from '@nestjs/common';
import { DatabaseModule } from '../../database/database.module.js';
import { TreinosController } from './treinos.controller.js';
import { TreinosRepository } from './treinos.repository.js';
import { TreinosService } from './treinos.service.js';

@Module({
  imports: [DatabaseModule],
  controllers: [TreinosController],
  providers: [TreinosRepository, TreinosService],
  exports: [TreinosService],
})
export class TreinosModule {}
